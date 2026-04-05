"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error.';
}

export default function MFASetupPage() {
  const router = useRouter();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoadingQr, setIsLoadingQr] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function startSetup() {
      setError('');
      setIsLoadingQr(true);

      try {
        const res = await fetch('/api/auth/mfa/setup/start', { method: 'POST' });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Unable to start MFA setup.');
        }

        // Check if user doesn't need MFA setup
        if (data.nextStep === 'account_created' && data.message) {
          setMessage(data.message);
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        if (data.message && !data.qrCodeDataUrl) {
          setMessage(data.message);
          return;
        }

        setQrCodeDataUrl(data.qrCodeDataUrl || '');
        setManualEntryKey(data.manualEntryKey || '');
      } catch (err: unknown) {
        setError(getErrorMessage(err) || 'Unable to start MFA setup.');
      } finally {
        setIsLoadingQr(false);
      }
    }

    startSetup();
  }, [router]);

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/mfa/setup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to verify MFA code.');
      }

      setBackupCodes(data.backupCodes || []);
      setMessage(data.message || 'MFA setup complete.');
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Unable to verify MFA code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 font-text">
      <div className="absolute inset-0 bg-[url('/Login-bg.png')] bg-cover bg-center bg-fixed blur-lg" />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-gradient-to-r from-[#123528] to-[#173529] p-6 shadow-md md:p-10">
        <h1 className="mb-2 text-center text-2xl font-semibold text-background">Verify Your New Account</h1>
        <p className="mb-6 text-center text-sm text-background/90">
          Scan the QR code in your authenticator app, then enter the 6-digit code to finish account verification.
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-lg bg-green-100 p-3 text-sm font-medium text-green-700">{message}</div>}

        {!backupCodes.length && (
          <>
            <div className="mb-6 rounded-lg bg-white/90 p-4">
              {isLoadingQr ? (
                <p className="text-sm text-foreground">Loading QR code...</p>
              ) : qrCodeDataUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <Image src={qrCodeDataUrl} alt="MFA QR code" width={224} height={224} className="h-56 w-56 rounded bg-white p-2" unoptimized />
                  <p className="text-xs text-foreground">
                    Can&apos;t scan? Enter this key manually: <span className="font-semibold">{manualEntryKey}</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-foreground">No QR code available.</p>
              )}
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="mfaCode" className="text-sm text-background">Authentication Code</label>
                <input
                  id="mfaCode"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="rounded bg-gray-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-500 hover:cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingQr}
                  className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Verifying...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </>
        )}

        {backupCodes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-background">Backup Codes</h2>
            <p className="text-sm text-background/90">
              Save these one-time backup codes in a safe place. Each code can be used once if you lose access to your authenticator app.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-4 text-center text-sm text-foreground">
              {backupCodes.map((item) => (
                <div key={item} className="rounded bg-gray-100 px-2 py-1 font-mono">{item}</div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:brightness-110"
              >
                Continue to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
