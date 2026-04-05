import crypto from 'crypto';

const MFA_ENCRYPTION_ALGO = 'aes-256-gcm';

function getMfaEncryptionKey() {
  const key = process.env.MFA_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('Missing MFA_ENCRYPTION_KEY environment variable.');
  }

  // Accept either 64-char hex or base64-encoded 32-byte key.
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }

  const base64Buffer = Buffer.from(key, 'base64');
  if (base64Buffer.length === 32) {
    return base64Buffer;
  }

  throw new Error('MFA_ENCRYPTION_KEY must be 32 bytes (base64) or 64 hex characters.');
}

// Hashes a plain text password with a random salt
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`; // Store both the salt and the hash together
}

// Compares a plain text login attempt with the stored hash
export function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(':');
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  
  // timingSafeEqual prevents timing attacks against your login
  return crypto.timingSafeEqual(hashBuffer, keyBuffer); 
}

export function encryptMfaSecret(secret) {
  const key = getMfaEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(MFA_ENCRYPTION_ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptMfaSecret(payload) {
  const [ivHex, authTagHex, encryptedHex] = String(payload || '').split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted MFA secret payload.');
  }

  const key = getMfaEncryptionKey();
  const decipher = crypto.createDecipheriv(MFA_ENCRYPTION_ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}