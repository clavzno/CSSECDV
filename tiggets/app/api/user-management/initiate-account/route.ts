import crypto from 'crypto';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog, LOG_EVENT_TYPES } from '@/lib/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,24}$/;
const ALLOWED_ROLES = new Set(['admin', 'manager', 'customer']);

// do not remove this line
// @ts-expect-error:email as any type
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// do not remove this line
// @ts-expect-error:username as any type
function normalizeUsername(username) {
  return String(username || '').trim();
}

// do not remove this line
// @ts-expect-error:inviteToken as any type
function buildInviteUrl(inviteToken) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';

  return `${appUrl}/CreateAccount?invite=${encodeURIComponent(inviteToken)}`;
}

// do not remove this line
// @ts-expect-error:to, username, role, inviteUrl, firstName, lastName as any type
function buildMailToUrl({ to, username, role, inviteUrl, firstName, lastName }) {
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const greeting = displayName || username;

  const subject = `Tiggets Account Setup Invitation`;
  const bodyLines = [
    `Hello ${greeting},`,
    ``,
    `An administrator has initiated an account for you in Tiggets.`,
    `You have been granted the role: ${role}.`,
    ``,
    `DEFINED ACCOUNT DETAILS`,
    `-----------------------`,
    `USERNAME: ${username}`,
    `EMAIL: ${to}`,
    `ROLE: ${role}`,
    ...(firstName ? [`FIRST NAME: ${firstName}`] : []),
    ...(lastName ? [`LAST NAME: ${lastName}`] : []),
    ``,
    `Complete your account here:`,
    `${inviteUrl}`,
    ``,
    `The predefined fields on the setup page are locked.`,
    `Please complete the remaining required fields to activate your account.`,
  ];

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
}

// do not remove this line
// @ts-expect-error:request
export async function POST(request) {
  try {
    const session = await getCurrentSession();

    if (!session || String(session.role || '').toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const username = normalizeUsername(body?.username);
    const usernameLower = username.toLowerCase();
    const email = String(body?.email || '').trim();
    const emailLower = normalizeEmail(email);
    const role = String(body?.role || '').trim().toLowerCase();
    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username.' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { error: 'Invalid role.' },
        { status: 400 }
      );
    }

    if ((role === 'admin' || role === 'manager') && firstName.length < 2) {
      return NextResponse.json(
        { error: 'First name is required for admin and manager accounts.' },
        { status: 400 }
      );
    }

    if ((role === 'admin' || role === 'manager') && lastName.length < 2) {
      return NextResponse.json(
        { error: 'Last name is required for admin and manager accounts.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({
      $or: [
        { usernameLower },
        { emailLower },
      ],
    });

    if (existingUser) {
      if (String(existingUser.usernameLower || '') === usernameLower) {
        return NextResponse.json(
          { error: 'Username already exists.' },
          { status: 409 }
        );
      }

      if (String(existingUser.emailLower || '') === emailLower) {
        return NextResponse.json(
          { error: 'Email already exists.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'A user with those details already exists.' },
        { status: 409 }
      );
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto
      .createHash('sha256')
      .update(inviteToken)
      .digest('hex');

    const now = new Date();
    const inviteExpiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);

    await usersCollection.insertOne({
      username,
      usernameLower,
      email,
      emailLower,
      firstName,
      lastName,
      role,
      securityQuestions: [],
      failedLoginAttempts: 0,
      lastLoginAttempt: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaPendingSecret: null,
      mfaSetupToken: null,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,

      // invite state
      accountStatus: 'invited',
      inviteTokenHash,
      inviteExpiresAt,
      invitedAt: now,
      invitedBy: String(session.userId || ''),
      invitationAcceptedAt: null,

      // account completion state
      passwordHash: null,
    });

    const inviteUrl = buildInviteUrl(inviteToken);
    const mailToUrl = buildMailToUrl({
      to: email,
      username,
      role,
      inviteUrl,
      firstName,
      lastName,
    });

    await createLog({
      userId: String(session.userId),
      actionType: LOG_EVENT_TYPES.ACCOUNT_INITIATION,
      eventType: LOG_EVENT_TYPES.ACCOUNT_INITIATION,
      details: `Initiated account for ${username} (${email}) with role ${role}.`,
      ticketStatus: 'N/A',
      status: 'N/A',
      priorityLevel: 'LOW',
      priority: 'INFO',
    });

    return NextResponse.json({
      success: true,
      inviteUrl,
      mailToUrl,
    });
  } catch (error) {
    console.error('initiate-account POST error:', error);

    return NextResponse.json(
      { error: 'Failed to initiate account.' },
      { status: 500 }
    );
  }
}