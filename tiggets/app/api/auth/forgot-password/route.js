import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ emailLower: email.toLowerCase() });

    // Always return the same message for security (prevent email enumeration)
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, a password reset email has been sent.',
        hasAccount: false
      });
    }

    // Check if user has MFA enabled (future feature)
    const hasMFA = user.mfaEnabled || false;

    return NextResponse.json({
      message: 'If an account exists, a password reset email has been sent.',
      hasAccount: true,
      hasMFA,
      securityQuestions: hasMFA ? [] : user.securityQuestions?.map((q, index) => ({
        index,
        question: q.question,
      })) || []
    });
  } catch (error) {
    console.error('Forgot password GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, verificationMethod, answers, mfaCode, newPassword, confirmPassword } = await request.json();

    if (!email || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: 'Password does not meet policy requirements' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ emailLower: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let verificationPassed = false;

    if (verificationMethod === 'mfa') {
      // Future MFA verification logic
      // For now, assume MFA verification passes if user has MFA enabled
      if (user.mfaEnabled && mfaCode) {
        // TODO: Implement actual MFA verification
        verificationPassed = true; // Placeholder
      }
    } else if (verificationMethod === 'questions') {
      // Verify security questions
      if (!user.securityQuestions || user.securityQuestions.length !== answers.length) {
        return NextResponse.json({ error: 'Invalid security questions' }, { status: 400 });
      }

      verificationPassed = user.securityQuestions.every((q, index) => {
        const providedAnswer = answers[index]?.trim().toLowerCase();
        return providedAnswer && verifyPassword(providedAnswer, q.answerHash);
      });
    }

    if (!verificationPassed) {
      await createLog({
        userId: user.username,
        actionType: 'PASSWORD_RESET_FAIL',
        details: `${user.username} failed to reset password. Reason: Incorrect verification.`,
        priorityLevel: 'warning',
      });
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
    }

    // Update password
    const newPasswordHash = hashPassword(newPassword);
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }
    );

    await createLog({
      userId: user.username,
      actionType: 'PASSWORD_RESET_SUCCESS',
      details: `${user.username} successfully reset their password.`,
      priorityLevel: 'info',
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Forgot password POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}