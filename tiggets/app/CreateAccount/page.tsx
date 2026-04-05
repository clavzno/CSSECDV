import CreateAccountForm from '@/components/CreateAccountForm';

type CreateAccountPageProps = {
  searchParams?: Promise<{
    invite?: string;
  }>;
};

export default async function CreateAccountPage({
  searchParams,
}: CreateAccountPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const inviteToken = String(resolvedSearchParams?.invite || '').trim();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 font-text">
      <div className="absolute inset-0 bg-[url('/Login-bg.png')] bg-cover bg-center bg-fixed blur-lg" />
      <div className="relative z-10 w-full max-w-6xl">
        <CreateAccountForm inviteToken={inviteToken} />
      </div>
    </div>
  );
}