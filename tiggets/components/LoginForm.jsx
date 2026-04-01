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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Send credentials to our native MongoDB login route
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      window.alert(data.lastLoginMessage);

      // Save the user data (including role) locally so the Dashboard can read it
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to the dashboard
      router.push('/dashboard');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-tiggets-green p-8 shadow-md">
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
        </div>

        <label className="flex items-center gap-2 font-text text-sm text-background">
          <input
            type="checkbox"
            name="rememberMe"
            className="h-4 w-4 accent-tiggets-lightgreen"
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 rounded-lg bg-tiggets-lightgreen px-4 py-3 font-text font-semibold text-white transition hover:cursor-pointer drop-shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}