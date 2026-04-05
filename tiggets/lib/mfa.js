import { OTP } from 'otplib';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { decryptMfaSecret } from '@/lib/crypto';

const totp = new OTP({ strategy: 'totp' });

export const MANAGER_MFA_HOURS = 12;

export function hashBackupCode(code) {
  return crypto
    .createHash('sha256')
    .update(String(code || '').trim().toUpperCase())
    .digest('hex');
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return 'unknown';
}

export function isManagerMfaStillValid(user, deviceId) {
  if (!deviceId) return false;

  const trusted = Array.isArray(user?.managerMfaTrustedDevices)
    ? user.managerMfaTrustedDevices
    : [];

  const existing = trusted.find((entry) => entry?.deviceId === deviceId);
  if (!existing?.verifiedAt) return false;

  const verifiedAt = new Date(existing.verifiedAt).getTime();
  if (!Number.isFinite(verifiedAt)) return false;

  const maxAgeMs = MANAGER_MFA_HOURS * 60 * 60 * 1000;
  return Date.now() - verifiedAt <= maxAgeMs;
}

export async function markManagerMfaVerified(db, userId, deviceId) {
  if (!deviceId) return;

  await db.collection('users').updateOne(
    { _id: new ObjectId(String(userId)) },
    {
      $pull: { managerMfaTrustedDevices: { deviceId } },
    }
  );

  await db.collection('users').updateOne(
    { _id: new ObjectId(String(userId)) },
    {
      $push: {
        managerMfaTrustedDevices: {
          deviceId,
          verifiedAt: new Date(),
        },
      },
      $set: { updatedAt: new Date() },
    }
  );
}

export function isCustomerIpTrusted(user, ip, action) {
  if (!ip || ip === 'unknown') return false;

  const trustedIps = Array.isArray(user?.customerMfaTrustedIps)
    ? user.customerMfaTrustedIps
    : [];

  return trustedIps.some((entry) => {
    if (!entry || entry.ip !== ip) return false;
    const actions = Array.isArray(entry.actions) ? entry.actions : [];
    return actions.includes(action);
  });
}

export async function markCustomerIpTrusted(db, userId, ip, action) {
  if (!ip || ip === 'unknown') return;

  await db.collection('users').updateOne(
    { _id: new ObjectId(String(userId)) },
    {
      $pull: { customerMfaTrustedIps: { ip } },
    }
  );

  await db.collection('users').updateOne(
    { _id: new ObjectId(String(userId)) },
    {
      $push: {
        customerMfaTrustedIps: {
          ip,
          actions: [action],
          verifiedAt: new Date(),
        },
      },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function verifyUserMfa({ db, user, mfaCode, backupCode }) {
  if (!user?.mfaEnabled) {
    return { ok: false, error: 'MFA is required but not enabled for this account.' };
  }

  const normalizedCode = String(mfaCode || '').trim();
  const normalizedBackupCode = String(backupCode || '').trim().toUpperCase();

  if (normalizedCode) {
    if (!/^\d{6}$/.test(normalizedCode)) {
      return { ok: false, error: 'Enter a valid 6-digit authentication code.' };
    }

    if (!user.mfaSecretEncrypted) {
      return { ok: false, error: 'MFA is enabled but not configured for this account.' };
    }

    try {
      const secret = decryptMfaSecret(user.mfaSecretEncrypted);
      const result = totp.verifySync({ token: normalizedCode, secret });
      if (result && result.valid === true) {
        return { ok: true, method: 'totp' };
      }
      return { ok: false, error: 'Invalid authentication code.' };
    } catch {
      return { ok: false, error: 'MFA verification failed.' };
    }
  }

  if (normalizedBackupCode) {
    const backupCodeHash = hashBackupCode(normalizedBackupCode);
    const backupCodeHashes = Array.isArray(user.backupCodeHashes)
      ? user.backupCodeHashes
      : [];

    if (!backupCodeHashes.includes(backupCodeHash)) {
      return { ok: false, error: 'Invalid backup code.' };
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(String(user._id)) },
      {
        $pull: { backupCodeHashes: backupCodeHash },
        $set: { updatedAt: new Date() },
      }
    );

    return { ok: true, method: 'backup' };
  }

  return { ok: false, error: 'Provide either an MFA code or a backup code.' };
}
