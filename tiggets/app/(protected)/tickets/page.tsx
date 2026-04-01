import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import CreateTicket from '@/components/CreateTicket';

export default async function TicketsPage() {
  // 1. Securely fetch the current session
  const session = await getCurrentSession();

  // 2. If no session exists, fail securely and redirect to login
  if (!session) {
    redirect('/');
  }

  // Optional: If you want to enforce that Admins can't even see this page
  // import { isAuthorized } from '@/lib/rbac';
  // if (!isAuthorized(session.role, '/tickets')) redirect('/dashboard');

  return (
    <div>
      <main className="ml-64 min-h-screen bg-background p-6">
        {/* 4. Render your Create Ticket form */}
        <CreateTicket />
      </main>
    </div>
  );
}