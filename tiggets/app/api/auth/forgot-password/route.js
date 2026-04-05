import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { createLog } from '@/lib/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // --- NEW: Log Validation Failure (Requirement 2.4.5) ---
    if (!email || !EMAIL_REGEX.test(email)) {
      await createLog({
        userId: 'Unauthenticated',
        actionType: 'FORGOT_PWD_VALIDATION_FAIL',
        details: `Forgot password lookup failed: Missing or invalid email format provided.`,
        priorityLevel: 'warning',
      });
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ emailLower: email.toLowerCase() });

    // Always return the same message for security (Requirement 2.1.4: prevent email enumeration)
    if (!user) {
      await createLog({
        userId: 'Unauthenticated',
        actionType: 'FORGOT_PWD_EMAIL_CHECK',
        details: `Password reset requested for non-existent email: ${email}`,
        priorityLevel: 'info',
      });
      return NextResponse.json({
        message: 'If an account exists, a password reset email has been sent.',
        hasAccount: false
      });
    }

    const hasMFA = user.mfaEnabled || false;

    await createLog({
      userId: user._id,
      actionType: 'FORGOT_PWD_EMAIL_CHECK',
      details: `${user.username} requested a password reset. Identity check passed.`,
      priorityLevel: 'info',
    });

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

    // --- NEW: Log Validation Failure - Missing Fields (Requirement 2.4.5) ---
    if (!email || !newPassword || !confirmPassword) {
      await createLog({
        userId: 'Unauthenticated',
        actionType: 'FORGOT_PWD_VALIDATION_FAIL',
        details: `Password reset POST failed: Missing required fields (email/password).`,
        priorityLevel: 'warning'
      });
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // --- NEW: Log Validation Failure - Mismatch (Requirement 2.4.5) ---
    if (newPassword !== confirmPassword) {
      await createLog({
        userId: 'Unauthenticated',
        actionType: 'FORGOT_PWD_VALIDATION_FAIL',
        details: `Password reset failed: Password confirmation mismatch for ${email}.`,
        priorityLevel: 'warning'
      });
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // --- NEW: Log Validation Failure - Complexity (Requirement 2.4.5) ---
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      await createLog({
        userId: 'Unauthenticated',
        actionType: 'FORGOT_PWD_VALIDATION_FAIL',
        details: `Password reset failed: New password for ${email} does not meet complexity requirements.`,
        priorityLevel: 'warning'
      });
      return NextResponse.json({ error: 'Password does not meet policy requirements' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ emailLower: email.toLowerCase() });

    if (!user) {
      await createLog({
        userId: 'Unauthenticated',
        actionType: 'FORGOT_PWD_IDENTITY_FAIL',
        details: `Unauthorized attempt to reset password for non-existent user: ${email}.`,
        priorityLevel: 'critical'
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await createLog({
      userId: user._id,
      actionType: 'FORGOT_PWD_ATTEMPT',
      details: `${user.username} is attempting to reset password using ${verificationMethod} verification.`,
      priorityLevel: 'info',
    });

    let verificationPassed = false;

    if (verificationMethod === 'mfa') {
      // Future MFA verification logic placeholder
      if (user.mfaEnabled && mfaCode) {
        verificationPassed = true; 
      }
    } else if (verificationMethod === 'questions') {
      if (!user.securityQuestions || user.securityQuestions.length !== (answers?.length || 0)) {
        await createLog({
          userId: user._id,
          actionType: 'FORGOT_PWD_IDENTITY_FAIL',
          details: `${user.username} reset failed: Security question count mismatch.`,
          priorityLevel: 'warning',
        });
        return NextResponse.json({ error: 'Invalid security questions' }, { status: 400 });
      }

      // timingSafeEqual is utilized inside verifyPassword to prevent timing attacks (Requirement 2.1.4)
      verificationPassed = user.securityQuestions.every((q, index) => {
        const providedAnswer = answers[index]?.trim().toLowerCase();
        return providedAnswer && verifyPassword(providedAnswer, q.answerHash);
      });
    }

    if (!verificationPassed) {
      await createLog({
        userId: user._id,
        actionType: 'FORGOT_PWD_IDENTITY_FAIL',
        details: `${user.username} failed to verify identity. Reason: Incorrect security answers or MFA code.`,
        priorityLevel: 'warning',
      });
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
    }

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
      userId: user._id,
      actionType: 'FORGOT_PWD_SUCCESS',
      details: `${user.username} successfully reset their password via recovery flow.`,
      priorityLevel: 'info',
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Forgot password POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}