"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function ChangePasswordForm() {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [requiresMfaPrompt, setRequiresMfaPrompt] = useState(true);
  const [verificationMode, setVerificationMode] = useState('mfa');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [mfaCode, setMfaCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);

  const passwordChecks = getPasswordChecks(newPassword);
  const strength = getStrengthScore(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  // Fetch the user's questions when the page loads
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/auth/change-password");
        const data = await res.json();
        
        if (res.ok) {
          setMfaEnabled(Boolean(data.mfaEnabled));
          setRequiresMfaPrompt(data.requiresMfaPrompt !== false);
          setVerificationMode(data.mfaEnabled ? 'mfa' : 'questions');
          setQuestions(data.questions);
        } else {
          setStatus({ type: "error", message: "Failed to load security questions." });
        }
      } catch (err) {
        setStatus({ type: "error", message: "Server error loading questions." });
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    // 1. Basic Validation
    if (!mfaEnabled && answers.some((ans) => ans.trim() === "")) {
      return setStatus({ type: "error", message: "Please answer all security questions." });
    }
    if (mfaEnabled && requiresMfaPrompt && verificationMode === 'mfa' && !/^\d{6}$/.test(mfaCode.trim())) {
      return setStatus({ type: "error", message: "Please enter a valid 6-digit MFA code." });
    }
    if (mfaEnabled && requiresMfaPrompt && verificationMode === 'backup' && !backupCode.trim()) {
      return setStatus({ type: "error", message: "Please enter a backup code." });
    }
    if (!passwordsMatch) {
      return setStatus({ type: "error", message: "New passwords do not match." });
    }
    if (strength.score < 3) {
      return setStatus({ type: "error", message: "Password does not meet strength requirements." });
    }

    // 2. Send to Backend
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          ...(mfaEnabled && requiresMfaPrompt
            ? verificationMode === 'mfa'
              ? { mfaCode, backupCode: '' }
              : { backupCode, mfaCode: '' }
            : { answers }),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: "Password updated successfully!" });
        setNewPassword("");
        setConfirmPassword("");
        setAnswers(["", "", ""]);
        setMfaCode("");
        setBackupCode("");
      } else {
        setStatus({ type: "error", message: data.error || "Failed to update password." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "An unexpected server error occurred." });
    }
  };

  if (loading) {
    return <div className="p-6 text-zinc-500">Loading security settings...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 w-full font-text text-foreground">
        <h1 className="text-3xl font-bold">Change Password</h1>
        <p className="mt-2 text-zinc-500">Verify your identity to update your security credentials.</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Identity Verification Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">
              {mfaEnabled ? 'Multi-Factor Authentication' : 'Security Questions'}
            </h2>

            {mfaEnabled && requiresMfaPrompt ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="radio"
                      name="verificationMode"
                      value="mfa"
                      checked={verificationMode === 'mfa'}
                      onChange={(e) => setVerificationMode(e.target.value)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    Authentication Code
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="radio"
                      name="verificationMode"
                      value="backup"
                      checked={verificationMode === 'backup'}
                      onChange={(e) => setVerificationMode(e.target.value)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    Backup Code
                  </label>
                </div>

                {verificationMode === 'mfa' ? (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Authentication Code
                    </label>
                    <input
                      type="text"
                      required
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full rounded-md border border-zinc-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Backup Code
                    </label>
                    <input
                      type="text"
                      required
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      className="w-full rounded-md border border-zinc-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter one backup code"
                    />
                  </div>
                )}
              </div>
            ) : mfaEnabled ? (
              <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                MFA prompt not required from your current trusted IP.
              </p>
            ) : questions.length > 0 ? (
              questions.map((q, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    {q.question}
                  </label>
                  <input
                    type="text"
                    required
                    value={answers[index]}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="w-full rounded-md border border-zinc-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter your answer"
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-red-500">No security questions found for this account.</p>
            )}
          </div>

          {/* New Password Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">New Password</h2>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">New Password</label>
              <div className="space-y-2">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-zinc-700">Strength</p>
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
                  <p className="text-[10px] text-zinc-700">{strength.label}</p>
                  <div className="group relative">
                    <button
                      type="button"
                      aria-label="Password requirements"
                      className="grid h-4 w-4 place-items-center rounded-full border border-zinc-400 text-[10px] font-bold text-zinc-700"
                    >
                      i
                    </button>
                    <div className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-72 -translate-x-1/2 rounded-md bg-white p-2 text-[10px] leading-4 text-zinc-700 shadow-md border border-zinc-200 group-hover:block group-focus-within:block">
                      <p>Minimum 15 characters in length</p>
                      <p>Maximum 64 characters</p>
                      <p>Must include uppercase and lowercase letters</p>
                      <p>Must include numbers or special symbols</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {confirmPassword && (
                <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordsMatch ? 'Passwords match!' : 'Passwords do not match!'}
                </p>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {status.message && (
            <div className={`rounded-md p-3 text-sm font-medium ${
              status.type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
            }`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={(!mfaEnabled && questions.length === 0) || !passwordsMatch || strength.score < 3}
            className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}