import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { OTP } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { encryptMfaSecret, decryptMfaSecret } from '@/lib/crypto';
import { verifyUserMfa } from '@/lib/mfa';
import { createLog } from '@/lib/logger';

const totp = new OTP({ strategy: 'totp' });

function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
}

function hashBackupCode(code) {
  return crypto.createHash('sha256').update(String(code || '').trim().toUpperCase()).digest('hex');
}

function isRoleMfaRequired(role) {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'manager';
}

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session?.userId || !ObjectId.isValid(String(session.userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(String(session.userId)) },
      {
        projection: {
          role: 1,
          mfaEnabled: 1,
          mfaSecretEncrypted: 1,
          mfaPendingSecretEncrypted: 1,
        },
      }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const hasValidMfaConfig = Boolean(user.mfaEnabled && user.mfaSecretEncrypted);

    return NextResponse.json(
      {
        mfaEnabled: hasValidMfaConfig,
        mfaRequiredForRole: isRoleMfaRequired(user.role),
        role: String(user.role || '').toLowerCase(),
        setupInProgress: Boolean(user.mfaPendingSecretEncrypted),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('MFA preferences GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getCurrentSession();
    if (!session?.userId || !ObjectId.isValid(String(session.userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const action = String(payload?.action || '').trim();

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');

    const user = await users.findOne({ _id: new ObjectId(String(session.userId)) });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (action === 'start_enable') {
      if (user.mfaEnabled && user.mfaSecretEncrypted) {
        return NextResponse.json({ error: 'MFA is already enabled.' }, { status: 400 });
      }

      const secret = totp.generateSecret();
      const otpauth = totp.generateURI({
        issuer: 'Tiggets',
        label: user.emailLower || user.email || user.username,
        secret,
      });

      const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            mfaPendingSecretEncrypted: encryptMfaSecret(secret),
            mfaPendingCreatedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        {
          qrCodeDataUrl,
          manualEntryKey: secret,
        },
        { status: 200 }
      );
    }

    if (action === 'confirm_enable') {
      const normalizedCode = String(payload?.code || '').trim();
      if (!/^\d{6}$/.test(normalizedCode)) {
        return NextResponse.json({ error: 'Enter a valid 6-digit authentication code.' }, { status: 400 });
      }

      if (!user.mfaPendingSecretEncrypted) {
        return NextResponse.json({ error: 'No MFA setup is in progress.' }, { status: 400 });
      }

      let secret;
      try {
        secret = decryptMfaSecret(user.mfaPendingSecretEncrypted);
      } catch {
        return NextResponse.json({ error: 'Pending MFA setup is invalid.' }, { status: 400 });
      }

      const verificationResult = totp.verifySync({ token: normalizedCode, secret });
      const isCodeValid = verificationResult === true || verificationResult?.valid === true;
      if (!isCodeValid) {
        return NextResponse.json({ error: 'Invalid authentication code.' }, { status: 401 });
      }

      const backupCodes = generateBackupCodes();
      const backupCodeHashes = backupCodes.map(hashBackupCode);

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            mfaEnabled: true,
            mfaSecretEncrypted: user.mfaPendingSecretEncrypted,
            backupCodeHashes,
            updatedAt: new Date(),
          },
          $unset: {
            mfaPendingSecretEncrypted: '',
            mfaPendingCreatedAt: '',
          },
        }
      );

      await createLog({
        userId: String(user._id),
        actionType: 'MFA_ENABLED',
        details: `${user.username} enabled MFA from settings.`,
        priorityLevel: 'info',
      });

      return NextResponse.json(
        {
          message: 'MFA enabled successfully. Save your backup codes in a safe place.',
          backupCodes,
        },
        { status: 200 }
      );
    }

    if (action === 'disable') {
      if (!user.mfaEnabled || !user.mfaSecretEncrypted) {
        return NextResponse.json({ error: 'MFA is not enabled for this account.' }, { status: 400 });
      }

      if (isRoleMfaRequired(user.role)) {
        return NextResponse.json(
          { error: 'MFA cannot be disabled for admin or manager accounts.' },
          { status: 403 }
        );
      }

      const mfaResult = await verifyUserMfa({
        db,
        user,
        mfaCode: payload?.mfaCode,
        backupCode: payload?.backupCode,
      });

      if (!mfaResult.ok) {
        return NextResponse.json({ error: mfaResult.error }, { status: 401 });
      }

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            mfaEnabled: false,
            updatedAt: new Date(),
          },
          $unset: {
            mfaSecretEncrypted: '',
            backupCodeHashes: '',
            managerMfaTrustedDevices: '',
            customerMfaTrustedIps: '',
            mfaPendingSecretEncrypted: '',
            mfaPendingCreatedAt: '',
          },
        }
      );

      await createLog({
        userId: String(user._id),
        actionType: 'MFA_DISABLED',
        details: `${user.username} disabled MFA from settings after MFA verification.`,
        priorityLevel: 'warning',
      });

      return NextResponse.json({ message: 'MFA has been disabled.' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid MFA preferences action.' }, { status: 400 });
  } catch (error) {
    console.error('MFA preferences POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
