import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { ObjectId } from 'mongodb';
import { hashPassword, verifyPassword } from '@/lib/crypto'; 
import { createLog } from '@/lib/logger'; 

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
        
        // --- NEW: Log Access Control Failure (Requirement 2.4.7) ---
        if (!session) {
            await createLog({
                userId: 'Unauthenticated',
                actionType: 'ACCESS_DENIED',
                details: 'Unauthorized attempt to access change-password questions.',
                priorityLevel: 'warning'
            });
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
        
        if (!user || !user.securityQuestions) {
            await createLog({
                userId: session.userId,
                actionType: 'SYSTEM_ERROR',
                details: `Security questions missing for user session: ${session.userId}`,
                priorityLevel: 'critical'
            });
            return NextResponse.json({ error: 'User or questions not found' }, { status: 404 });
        }

        // ONLY send the question text to the frontend, NEVER the answerHash!
        const safeQuestions = user.securityQuestions.map(q => ({ question: q.question }));

        await createLog({
          userId: session.userId,
          actionType: 'PASSWORD_CHANGE_ATTEMPT',
          details: `${user.username} accessed the change password page.`,
          priorityLevel: 'info',
        });

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
        
        // --- NEW: Log Access Control Failure (Requirement 2.4.7) ---
        if (!session) {
            await createLog({
                userId: 'Unauthenticated',
                actionType: 'ACCESS_DENIED',
                details: 'Unauthorized attempt to POST a password change.',
                priorityLevel: 'critical'
            });
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { answers, newPassword } = await request.json();

        // Audit Log for Missing Fields (Requirement 2.4.5)
        if (!answers || answers.length !== 3 || !newPassword) {
            await createLog({
                userId: session.userId,
                actionType: 'PASSWORD_CHANGE_VALIDATION_FAIL',
                details: `Password change failed: Missing or malformed input provided.`,
                priorityLevel: 'warning'
            });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Audit Log for Password Policy Failure (Requirement 2.4.5)
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            await createLog({
                userId: session.userId,
                actionType: 'PASSWORD_CHANGE_VALIDATION_FAIL',
                details: `Password change failed: New password does not meet complexity requirements.`,
                priorityLevel: 'warning'
            });
            return NextResponse.json({ error: 'Password does not meet policy requirements.' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
        if (!user || !user.securityQuestions) {
            return NextResponse.json({ error: 'User data corrupted' }, { status: 500 });
        }

        // Verify every answer against the database hashes (Requirement 2.4.6)
        for (let i = 0; i < user.securityQuestions.length; i++) {
            const formattedInput = String(answers[i]).trim().toLowerCase();
            const isCorrect = verifyPassword(formattedInput, user.securityQuestions[i].answerHash);
            
            if (!isCorrect) {
                await createLog({
                  userId: session.userId,
                  actionType: 'PASSWORD_CHANGE_FAIL',
                  details: `${user.username} failed to change password. Reason: Incorrect security answers.`,
                  priorityLevel: 'warning',
                });
                return NextResponse.json({ error: 'One or more security answers are incorrect.' }, { status: 403 });
            }
        }

        const newPasswordHash = hashPassword(newPassword);

        await db.collection('users').updateOne(
            { _id: new ObjectId(session.userId) },
            { $set: { passwordHash: newPasswordHash, updatedAt: new Date() } }
        );

        await createLog({
          userId: session.userId,
          actionType: 'PASSWORD_CHANGE_SUCCESS',
          details: `${user.username} successfully changed their password.`,
          priorityLevel: 'info',
        });

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Password Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}