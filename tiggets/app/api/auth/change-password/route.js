import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { ObjectId } from 'mongodb';

// Cleaned up the imports to just pull exactly what we need
import { hashPassword, verifyPassword } from '@/lib/crypto'; 

function validatePassword(password) {
  const checks = {
    minLength: password.length >= 15,
    maxLength: password.length <= 64,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  return {
    checks,
    isValid: Object.values(checks).every(Boolean),
  };
} 

// 1. GET ROUTE: Send the questions to the frontend
export async function GET(request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
        if (!user || !user.securityQuestions) {
            return NextResponse.json({ error: 'User or questions not found' }, { status: 404 });
        }

        // ONLY send the question text to the frontend, NEVER the answerHash!
        const safeQuestions = user.securityQuestions.map(q => ({ question: q.question }));

        return NextResponse.json({ questions: safeQuestions }, { status: 200 });
    } catch (error) {
        console.error('Fetch Questions Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// 2. POST ROUTE: Verify answers and save new password
export async function POST(request) {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { answers, newPassword } = await request.json();

        if (!answers || answers.length !== 3 || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return NextResponse.json({ error: 'Password does not meet policy requirements.' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
        if (!user || !user.securityQuestions) {
            return NextResponse.json({ error: 'User data corrupted' }, { status: 500 });
        }

        // Verify every answer against the database hashes
        for (let i = 0; i < user.securityQuestions.length; i++) {
            // Format the typed answer exactly how it was formatted during registration
            const formattedInput = String(answers[i]).trim().toLowerCase();
            
            // FIXED: We are now using verifyPassword instead of hashPassword
            const isCorrect = verifyPassword(formattedInput, user.securityQuestions[i].answerHash);
            
            if (!isCorrect) {
                // If even one is wrong, reject the whole request to prevent brute-forcing
                return NextResponse.json({ error: 'One or more security answers are incorrect.' }, { status: 403 });
            }
        }

        // If answers are correct, hash the new password and save it
        const newPasswordHash = hashPassword(newPassword);

        await db.collection('users').updateOne(
            { _id: new ObjectId(session.userId) },
            { $set: { passwordHash: newPasswordHash, updatedAt: new Date() } }
        );

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Password Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}