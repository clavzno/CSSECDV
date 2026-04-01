import clientPromise from '@/lib/mongodb';
import { verifyPassword } from '@/lib/crypto';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // Generic error to prevent attackers from knowing if the username exists
    const genericAuthError = 'Invalid username and/or password'; 

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const usersCollection = db.collection('users');
    const logsCollection = db.collection('logs'); // Dedicated collection for system logs

    // 1. Find the user
    const user = await usersCollection.findOne({ username });

    if (!user) {
      // Log the failed attempt even if user doesn't exist
      await logsCollection.insertOne({
        eventType: 'Authentication',
        status: 'Failed',
        usernameAttempted: username,
        timestamp: new Date(),
        details: 'Unknown username'
      });
      return Response.json({ error: genericAuthError }, { status: 401 });
    }

    // 2. Check for Account Lockout (e.g., disabled for 15 minutes)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logsCollection.insertOne({
        eventType: 'Authentication',
        status: 'Failed',
        usernameAttempted: username,
        timestamp: new Date(),
        details: 'Attempted login on locked account'
      });
      return Response.json({ error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' }, { status: 401 });
    }

    // 3. Verify the password
    const isValid = verifyPassword(password, user.passwordHash);

    if (!isValid) {
      // Increment failed attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let updates = {
        failedLoginAttempts: attempts,
        lastLoginAttempt: { date: new Date(), status: 'Unsuccessful' }
      };

      // Lock account if 5 failed attempts are reached
      if (attempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
      }

      await usersCollection.updateOne({ _id: user._id }, { $set: updates });

      await logsCollection.insertOne({
        eventType: 'Authentication',
        status: 'Failed',
        usernameAttempted: username,
        timestamp: new Date(),
        details: attempts >= 5 ? 'Account locked out (5 failed attempts)' : 'Invalid password'
      });

      return Response.json({ error: genericAuthError }, { status: 401 });
    }

    // 4. Success! Fetch the last login record to report back to the user
    const lastLoginMsg = user.lastLoginAttempt
      ? `Your last login attempt was ${user.lastLoginAttempt.status} on ${new Date(user.lastLoginAttempt.date).toLocaleString()}`
      : 'Welcome! This is your first time logging in.';

    // 5. Reset failed attempts and update last login to "Successful"
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAttempt: { date: new Date(), status: 'Successful' }
        }
      }
    );

    await logsCollection.insertOne({
      eventType: 'Authentication',
      status: 'Success',
      usernameAttempted: username,
      timestamp: new Date(),
      details: 'User logged in successfully'
    });

    // 6. Generate a secure, native Database Session
    const sessionId = crypto.randomBytes(32).toString('hex');
    await db.collection('sessions').insertOne({
      sessionId,
      userId: user._id,
      role: user.role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // 7. Send Response & Set HttpOnly Cookie
    const response = Response.json({ 
      message: 'Login successful',
      lastLoginMessage: lastLoginMsg,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    }, { status: 200 });

    // The cookie is HttpOnly, preventing XSS attacks from stealing the session
    const isProduction = process.env.NODE_ENV === 'production';
    response.headers.set(
      'Set-Cookie',
      `session=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${isProduction ? '; Secure' : ''}`
    );

    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}