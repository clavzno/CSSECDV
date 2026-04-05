import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { hashPassword } from '@/lib/crypto';
import { createLog } from '@/lib/logger';
import crypto from 'crypto';

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
    const pendingRegistrations = db.collection('pendingRegistrations');

    if (rawUsername) {
      const username = rawUsername.trim().toLowerCase();
      if (username.length < 3) {
        return NextResponse.json({ field: 'username', available: false, reason: 'too_short' }, { status: 200 });
      }

      const existing = await users.findOne({ usernameLower: username });
      const pendingExisting = await pendingRegistrations.findOne({ usernameLower: username, usedAt: null, expiresAt: { $gt: new Date() } });
      return NextResponse.json({ field: 'username', available: !existing && !pendingExisting }, { status: 200 });
    }

    if (rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ field: 'email', available: false, reason: 'invalid_email' }, { status: 200 });
      }

      const existing = await users.findOne({ emailLower: email });
      const pendingExisting = await pendingRegistrations.findOne({ emailLower: email, usedAt: null, expiresAt: { $gt: new Date() } });
      return NextResponse.json({ field: 'email', available: !existing && !pendingExisting }, { status: 200 });
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
      enableMFA,
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
      enableMFA: Boolean(enableMFA),
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
    const pendingRegistrations = db.collection('pendingRegistrations');

    const [usernameExists, emailExists] = await Promise.all([
      users.findOne({ usernameLower: normalized.usernameLower }),
      users.findOne({ emailLower: normalized.emailLower }),
    ]);

    const [pendingUsernameExists, pendingEmailExists] = await Promise.all([
      pendingRegistrations.findOne({ usernameLower: normalized.usernameLower, usedAt: null, expiresAt: { $gt: new Date() } }),
      pendingRegistrations.findOne({ emailLower: normalized.emailLower, usedAt: null, expiresAt: { $gt: new Date() } }),
    ]);

    if (usernameExists || pendingUsernameExists) {
      return NextResponse.json({ error: 'Username is unavailable.' }, { status: 409 });
    }

    if (emailExists || pendingEmailExists) {
      return NextResponse.json({ error: 'Email address is already in use.' }, { status: 409 });
    }

    const createdAt = new Date();

    const pendingRegistration = {
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
      enableMFA: normalized.enableMFA,
      createdAt,
      updatedAt: createdAt,
      usedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };

    const result = await pendingRegistrations.insertOne(pendingRegistration);

    // If MFA is not enabled, create the user directly
    if (!normalized.enableMFA) {
      const finalUser = {
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
        mfaEnabled: false,
        createdAt,
        updatedAt: createdAt,
      };

      const userResult = await users.insertOne(finalUser);

      // Mark pending registration as used
      await pendingRegistrations.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            usedAt: new Date(),
            finalUserId: userResult.insertedId,
            updatedAt: new Date(),
          },
        }
      );

      await createLog({
        userId: normalized.username,
        actionType: 'REGISTER_SUCCESS',
        details: `${normalized.username} completed account registration without MFA.`,
        priorityLevel: 'info',
      });

      return NextResponse.json(
        {
          message: 'Account created successfully.',
          nextStep: 'account_created',
          redirectPath: '/',
        },
        { status: 201 }
      );
    }

    // If MFA is enabled, proceed with MFA setup
    const setupToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');
    const setupExpiresAt = pendingRegistration.expiresAt;

    await pendingRegistrations.updateOne(
      { _id: result.insertedId },
      {
        $set: {
          setupTokenHash: tokenHash,
          updatedAt: new Date(),
        },
      }
    );

    const cookieStore = await cookies();
    cookieStore.set('mfa_setup', setupToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: setupExpiresAt,
    });

    await createLog({
      userId: normalized.username,
      actionType: 'REGISTER_SUCCESS',
      details: `${normalized.username} started account verification for a new customer account.`,
      priorityLevel: 'info',
    });

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        nextStep: 'mfa_setup',
        setupPath: '/MFASetup',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
