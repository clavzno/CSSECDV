"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Tiggets from '@/public/Tiggets.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,24}$/;

const SECURITY_QUESTIONS = [
  'What is the name of a college you applied to but didn\'t attend?',
  'What was the name of the first school you remember attending?',
  'Where was the destination of your most memorable school field trip?',
  'What was your maths teacher\'s surname in your 8th year of school?',
  'What was the name of your first stuffed toy?',
  'What was your driving instructor\'s first name?',
];

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

export default function CreateAccountForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    question1: '',
    answer1: '',
    question2: '',
    answer2: '',
    question3: '',
    answer3: '',
    acceptedTerms: false,
    enableMFA: false,
  });

  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(() => getPasswordChecks(form.password), [form.password]);
  const strength = useMemo(() => getStrengthScore(form.password), [form.password]);
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  function isQuestionTaken(question, currentIndex) {
    return [1, 2, 3].some((index) => index !== currentIndex && form[`question${index}`] === question);
  }

  useEffect(() => {
    const username = form.username.trim();
    if (!username || !USERNAME_REGEX.test(username)) {
      setUsernameAvailable(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/register?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameAvailable(Boolean(data.available));
      } catch {
        setUsernameAvailable(null);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [form.username]);

  useEffect(() => {
    const email = form.email.trim();
    if (!email || !EMAIL_REGEX.test(email)) {
      setEmailAvailable(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/register?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setEmailAvailable(Boolean(data.available));
      } catch {
        setEmailAvailable(null);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [form.email]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function validateForm() {
    const errors = {};

    if (!USERNAME_REGEX.test(form.username.trim())) {
      errors.username = '3-24 chars using letters, numbers, ., _, -';
    }

    if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (form.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters.';
    }

    if (form.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters.';
    }

    if (!Object.values(passwordChecks).every(Boolean)) {
      errors.password = 'Password does not meet policy requirements.';
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    const questionValues = [form.question1, form.question2, form.question3].map((q) => q.trim());
    const answerValues = [form.answer1, form.answer2, form.answer3].map((a) => a.trim());

    if (questionValues.some((q) => !q)) {
      errors.securityQuestions = 'Please select all 3 security questions.';
    }

    if (new Set(questionValues).size !== questionValues.length) {
      errors.securityQuestions = 'Security questions must be unique.';
    }

    if (answerValues.some((a) => a.length < 2)) {
      errors.securityAnswers = 'Each answer must be at least 2 characters.';
    }

    if (!form.acceptedTerms) {
      errors.acceptedTerms = 'You must accept the Terms and Conditions.';
    }

    if (usernameAvailable === false) {
      errors.username = 'Username unavailable.';
    }

    if (emailAvailable === false) {
      errors.email = 'Email already in use.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        acceptedTerms: form.acceptedTerms,
        enableMFA: form.enableMFA,
        securityQuestions: [
          { question: form.question1, answer: form.answer1 },
          { question: form.question2, answer: form.answer2 },
          { question: form.question3, answer: form.answer3 },
        ],
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      if (data.nextStep === 'mfa_setup') {
        setSuccessMessage('Account setup started. Redirecting to verification...');
        setTimeout(() => router.push(data.setupPath || '/MFASetup'), 900);
        return;
      }

      if (data.nextStep === 'account_created') {
        setSuccessMessage('Account created successfully. Redirecting to login...');
        setTimeout(() => router.push('/'), 900);
        return;
      }

      setSuccessMessage('Account created successfully. Redirecting to login...');
      setTimeout(() => router.push('/'), 900);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function StatusBadge({ okText, failText, state }) {
    if (state === null) return null;

    if (state) {
      return (
        <p className="rounded bg-[#9edc8d] px-2 py-1 text-[10px] text-[#1a3d1a]">
          {okText}
        </p>
      );
    }

    return (
      <p className="rounded bg-[#ef8b8b] px-2 py-1 text-[10px] text-[#5f1b1b]">
        {failText}
      </p>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-[#123528] to-[#173529] p-6 shadow-md md:p-10">
      <div className="mb-6 flex flex-col items-center gap-1">
        <Image src={Tiggets} alt="Tiggets logo" width={190} height={72} className="h-auto" priority />
        <p className="text-center font-text text-xl text-background">Create a free account to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(submitError || successMessage) && (
          <div className={`rounded-lg p-3 text-sm font-medium ${submitError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {submitError || successMessage}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="username" className="text-sm text-background">Username*</label>
              <div className="space-y-1">
                <input id="username" name="username" value={form.username} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen" placeholder="Username..." />
                <StatusBadge okText="Username Available!" failText="Username Unavailable!" state={usernameAvailable} />
                {fieldErrors.username && <p className="text-xs text-[#ff9f9f]">{fieldErrors.username}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="email" className="text-sm text-background">Email address*</label>
              <div className="space-y-1">
                <input id="email" name="email" value={form.email} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen" placeholder="JohnDoe@email.com..." />
                <StatusBadge okText="Valid email address." failText="Please enter a valid email." state={EMAIL_REGEX.test(form.email.trim()) && emailAvailable !== false ? true : form.email ? false : null} />
                {fieldErrors.email && <p className="text-xs text-[#ff9f9f]">{fieldErrors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="firstName" className="text-sm text-background">First name*</label>
              <div>
                <input id="firstName" name="firstName" value={form.firstName} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen" placeholder="John..." />
                {fieldErrors.firstName && <p className="text-xs text-[#ff9f9f]">{fieldErrors.firstName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="lastName" className="text-sm text-background">Last name*</label>
              <div>
                <input id="lastName" name="lastName" value={form.lastName} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen" placeholder="Doe..." />
                {fieldErrors.lastName && <p className="text-xs text-[#ff9f9f]">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="password" className="text-sm text-background">Password*</label>
              <div className="space-y-2">
                <input id="password" name="password" type="password" value={form.password} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen" />
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-background">Strength</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      const active = strength.score >= level;
                      const palette = ['#ef8b8b', '#f6c15f', '#d9e58f', '#9edc8d'];
                      return (
                        <span
                          key={level}
                          className="h-2 w-7 rounded"
                          style={{ backgroundColor: active ? palette[level - 1] : '#d1d5db' }}
                        />
                      );
                    })}
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
                {fieldErrors.password && <p className="text-xs text-[#ff9f9f]">{fieldErrors.password}</p>}
              </div>
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label htmlFor="confirmPassword" className="text-sm text-background">Confirm Password</label>
              <div className="space-y-1">
                <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen" />
                <StatusBadge okText="Passwords match!" failText="Passwords do not match!" state={form.confirmPassword ? passwordsMatch : null} />
                {fieldErrors.confirmPassword && <p className="text-xs text-[#ff9f9f]">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            <p className="text-xs text-background">*Required</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg text-background underline">Security Questions</h2>
              <div className="group relative">
                <button
                  type="button"
                  aria-label="Security questions help"
                  className="grid h-4 w-4 place-items-center rounded-full border border-background/60 text-[10px] font-bold text-background"
                >
                  i
                </button>
                <div className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-72 -translate-x-1/2 rounded-md bg-[#f6f6f6] p-2 text-[10px] leading-4 text-foreground shadow-md group-hover:block group-focus-within:block">
                  Security questions help us make sure it&apos;s you when you change your password.
                </div>
              </div>
            </div>

            {[1, 2, 3].map((index) => (
              <div key={index} className="space-y-2">
                <label htmlFor={`question${index}`} className="text-sm text-background">Question {index}*</label>
                <select id={`question${index}`} name={`question${index}`} value={form[`question${index}`]} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen">
                  <option value="">Select a question</option>
                  {SECURITY_QUESTIONS.map((question) => (
                    <option
                      key={question}
                      value={question}
                      disabled={isQuestionTaken(question, index)}
                    >
                      {question}
                    </option>
                  ))}
                </select>

                <label htmlFor={`answer${index}`} className="text-sm text-background">Answer {index}*</label>
                <input id={`answer${index}`} name={`answer${index}`} value={form[`answer${index}`]} onChange={updateField} className="w-full rounded border border-border-gray bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-tiggets-lightgreen" />
              </div>
            ))}

            {(fieldErrors.securityQuestions || fieldErrors.securityAnswers) && (
              <p className="text-xs text-[#ff9f9f]">{fieldErrors.securityQuestions || fieldErrors.securityAnswers}</p>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-background">
          <input type="checkbox" name="acceptedTerms" checked={form.acceptedTerms} onChange={updateField} className="h-4 w-4 accent-tiggets-lightgreen" />
          I have accepted the <a href="#" className="underline">Terms and Conditions.</a>
        </label>
        {fieldErrors.acceptedTerms && <p className="text-xs text-[#ff9f9f]">{fieldErrors.acceptedTerms}</p>}

        <label className="flex items-center gap-2 text-sm text-background">
          <input type="checkbox" name="enableMFA" checked={form.enableMFA} onChange={updateField} className="h-4 w-4 accent-tiggets-lightgreen" />
          Enable Multi-Factor Authentication for added security (recommended)
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push('/')} className="rounded bg-gray-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-500 hover:cursor-pointer">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded bg-tiggets-lightgreen px-5 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
}
