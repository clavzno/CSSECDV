import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { hashPassword, verifyPassword, decryptMfaSecret } from '@/lib/crypto';
import { createLog } from '@/lib/logger';
import { OTP } from 'otplib';
import crypto from 'crypto';

const totp = new OTP({ strategy: 'totp' });

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
      await createLog({
        userId: null, // No user found, so no userId
        eventType: 'PASSWORD_RESET_REQUEST',
        details: `Password reset requested for non-existent email: ${email}`,
        priorityLevel: 'info',
      });
      return NextResponse.json({
        message: 'If an account exists, a password reset email has been sent.',
        hasAccount: false
      });
    }

    // Check if user has MFA enabled
    const hasMFA = Boolean(user.mfaEnabled);

    await createLog({
      userId: user._id,
      eventType: 'PASSWORD_RESET_REQUEST',
      details: `${user.username} requested a password reset.`,
      priorityLevel: 'info',
    });

    return NextResponse.json({
      message: 'If an account exists, a password reset email has been sent.',
      hasAccount: true,
      hasMFA,
      securityQuestions: !hasMFA && Array.isArray(user.securityQuestions) ? user.securityQuestions.map((q, index) => ({
        index,
        question: q.question,
      })) : []
    });
  } catch (error) {
    console.error('Forgot password GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, answers, mfaCode, backupCode, newPassword, confirmPassword } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ emailLower: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Determine verification method based on user's MFA status
    const usesMFA = Boolean(user.mfaEnabled);

    // Log the password reset attempt
    await createLog({
      userId: user._id,
      eventType: 'PASSWORD_RESET_ATTEMPT',
      details: `${user.username} attempted to reset password using ${usesMFA ? 'MFA' : 'security questions'} verification.`,
      priorityLevel: 'info',
    });

    let verificationPassed = false;

    const verificationOnly = !newPassword && !confirmPassword;

    if (usesMFA) {
      if (!user.mfaEnabled) {
        return NextResponse.json({ error: 'MFA is not enabled for this account.' }, { status: 400 });
      }

      const normalizedCode = String(mfaCode || '').trim();
      const normalizedBackupCode = String(backupCode || '').trim().toUpperCase();

      if (normalizedCode) {
        if (!/^\d{6}$/.test(normalizedCode)) {
          return NextResponse.json({ error: 'Enter a valid 6-digit authentication code.' }, { status: 400 });
        }

        if (!user.mfaSecretEncrypted) {
          return NextResponse.json({ error: 'MFA is enabled but not configured for this account.' }, { status: 400 });
        }

        try {
          const secret = decryptMfaSecret(user.mfaSecretEncrypted);
          const result = totp.verifySync({ token: normalizedCode, secret });
          verificationPassed = result && result.valid === true;
        } catch (err) {
          console.error('MFA decryption error:', err);
          return NextResponse.json({ error: 'MFA verification failed.' }, { status: 400 });
        }
      } else if (normalizedBackupCode) {
        const backupCodeHash = crypto.createHash('sha256').update(normalizedBackupCode).digest('hex');
        const backupCodeHashes = Array.isArray(user.backupCodeHashes) ? user.backupCodeHashes : [];

        if (backupCodeHashes.includes(backupCodeHash)) {
          verificationPassed = true;
          await usersCollection.updateOne(
            { _id: user._id },
            {
              $pull: { backupCodeHashes: backupCodeHash },
              $set: { updatedAt: new Date() },
            }
          );
        }
      } else {
        return NextResponse.json({ error: 'Provide either an MFA code or a backup code.' }, { status: 400 });
      }
    } else {
      // Verify security questions
      if (!Array.isArray(user.securityQuestions) || user.securityQuestions.length !== 3 || !Array.isArray(answers) || answers.length !== 3) {
        return NextResponse.json({ error: 'Invalid security questions' }, { status: 400 });
      }

      verificationPassed = true;
      for (let i = 0; i < user.securityQuestions.length; i++) {
        const providedAnswer = String(answers[i] || '').trim().toLowerCase();
        const isCorrect = verifyPassword(providedAnswer, user.securityQuestions[i].answerHash);
        if (!isCorrect) {
          verificationPassed = false;
          break;
        }
      }
    }

    if (verificationOnly) {
      if (!verificationPassed) {
        await createLog({
          userId: user._id,
          eventType: 'PASSWORD_RESET_FAIL',
          details: `${user.username} failed identity verification during password reset.`,
          priorityLevel: 'warning',
        });
        return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
      }

      return NextResponse.json({ message: 'Verification successful' }, { status: 200 });
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: 'Password does not meet policy requirements' }, { status: 400 });
    }

    if (!verificationPassed) {
      await createLog({
        userId: user._id,
        eventType: 'PASSWORD_RESET_FAIL',
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
      userId: user._id,
      eventType: 'PASSWORD_RESET_SUCCESS',
      details: `${user.username} successfully reset their password.`,
      priorityLevel: 'info',
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Forgot password POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}