"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

function initialEnableState() {
  return {
    qrCodeDataUrl: '',
    manualEntryKey: '',
    code: '',
    loading: false,
    confirming: false,
    backupCodes: [],
  };
}

export default function MfaSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaRequiredForRole, setMfaRequiredForRole] = useState(false);
  const [role, setRole] = useState('');

  const [enableFlow, setEnableFlow] = useState(initialEnableState);

  const [showDisablePrompt, setShowDisablePrompt] = useState(false);
  const [disableMode, setDisableMode] = useState('mfa');
  const [disableMfaCode, setDisableMfaCode] = useState('');
  const [disableBackupCode, setDisableBackupCode] = useState('');

  const disableBlocked = useMemo(() => mfaRequiredForRole, [mfaRequiredForRole]);
  const hasFreshBackupCodes = enableFlow.backupCodes.length > 0;

  async function loadStatus() {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/auth/mfa/preferences', { method: 'GET' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load MFA settings.');
      }

      setMfaEnabled(Boolean(data.mfaEnabled));
      setMfaRequiredForRole(Boolean(data.mfaRequiredForRole));
      setRole(String(data.role || ''));

      if (!Boolean(data.mfaEnabled)) {
        setShowDisablePrompt(false);
        setDisableMfaCode('');
        setDisableBackupCode('');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to load MFA settings.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    return () => {
      setEnableFlow(initialEnableState());
    };
  }, []);

  async function startEnableMfa() {
    setStatus({ type: '', message: '' });
    setEnableFlow((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch('/api/auth/mfa/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_enable' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to start MFA setup.');
      }

      setEnableFlow((prev) => ({
        ...prev,
        loading: false,
        qrCodeDataUrl: data.qrCodeDataUrl || '',
        manualEntryKey: data.manualEntryKey || '',
      }));
    } catch (error) {
      setEnableFlow(initialEnableState());
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to start MFA setup.',
      });
    }
  }

  async function confirmEnableMfa() {
    if (!/^\d{6}$/.test(enableFlow.code.trim())) {
      setStatus({ type: 'error', message: 'Enter a valid 6-digit authentication code.' });
      return;
    }

    setStatus({ type: '', message: '' });
    setEnableFlow((prev) => ({ ...prev, confirming: true }));

    try {
      const res = await fetch('/api/auth/mfa/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_enable', code: enableFlow.code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to enable MFA.');
      }

      setEnableFlow((prev) => ({
        ...prev,
        confirming: false,
        backupCodes: Array.isArray(data.backupCodes) ? data.backupCodes : [],
      }));
      setMfaEnabled(true);
      setStatus({
        type: 'success',
        message:
          data.message ||
          'MFA enabled successfully. Backup codes are shown below and will disappear once you leave this page.',
      });
    } catch (error) {
      setEnableFlow((prev) => ({ ...prev, confirming: false }));
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to enable MFA.',
      });
    }
  }

  async function disableMfa() {
    if (disableMode === 'mfa' && !/^\d{6}$/.test(disableMfaCode.trim())) {
      setStatus({ type: 'error', message: 'Enter a valid 6-digit authentication code.' });
      return;
    }

    if (disableMode === 'backup' && !disableBackupCode.trim()) {
      setStatus({ type: 'error', message: 'Enter a backup code.' });
      return;
    }

    setStatus({ type: '', message: '' });
    setSaving(true);

    try {
      const res = await fetch('/api/auth/mfa/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
          mfaCode: disableMode === 'mfa' ? disableMfaCode.trim() : '',
          backupCode: disableMode === 'backup' ? disableBackupCode.trim().toUpperCase() : '',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to disable MFA.');
      }

      setMfaEnabled(false);
      setShowDisablePrompt(false);
      setDisableMfaCode('');
      setDisableBackupCode('');
      setEnableFlow(initialEnableState());
      setStatus({ type: 'success', message: data.message || 'MFA disabled.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to disable MFA.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading MFA settings...</p>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <p className="text-sm font-semibold text-zinc-800">Multi-Factor Authentication</p>
        <p className="mt-1 text-sm text-zinc-600">
          Status:{' '}
          <span className={mfaEnabled ? 'font-medium text-green-700' : 'font-medium text-zinc-700'}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </p>
      </div>

      {status.message && (
        <div
          className={
            status.type === 'error'
              ? 'rounded-md bg-red-50 p-3 text-sm text-red-700'
              : 'rounded-md bg-green-50 p-3 text-sm text-green-700'
          }
        >
          {status.message}
        </div>
      )}

      {hasFreshBackupCodes && (
        <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-800">Backup Codes</p>
          <p className="text-xs text-zinc-600">
            Store these codes safely now. They are only shown on this page and will disappear when you leave.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-md bg-zinc-50 p-3 text-center text-xs text-zinc-800">
            {enableFlow.backupCodes.map((code) => (
              <div key={code} className="rounded bg-white px-2 py-1 font-mono">
                {code}
              </div>
            ))}
          </div>
        </div>
      )}

      {!mfaEnabled && !enableFlow.qrCodeDataUrl && (
        <button
          type="button"
          onClick={startEnableMfa}
          disabled={enableFlow.loading}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {enableFlow.loading ? 'Preparing MFA setup...' : 'Enable MFA'}
        </button>
      )}

      {!mfaEnabled && enableFlow.qrCodeDataUrl && (
        <div className="space-y-3 rounded-md border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-800">Scan your authenticator app and verify once to enable MFA.</p>
          <div className="flex flex-col items-center gap-2">
            <Image
              src={enableFlow.qrCodeDataUrl}
              alt="MFA QR code"
              width={180}
              height={180}
              className="h-44 w-44 rounded bg-white p-2"
              unoptimized
            />
            <p className="text-xs text-zinc-600">
              Can&apos;t scan? Use key: <span className="font-semibold text-zinc-800">{enableFlow.manualEntryKey}</span>
            </p>
          </div>

          {!enableFlow.backupCodes.length && (
            <div className="space-y-2">
              <label htmlFor="mfa-enable-code" className="block text-sm font-medium text-zinc-700">
                Authentication Code
              </label>
              <input
                id="mfa-enable-code"
                type="text"
                value={enableFlow.code}
                onChange={(event) =>
                  setEnableFlow((prev) => ({
                    ...prev,
                    code: event.target.value.replace(/\D/g, '').slice(0, 6),
                  }))
                }
                className="w-full rounded-md border border-zinc-300 p-2.5 text-sm outline-none focus:border-zinc-500"
                placeholder="Enter 6-digit code"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmEnableMfa}
                  disabled={enableFlow.confirming}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {enableFlow.confirming ? 'Verifying...' : 'Confirm and Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => setEnableFlow(initialEnableState())}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {enableFlow.backupCodes.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={loadStatus}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Refresh Status
              </button>
            </div>
          )}
        </div>
      )}

      {mfaEnabled && (
        <div className="space-y-3">
          {disableBlocked ? (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              MFA is required for your {role || 'current'} role and cannot be disabled.
            </p>
          ) : (
            <>
              {!showDisablePrompt ? (
                <button
                  type="button"
                  onClick={() => setShowDisablePrompt(true)}
                  className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Disable MFA
                </button>
              ) : (
                <div className="space-y-3 rounded-md border border-red-200 bg-red-50/40 p-3">
                  <p className="text-sm font-medium text-red-700">
                    Confirm disable: enter one more MFA verification for security.
                  </p>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="disable-mode"
                        value="mfa"
                        checked={disableMode === 'mfa'}
                        onChange={(event) => setDisableMode(event.target.value)}
                        className="h-4 w-4 accent-zinc-700"
                      />
                      Authentication Code
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="disable-mode"
                        value="backup"
                        checked={disableMode === 'backup'}
                        onChange={(event) => setDisableMode(event.target.value)}
                        className="h-4 w-4 accent-zinc-700"
                      />
                      Backup Code
                    </label>
                  </div>

                  {disableMode === 'mfa' ? (
                    <input
                      type="text"
                      value={disableMfaCode}
                      onChange={(event) => setDisableMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full rounded-md border border-zinc-300 bg-white p-2.5 text-sm outline-none focus:border-zinc-500"
                      placeholder="Enter 6-digit code"
                    />
                  ) : (
                    <input
                      type="text"
                      value={disableBackupCode}
                      onChange={(event) => setDisableBackupCode(event.target.value.toUpperCase())}
                      className="w-full rounded-md border border-zinc-300 bg-white p-2.5 text-sm outline-none focus:border-zinc-500"
                      placeholder="Enter backup code"
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={disableMfa}
                      disabled={saving}
                      className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saving ? 'Disabling...' : 'Confirm Disable MFA'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisablePrompt(false);
                        setDisableMfaCode('');
                        setDisableBackupCode('');
                      }}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
