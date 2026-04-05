import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { ObjectId } from 'mongodb';
import { OTP } from 'otplib';
import crypto from 'crypto';
import { createLog } from '@/lib/logger';

import { hashPassword, verifyPassword, decryptMfaSecret } from '@/lib/crypto'; 

const totp = new OTP({ strategy: 'totp' });

function hashBackupCode(code) {
    return crypto.createHash('sha256').update(String(code || '').trim().toUpperCase()).digest('hex');
}

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
export async function GET() {
    try {
        const session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
                if (!user) {
                        return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

                // Only send question text to the frontend, never answer hashes.
                const safeQuestions = Array.isArray(user.securityQuestions)
                    ? user.securityQuestions.map((q) => ({ question: q.question }))
                    : [];

        await createLog({
          userId: session.userId,
          eventType: 'PASSWORD_CHANGE_ATTEMPT',
          details: `${user.username} accessed the change password page.`,
          priorityLevel: 'info',
        });

                return NextResponse.json(
                    {
                        mfaEnabled: Boolean(user.mfaEnabled),
                        questions: safeQuestions,
                    },
                    { status: 200 }
                );
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

        const { answers, newPassword, mfaCode, backupCode } = await request.json();

        if (!newPassword) {
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
        if (!user) {
            return NextResponse.json({ error: 'User data corrupted' }, { status: 500 });
        }

        if (user.mfaEnabled) {
            const normalizedCode = String(mfaCode || '').trim();
            const normalizedBackupCode = String(backupCode || '').trim().toUpperCase();

            let mfaVerified = false;

            if (normalizedCode) {
                if (!/^\d{6}$/.test(normalizedCode)) {
                    return NextResponse.json({ error: 'Valid 6-digit MFA code is required.' }, { status: 400 });
                }

                if (!user.mfaSecretEncrypted) {
                    return NextResponse.json({ error: 'MFA is enabled but not configured for this account.' }, { status: 400 });
                }

                const secret = decryptMfaSecret(user.mfaSecretEncrypted);
                const result = totp.verifySync({ token: normalizedCode, secret });
                mfaVerified = result && result.valid === true;
            } else if (normalizedBackupCode) {
                const backupCodeHash = hashBackupCode(normalizedBackupCode);
                const backupCodeHashes = Array.isArray(user.backupCodeHashes) ? user.backupCodeHashes : [];

                if (backupCodeHashes.includes(backupCodeHash)) {
                    mfaVerified = true;
                    await db.collection('users').updateOne(
                        { _id: new ObjectId(session.userId) },
                        {
                            $pull: { backupCodeHashes: backupCodeHash },
                            $set: { updatedAt: new Date() },
                        }
                    );
                }
            } else {
                return NextResponse.json({ error: 'Provide either an MFA code or a backup code.' }, { status: 400 });
            }

            if (!mfaVerified) {
                return NextResponse.json({ error: 'Invalid authentication or backup code.' }, { status: 403 });
            }
        } else {
            if (!Array.isArray(answers) || answers.length !== 3) {
                return NextResponse.json({ error: 'All security question answers are required.' }, { status: 400 });
            }

            if (!Array.isArray(user.securityQuestions) || user.securityQuestions.length !== 3) {
                return NextResponse.json({ error: 'Security questions are not configured for this account.' }, { status: 400 });
            }

            // Verify every answer against the stored hashes.
            for (let i = 0; i < user.securityQuestions.length; i++) {
                const formattedInput = String(answers[i] || '').trim().toLowerCase();
                const isCorrect = verifyPassword(formattedInput, user.securityQuestions[i].answerHash);

                if (!isCorrect) {
                    await createLog({
                      userId: session.userId,
                      eventType: 'PASSWORD_CHANGE_FAIL',
                      details: `${user.username} failed to change password. Reason: Incorrect security answers.`,
                      priorityLevel: 'warning',
                    });
                    return NextResponse.json({ error: 'One or more security answers are incorrect.' }, { status: 403 });
                }
            }
        }

        // If answers are correct, hash the new password and save it
        const newPasswordHash = hashPassword(newPassword);

        await db.collection('users').updateOne(
            { _id: new ObjectId(session.userId) },
            { $set: { passwordHash: newPasswordHash, updatedAt: new Date() } }
        );

        await createLog({
          userId: session.userId,
          eventType: 'PASSWORD_CHANGE_SUCCESS',
          details: `${user.username} successfully changed their password.`,
          priorityLevel: 'info',
        });

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Password Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}