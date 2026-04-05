"use client"; // for interactivity

import { useState } from 'react';
import Image from 'next/image';
import Tiggets from '@/public/Tiggets.png';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [verificationMode, setVerificationMode] = useState('mfa');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function getOrCreateDeviceId() {
    const key = 'tiggets_device_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const generated = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(key, generated);
    return generated;
  }

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          username,
          password,
          mfaCode: mfaRequired && verificationMode === 'mfa' ? mfaCode : '',
          backupCode: mfaRequired && verificationMode === 'backup' ? backupCode.trim().toUpperCase() : '',
        }),
      });

      const data = await res.json();
      if (res.status === 401 && data?.mfaRequired) {
        setMfaRequired(true);
        throw new Error(data.error || 'MFA code is required to continue.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      window.alert(data.lastLoginMessage);
      localStorage.setItem('user', JSON.stringify(data.user));
      setMfaRequired(false);
      setMfaCode('');
      setBackupCode('');
      router.push('/dashboard');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function goToCreateAccount() {
    router.push('/CreateAccount');
  }

  function goToForgotPassword() {
    router.push('/ForgotPassword');
  }

  return (
    <div className="w-full max-w-xl rounded-2xl bg-tiggets-green p-8 shadow-md">
      <div className="mb-6 flex justify-center">
        <Image
          src={Tiggets}
          alt="Tiggets logo"
          width={160}
          height={60}
          className='h-auto'
          priority
        />
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        
        {/* Display errors if they exist */}
        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="username"
            className="font-text text-base font-medium text-background"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="rounded-lg border border-border-gray px-4 py-3 font-text text-foreground outline-none transition focus:border-tiggets-lightgreen bg-background"
          />
        </div>

        {mfaRequired && (
          <div className="rounded-lg border border-background/30 bg-background/10 p-3">
            <p className="mb-2 text-sm font-semibold text-background">Multi-Factor Authentication Required</p>
            <div className="mb-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-background">
                <input
                  type="radio"
                  name="loginVerificationMode"
                  value="mfa"
                  checked={verificationMode === 'mfa'}
                  onChange={(e) => setVerificationMode(e.target.value)}
                  className="h-4 w-4 accent-tiggets-lightgreen"
                />
                Authentication Code
              </label>
              <label className="flex items-center gap-2 text-xs text-background">
                <input
                  type="radio"
                  name="loginVerificationMode"
                  value="backup"
                  checked={verificationMode === 'backup'}
                  onChange={(e) => setVerificationMode(e.target.value)}
                  className="h-4 w-4 accent-tiggets-lightgreen"
                />
                Backup Code
              </label>
            </div>

            {verificationMode === 'mfa' ? (
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full rounded-lg border border-border-gray px-4 py-2 font-text text-foreground outline-none transition focus:border-tiggets-lightgreen bg-background"
              />
            ) : (
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="Enter backup code"
                className="w-full rounded-lg border border-border-gray px-4 py-2 font-text text-foreground outline-none transition focus:border-tiggets-lightgreen bg-background"
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="font-text text-base font-medium text-background"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="rounded-lg border border-div-gray px-4 py-3 font-text text-foreground outline-none transition focus:border-tiggets-lightgreen bg-background"
          />
          <button
            type="button"
            onClick={goToForgotPassword}
            className="self-start text-xs font-text text-background underline underline-offset-2 transition hover:text-gray-200 hover:cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        <label className="flex items-center gap-2 font-text text-sm text-background">
          <input
            type="checkbox"
            name="rememberMe"
            className="h-4 w-4 accent-tiggets-lightgreen"
          />
          Remember me
        </label>

        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goToCreateAccount}
            className="rounded-lg bg-gray-500 px-4 py-3 font-text font-semibold text-white transition hover:cursor-pointer hover:bg-gray-600 drop-shadow-sm"
          >
            Create Account
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-tiggets-lightgreen px-4 py-3 font-text font-semibold text-white transition hover:cursor-pointer drop-shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
}