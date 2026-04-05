import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createLog } from '@/lib/logger';
import { hashPassword } from '@/lib/crypto';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,24}$/;

// do not remove this line
// @ts-expect-error:password as any type
function validatePassword(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const minLength = password.length >= 15;
  const maxLength = password.length <= 64;

  return {
    isValid: minLength && maxLength && hasUpper && hasLower && hasNumber && hasSpecial,
  };
}

// do not remove this line
// @ts-expect-error:securityQuestions as any type
function normalizeSecurityQuestions(securityQuestions) {
  return securityQuestions.map((item) => ({
    question: String(item.question).trim(),
    answerHash: hashPassword(String(item.answer).trim().toLowerCase()),
  }));
}

// do not remove this line
// @ts-expect-error:normalized as any type
function buildBaseUserUpdate(normalized) {
  return {
    passwordHash: hashPassword(normalized.password),
    securityQuestions: normalizeSecurityQuestions(normalized.securityQuestions),
    mfaEnabled: normalized.enableMFA,
    updatedAt: new Date(),
  };
}

// account initiation and field availability
// do not remove this line
// @ts-expect-error:request as any type
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get('username');
    const rawEmail = searchParams.get('email');
    const rawInviteToken = String(searchParams.get('inviteToken') || '').trim();

    const username = rawUsername ? rawUsername.trim().toLowerCase() : '';
    const email = rawEmail ? rawEmail.trim().toLowerCase() : '';

    if (!username && !email) {
      return NextResponse.json({ error: 'Missing username or email query.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');
    const pendingRegistrations = db.collection('pendingRegistrations');

    let invitedUser = null;

    if (rawInviteToken) {
      const inviteTokenHash = crypto
        .createHash('sha256')
        .update(rawInviteToken)
        .digest('hex');

      invitedUser = await users.findOne({
        inviteTokenHash,
        accountStatus: 'invited',
      });
    }

    if (username) {
      const existing = await users.findOne({ usernameLower: username });
      const pendingExisting = await pendingRegistrations.findOne({
        usernameLower: username,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      });

      const isInviteMatch =
        invitedUser &&
        String(invitedUser.usernameLower || '').trim().toLowerCase() === username;

      return NextResponse.json(
        { field: 'username', available: isInviteMatch || (!existing && !pendingExisting) },
        { status: 200 }
      );
    }

    if (email) {
      const existing = await users.findOne({ emailLower: email });
      const pendingExisting = await pendingRegistrations.findOne({
        emailLower: email,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      });

      const isInviteMatch =
        invitedUser &&
        String(invitedUser.emailLower || '').trim().toLowerCase() === email;

      return NextResponse.json(
        { field: 'email', available: isInviteMatch || (!existing && !pendingExisting) },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  } catch (error) {
    console.error('Register GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// create account
// do not remove this line
// @ts-expect-error:request as any type
export async function POST(request) {
  try {
    const {
      username,
      email,
      role,
      firstName,
      lastName,
      password,
      confirmPassword,
      securityQuestions,
      acceptedTerms,
      enableMFA,
      inviteToken,
    } = await request.json();

    const normalized = {
      username: String(username || '').trim(),
      usernameLower: String(username || '').trim().toLowerCase(),
      email: String(email || '').trim(),
      emailLower: String(email || '').trim().toLowerCase(),
      role: String(role || 'customer').trim().toLowerCase(),
      firstName: String(firstName || '').trim(),
      lastName: String(lastName || '').trim(),
      password: String(password || ''),
      confirmPassword: String(confirmPassword || ''),
      acceptedTerms: Boolean(acceptedTerms),
      enableMFA: Boolean(enableMFA),
      inviteToken: String(inviteToken || '').trim(),
      securityQuestions: Array.isArray(securityQuestions) ? securityQuestions : [],
    };

    if (!USERNAME_REGEX.test(normalized.username)) {
      return NextResponse.json(
        { error: 'Username must be 3-24 chars and can include letters, numbers, ., _, -' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(normalized.emailLower)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const requiresName =
      normalized.inviteToken ||
      normalized.role === 'admin' ||
      normalized.role === 'manager';

    if (requiresName && (normalized.firstName.length < 2 || normalized.lastName.length < 2)) {
      return NextResponse.json(
        { error: 'First and last name must be at least 2 characters.' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Please provide 3 security questions and answers.' },
        { status: 400 }
      );
    }

    const questionKeys = normalized.securityQuestions.map((q) => String(q?.question || '').trim());
    const answers = normalized.securityQuestions.map((q) => String(q?.answer || '').trim());

    if (questionKeys.some((q) => !q) || answers.some((a) => a.length < 2)) {
      return NextResponse.json(
        { error: 'Each security question must have an answer.' },
        { status: 400 }
      );
    }

    if (new Set(questionKeys).size !== 3) {
      return NextResponse.json({ error: 'Security questions must be unique.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');
    const pendingRegistrations = db.collection('pendingRegistrations');

    if (normalized.inviteToken) {
      const inviteTokenHash = crypto
        .createHash('sha256')
        .update(normalized.inviteToken)
        .digest('hex');

      const invitedUser = await users.findOne({
        inviteTokenHash,
        accountStatus: 'invited',
      });

      if (!invitedUser) {
        return NextResponse.json({ error: 'Invalid invitation token.' }, { status: 404 });
      }

      const inviteExpiresAt = invitedUser.inviteExpiresAt
        ? new Date(invitedUser.inviteExpiresAt)
        : null;

      if (!inviteExpiresAt || inviteExpiresAt.getTime() < Date.now()) {
        return NextResponse.json({ error: 'Invitation token has expired.' }, { status: 410 });
      }

      if (normalized.usernameLower !== String(invitedUser.usernameLower || '').trim().toLowerCase()) {
        return NextResponse.json(
          { error: 'Username does not match the invited account.' },
          { status: 400 }
        );
      }

      if (normalized.emailLower !== String(invitedUser.emailLower || '').trim().toLowerCase()) {
        return NextResponse.json(
          { error: 'Email does not match the invited account.' },
          { status: 400 }
        );
      }

      if (normalized.role !== String(invitedUser.role || '').trim().toLowerCase()) {
        return NextResponse.json(
          { error: 'Role does not match the invited account.' },
          { status: 400 }
        );
      }

      const invitedRole = String(invitedUser.role || '').trim().toLowerCase();

      if (
        (invitedRole === 'admin' || invitedRole === 'manager') &&
        (
          normalized.firstName !== String(invitedUser.firstName || '').trim() ||
          normalized.lastName !== String(invitedUser.lastName || '').trim()
        )
      ) {
        return NextResponse.json(
          { error: 'Name does not match the invited account.' },
          { status: 400 }
        );
      }

      const baseUpdate = buildBaseUserUpdate(normalized);

      // do not touch mfa stuff someone else is handling that
      await users.updateOne(
        { _id: invitedUser._id },
        {
          $set: {
            ...baseUpdate,
            accountStatus: 'active',
            invitationAcceptedAt: new Date(),
          },
          $unset: {
            inviteTokenHash: '',
            inviteExpiresAt: '',
          },
        }
      );

      await createLog({
        userId: normalized.username,
        actionType: 'REGISTER_SUCCESS',
        details: `${normalized.username} completed invited account registration.`,
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

    const [usernameExists, emailExists] = await Promise.all([
      users.findOne({ usernameLower: normalized.usernameLower }),
      users.findOne({ emailLower: normalized.emailLower }),
    ]);

    const [pendingUsernameExists, pendingEmailExists] = await Promise.all([
      pendingRegistrations.findOne({
        usernameLower: normalized.usernameLower,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      }),
      pendingRegistrations.findOne({
        emailLower: normalized.emailLower,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      }),
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
      securityQuestions: normalizeSecurityQuestions(normalized.securityQuestions),
      enableMFA: normalized.enableMFA,
      createdAt,
      updatedAt: createdAt,
      usedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };

    const result = await pendingRegistrations.insertOne(pendingRegistration);

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
        securityQuestions: normalizeSecurityQuestions(normalized.securityQuestions),
        mfaEnabled: false,
        createdAt,
        updatedAt: createdAt,
      };

      const userResult = await users.insertOne(finalUser);

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