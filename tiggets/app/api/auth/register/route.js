import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword } from '@/lib/crypto';
import { createLog } from '@/lib/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,24}$/;

function validatePassword(password) {
  const checks = {
    minLength: password.length >= 15,
    maxLength: password.length <= 64,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  return {
    checks,
    isValid: Object.values(checks).every(Boolean),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get('username');
    const rawEmail = searchParams.get('email');

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');

    if (rawUsername) {
      const username = rawUsername.trim().toLowerCase();
      if (username.length < 3) {
        return NextResponse.json({ field: 'username', available: false, reason: 'too_short' }, { status: 200 });
      }

      const existing = await users.findOne({ usernameLower: username });
      return NextResponse.json({ field: 'username', available: !existing }, { status: 200 });
    }

    if (rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ field: 'email', available: false, reason: 'invalid_email' }, { status: 200 });
      }

      const existing = await users.findOne({ emailLower: email });
      return NextResponse.json({ field: 'email', available: !existing }, { status: 200 });
    }

    return NextResponse.json({ error: 'Query must include username or email' }, { status: 400 });
  } catch (error) {
    console.error('Register availability check failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const {
      username,
      email,
      firstName,
      lastName,
      password,
      confirmPassword,
      securityQuestions,
      acceptedTerms,
    } = await request.json();

    const normalized = {
      username: String(username || '').trim(),
      usernameLower: String(username || '').trim().toLowerCase(),
      email: String(email || '').trim(),
      emailLower: String(email || '').trim().toLowerCase(),
      firstName: String(firstName || '').trim(),
      lastName: String(lastName || '').trim(),
      password: String(password || ''),
      confirmPassword: String(confirmPassword || ''),
      acceptedTerms: Boolean(acceptedTerms),
      securityQuestions: Array.isArray(securityQuestions) ? securityQuestions : [],
    };

    if (!USERNAME_REGEX.test(normalized.username)) {
      return NextResponse.json({ error: 'Username must be 3-24 chars and can include letters, numbers, ., _, -' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(normalized.emailLower)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (normalized.firstName.length < 2 || normalized.lastName.length < 2) {
      return NextResponse.json({ error: 'First and last name must be at least 2 characters.' }, { status: 400 });
    }

    const passwordValidation = validatePassword(normalized.password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: 'Password does not meet policy requirements.' }, { status: 400 });
    }

    if (normalized.password !== normalized.confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    if (!normalized.acceptedTerms) {
      return NextResponse.json({ error: 'You must accept the Terms and Conditions.' }, { status: 400 });
    }

    if (normalized.securityQuestions.length !== 3) {
      return NextResponse.json({ error: 'Please provide 3 security questions and answers.' }, { status: 400 });
    }

    const questionKeys = normalized.securityQuestions.map((q) => String(q?.question || '').trim());
    const answers = normalized.securityQuestions.map((q) => String(q?.answer || '').trim());

    if (questionKeys.some((q) => !q) || answers.some((a) => a.length < 2)) {
      return NextResponse.json({ error: 'Each security question must have an answer.' }, { status: 400 });
    }

    if (new Set(questionKeys).size !== 3) {
      return NextResponse.json({ error: 'Security questions must be unique.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');

    const [usernameExists, emailExists] = await Promise.all([
      users.findOne({ usernameLower: normalized.usernameLower }),
      users.findOne({ emailLower: normalized.emailLower }),
    ]);

    if (usernameExists) {
      return NextResponse.json({ error: 'Username is unavailable.' }, { status: 409 });
    }

    if (emailExists) {
      return NextResponse.json({ error: 'Email address is already in use.' }, { status: 409 });
    }

    const createdAt = new Date();

    const newUser = {
      username: normalized.username,
      usernameLower: normalized.usernameLower,
      email: normalized.email,
      emailLower: normalized.emailLower,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      role: 'customer',
      passwordHash: hashPassword(normalized.password),
      securityQuestions: normalized.securityQuestions.map((item) => ({
        question: String(item.question).trim(),
        answerHash: hashPassword(String(item.answer).trim().toLowerCase()),
      })),
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAttempt: null,
      createdAt,
      updatedAt: createdAt,
    };

    const result = await users.insertOne(newUser);

    await createLog({
      userId: normalized.username,
      actionType: 'REGISTER_SUCCESS',
      details: `${normalized.username} created a new customer account.`,
      priorityLevel: 'info',
    });

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        userId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
