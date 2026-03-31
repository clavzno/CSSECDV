"use client"; // for interactivity

// logo 
import Image from 'next/image';
import Tiggets from '@/public/Tiggets.png';
// redirects
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  // handle form submission
  const router = useRouter();
  function handleSubmit(event) {
    event.preventDefault();
    router.push('/dashboard?role=admin');
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

        <form className="flex flex-col gap-4">
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
              placeholder="Enter your username"
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
              placeholder="Enter your password"
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

          {/* TODO: remove ?role=admin we can't trust that */}
          <button
            type="submit"
            className="mt-2 rounded-lg bg-tiggets-lightgreen px-4 py-3 font-text font-semibold text-white transition hover:cursor-pointer drop-shadow-sm"
            onClick={handleSubmit}
          >
            Sign In
          </button>
        </form>
      </div>
  );
}