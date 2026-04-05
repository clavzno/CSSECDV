import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OTP } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';
import { encryptMfaSecret } from '@/lib/crypto';

const totp = new OTP({ strategy: 'totp' });

function getTokenHash(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const setupToken = cookieStore.get('mfa_setup')?.value;

    if (!setupToken) {
      return NextResponse.json({ error: 'Missing or expired MFA setup session.' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const pendingRegistrations = db.collection('pendingRegistrations');

    const challenge = await pendingRegistrations.findOne({
      setupTokenHash: getTokenHash(setupToken),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'MFA setup session is invalid or expired.' }, { status: 401 });
    }

    // Check if MFA is enabled for this registration
    if (!challenge.enableMFA) {
      return NextResponse.json(
        {
          message: 'Account created successfully without MFA. Proceed to login.',
          nextStep: 'account_created',
        },
        { status: 200 }
      );
    }

    const secret = totp.generateSecret();
    const otpauth = totp.generateURI({
      issuer: 'Tiggets',
      label: challenge.emailLower || challenge.email || challenge.username,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    await pendingRegistrations.updateOne(
      { _id: challenge._id },
      {
        $set: {
          tempSecretEncrypted: encryptMfaSecret(secret),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        qrCodeDataUrl,
        manualEntryKey: secret,
        accountLabel: challenge.email || challenge.username,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('MFA setup start error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
