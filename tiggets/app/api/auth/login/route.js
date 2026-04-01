import clientPromise from '@/lib/mongodb';
import { verifyPassword } from '@/lib/crypto';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    console.log("1. Login attempt for:", username); // Did the frontend send it correctly?

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
        
    // 1. Find the user by username
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Verify the password against the stored hash
    const isValid = verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Success! Return the user data
    return Response.json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}