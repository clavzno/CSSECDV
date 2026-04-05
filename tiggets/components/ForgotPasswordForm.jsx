"use client";

import { useState } from 'react';
import Image from 'next/image';
import Tiggets from '@/public/Tiggets.png';
import { useRouter } from 'next/navigation';

function getPasswordChecks(password) {
  return {
    minLength: password.length >= 15,
    maxLength: password.length <= 64,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

function getStrengthScore(password) {
  const checks = getPasswordChecks(password);
  let score = 0;

  if (password.length >= 8) score += 1;
  if (checks.hasUpper && checks.hasLower) score += 1;
  if (checks.hasNumber) score += 1;
  if (checks.hasSpecial && checks.minLength && checks.maxLength) score += 1;

  if (!password) {
    return { score: 0, label: 'None' };
  }

  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[Math.max(0, score - 1)] };
}

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [hasAccount, setHasAccount] = useState(null);
  const [hasMFA, setHasMFA] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [verificationMethod, setVerificationMethod] = useState('questions');
  const [answers, setAnswers] = useState(['', '', '']);
  const [mfaCode, setMfaCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = getStrengthScore(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  async function checkEmail() {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/auth/forgot-password?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to check email');
      }

      setHasAccount(data.hasAccount);
      setHasMFA(data.hasMFA || false);
      setQuestions(data.securityQuestions || []);

      setSuccess(data.message || 'If an account exists, a password reset email has been sent.');

      setTimeout(() => {
        if (data.hasAccount) {
          setStep('verify');
          setVerificationMethod(data.hasMFA ? 'mfa' : 'questions');
        }
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyIdentity() {
    setError('');
    setIsLoading(true);

    try {
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          verificationMethod,
          answers: verificationMethod === 'questions' ? answers.map(a => a.trim()) : [],
          mfaCode: verificationMethod === 'mfa' ? mfaCode : '',
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess('Password reset successfully! You can now log in with your new password.');
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function updateAnswer(index, value) {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  }

  if (step === 'success') {
    return (
      <div className="w-full rounded-2xl bg-linear-to-r from-[#123528] to-[#173529] p-6 shadow-md md:p-10">
        <div className="mb-6 flex flex-col items-center gap-1">
          <Image src={Tiggets} alt="Tiggets logo" width={190} height={72} className="h-auto" priority />
          <p className="text-center font-text text-xl text-background">Password Reset</p>
        </div>

        <div className="text-center space-y-4">
          <div className="rounded-lg bg-green-100 p-3 text-sm font-medium text-green-700">
            {success}
          </div>
          <button
            onClick={() => router.push('/')}
            className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:brightness-110"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-linear-to-r from-[#123528] to-[#173529] p-6 shadow-md md:p-10">
      <div className="mb-6 flex flex-col items-center gap-1">
        <Image src={Tiggets} alt="Tiggets logo" width={190} height={72} className="h-auto" priority />
        <p className="text-center font-text text-xl text-background">
          {step === 'email' && 'Reset Your Password'}
          {step === 'verify' && 'Verify Your Identity'}
          {step === 'reset' && 'Change Your Password'}
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-2 text-xs font-semibold text-background underline underline-offset-2 hover:text-gray-200"
        >
          Back to Login
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || success) && (
          <div className={`rounded-lg p-3 text-sm font-medium ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {error || success}
          </div>
        )}

        {step === 'email' && (
          <div className="space-y-3">
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="email" className="text-sm text-background">Email address*</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen"
                placeholder="your@email.com"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={checkEmail}
                disabled={isLoading}
                className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <p className="text-sm text-background">Choose how to verify your identity:</p>

            <div className="space-y-3">
              {hasMFA && (
                <label className="flex items-center gap-3 p-3 rounded border border-border-gray bg-background">
                  <input
                    type="radio"
                    name="verification"
                    value="mfa"
                    checked={verificationMethod === 'mfa'}
                    onChange={(e) => setVerificationMethod(e.target.value)}
                    className="h-4 w-4 accent-tiggets-lightgreen"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Multi-Factor Authentication (MFA)</p>
                    <p className="text-xs text-gray-600">Use your authenticator app or SMS code</p>
                  </div>
                </label>
              )}

              <label className="flex items-center gap-3 p-3 rounded border border-border-gray bg-background">
                <input
                  type="radio"
                  name="verification"
                  value="questions"
                  checked={verificationMethod === 'questions'}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="h-4 w-4 accent-tiggets-lightgreen"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Security Questions</p>
                  <p className="text-xs text-gray-600">Answer your security questions</p>
                </div>
              </label>
            </div>

            {verificationMethod === 'mfa' && (
              <div className="space-y-2">
                <label htmlFor="mfaCode" className="text-sm text-background">MFA Code*</label>
                <input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen"
                  placeholder="Enter your 6-digit code"
                  maxLength={6}
                />
              </div>
            )}

            {verificationMethod === 'questions' && questions.map((q) => (
              <div key={q.index} className="space-y-1">
                <label className="text-sm text-background">{q.question}</label>
                <input
                  type="text"
                  value={answers[q.index]}
                  onChange={(e) => updateAnswer(q.index, e.target.value)}
                  className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen"
                  placeholder="Your answer"
                />
              </div>
            ))}

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="rounded bg-gray-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-500 hover:cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={verifyIdentity}
                disabled={isLoading}
                className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-3">
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="newPassword" className="text-sm text-background">New Password*</label>
              <div className="space-y-2">
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen"
                />
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-background">Strength</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-4 rounded ${
                          level <= strength.score
                            ? strength.score === 1
                              ? 'bg-red-500'
                              : strength.score === 2
                              ? 'bg-yellow-500'
                              : strength.score === 3
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-background">{strength.label}</p>
                  <div className="group relative">
                    <button
                      type="button"
                      aria-label="Password requirements"
                      className="grid h-4 w-4 place-items-center rounded-full border border-background/60 text-[10px] font-bold text-background"
                    >
                      i
                    </button>
                    <div className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-72 -translate-x-1/2 rounded-md bg-[#f6f6f6] p-2 text-[10px] leading-4 text-foreground shadow-md group-hover:block group-focus-within:block">
                      <p>Minimum 15 characters in length</p>
                      <p>Maximum 64 characters</p>
                      <p>Must include uppercase and lowercase letters</p>
                      <p>Must include numbers or special symbols</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="confirmPassword" className="text-sm text-background">Confirm Password</label>
              <div className="space-y-1">
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen"
                />
                <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {confirmPassword ? (passwordsMatch ? 'Passwords match!' : 'Passwords do not match!') : ''}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="rounded bg-gray-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-500 hover:cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !passwordsMatch || strength.score < 3}
                className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
