"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,24}$/;

export default function AccountInitiationModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    role: "customer",
    firstName: "",
    lastName: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const requiresName = useMemo(() => {
    const normalizedRole = String(form.role || "").toLowerCase();
    return normalizedRole === "admin" || normalizedRole === "manager";
  }, [form.role]);

  if (!isOpen) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetAndClose() {
    setForm({
      username: "",
      email: "",
      role: "customer",
      firstName: "",
      lastName: "",
    });
    setErrors({});
    setSubmitError("");
    onClose();
  }

  function validate() {
    const nextErrors = {};

    if (!USERNAME_REGEX.test(form.username.trim())) {
      nextErrors.username = "3-24 chars using letters, numbers, ., _, -";
    }

    if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!["admin", "manager", "customer"].includes(form.role)) {
      nextErrors.role = "Please select a valid role.";
    }

    if (requiresName) {
      if (form.firstName.trim().length < 2) {
        nextErrors.firstName = "First name must be at least 2 characters.";
      }

      if (form.lastName.trim().length < 2) {
        nextErrors.lastName = "Last name must be at least 2 characters.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    try {
      await onSubmit({
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      resetAndClose();
    } catch (error) {
      setSubmitError(error?.message || "Failed to initiate account.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-2xl rounded-md border border-border-gray bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border-gray px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Initiate Account</h2>
            <p className="text-sm text-zinc-500">
              Define the user details and generate the onboarding email.
            </p>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {submitError && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Username*
              </label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={updateField}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3b5949]"
                placeholder="Username..."
              />
              {errors.username && (
                <p className="text-xs text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email*
              </label>
              <input
                id="email"
                name="email"
                value={form.email}
                onChange={updateField}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3b5949]"
                placeholder="user@email.com"
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Role*
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={updateField}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3b5949] cursor-pointer"
              >
                <option value="customer">Customer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-600">{errors.role}</p>
              )}
            </div>

            <div className="flex items-end">
              <div className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                First and last name are required only for admin and manager accounts.
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                First Name{requiresName ? "*" : ""}
              </label>
              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={updateField}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3b5949]"
                placeholder="First name..."
              />
              {errors.firstName && (
                <p className="text-xs text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                Last Name{requiresName ? "*" : ""}
              </label>
              <input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={updateField}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#3b5949]"
                placeholder="Last name..."
              />
              {errors.lastName && (
                <p className="text-xs text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border-gray pt-4">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={isSubmitting}
              className="rounded bg-gray-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-500 disabled:opacity-70 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Create Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}