import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OTP } from 'otplib';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { createLog } from '@/lib/logger';
import { decryptMfaSecret } from '@/lib/crypto';

const totp = new OTP({ strategy: 'totp' });

function getTokenHash(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
}

function hashBackupCode(code) {
  return crypto.createHash('sha256').update(String(code || '').trim().toUpperCase()).digest('hex');
}

export async function POST(request) {
  try {
    const { code } = await request.json();
    const normalizedCode = String(code || '').trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      return NextResponse.json({ error: 'Enter a valid 6-digit authentication code.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const setupToken = cookieStore.get('mfa_setup')?.value;

    if (!setupToken) {
      return NextResponse.json({ error: 'Missing or expired MFA setup session.' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');
    const pendingRegistrations = db.collection('pendingRegistrations');

    const challenge = await pendingRegistrations.findOne({
      setupTokenHash: getTokenHash(setupToken),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!challenge || !challenge.tempSecretEncrypted) {
      return NextResponse.json({ error: 'MFA setup session is invalid or expired.' }, { status: 401 });
    }

    const secret = decryptMfaSecret(challenge.tempSecretEncrypted);
    const isCodeValid = totp.verifySync({
      token: normalizedCode,
      secret,
    });

    if (!isCodeValid) {
      const attempts = (challenge.setupAttempts || 0) + 1;
      await challenges.updateOne(
        { _id: challenge._id },
        {
          $set: { setupAttempts: attempts, updatedAt: new Date() },
        }
      );

      return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 401 });
    }

    const backupCodes = generateBackupCodes();
    const backupCodeHashes = backupCodes.map(hashBackupCode);
    const createdAt = new Date();
    const finalUser = {
      username: challenge.username,
      usernameLower: challenge.usernameLower,
      email: challenge.email,
      emailLower: challenge.emailLower,
      firstName: challenge.firstName,
      lastName: challenge.lastName,
      role: 'customer',
      passwordHash: challenge.passwordHash,
      securityQuestions: challenge.securityQuestions,
      mfaEnabled: true,
      mfaSecretEncrypted: challenge.tempSecretEncrypted,
      backupCodeHashes,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAttempt: null,
      createdAt,
      updatedAt: createdAt,
    };

    const userInsertResult = await users.insertOne(finalUser);

    await pendingRegistrations.updateOne(
      { _id: challenge._id },
      {
        $set: {
          usedAt: new Date(),
          finalUserId: userInsertResult.insertedId,
          updatedAt: new Date(),
        },
      }
    );

    await pendingRegistrations.updateOne({ _id: challenge._id }, { $unset: { tempSecretEncrypted: '' } });

    cookieStore.delete('mfa_setup');

    await createLog({
      userId: userInsertResult.insertedId.toString(),
      actionType: 'MFA_SETUP_SUCCESS',
      details: `${challenge.username} completed account verification successfully.`,
      priorityLevel: 'info',
    });

    return NextResponse.json(
      {
        message: 'MFA setup complete. Store your backup codes safely.',
        backupCodes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('MFA setup verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
