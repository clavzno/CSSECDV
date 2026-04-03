import CreateAccountForm from '@/components/CreateAccountForm';

export default function CreateAccountPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 font-text">
      <div className="absolute inset-0 bg-[url('/Login-bg.png')] bg-cover bg-center bg-fixed blur-lg" />
      <div className="relative z-10 w-full max-w-6xl">
        <CreateAccountForm />
      </div>
    </div>
  );
}
