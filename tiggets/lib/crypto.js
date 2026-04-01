import crypto from 'crypto';

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