"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);

  // Fetch the user's questions when the page loads
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/auth/change-password");
        const data = await res.json();
        
        if (res.ok && data.questions) {
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
    if (answers.some((ans) => ans.trim() === "")) {
      return setStatus({ type: "error", message: "Please answer all security questions." });
    }
    if (newPassword.length < 8) {
      return setStatus({ type: "error", message: "Password must be at least 8 characters long." });
    }
    if (newPassword !== confirmPassword) {
      return setStatus({ type: "error", message: "New passwords do not match." });
    }

    // 2. Send to Backend
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: "Password updated successfully!" });
        setNewPassword("");
        setConfirmPassword("");
        setAnswers(["", "", ""]);
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
          
          {/* Security Questions Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">Security Questions</h2>
            {questions.length > 0 ? (
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
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-zinc-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
            disabled={questions.length === 0}
            className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}