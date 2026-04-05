import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default async function ChangePasswordPage() {
  const session = await getCurrentSession();

  // Protect the route
  if (!session) {
    redirect('/');
  }

  return (
    <main className="ml-56 min-h-screen bg-background p-6">
      {/* You don't even need to pass the session to this form anymore 
        because our backend route handles finding the user automatically! 
      */}
      <ChangePasswordForm />
    </main>
  );
}