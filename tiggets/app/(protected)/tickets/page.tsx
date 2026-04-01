import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import CreateTicket from '@/components/CreateTicket';

/**
 * if customer = show list of tickets only belonging to the customer
 * if admin/manager show all tickets, click to go to specific ticket id page -> see page.tsx in [ticketid]
 */
export default async function TicketsPage() {
  const session = await getCurrentSession();

  // If no session exists, fail securely and redirect to login
  if (!session) {
    redirect('/');
  }

  // Optional: If you want to enforce that Admins can't even see this page
  // import { isAuthorized } from '@/lib/rbac';
  // if (!isAuthorized(session.role, '/tickets')) redirect('/dashboard');

  // TODO: CreateTicket is a separate page for customers only, remove this when it's done
  return (
    <div>
      <main className="ml-64 min-h-screen bg-background p-6">
        {/* Render view depending on role */}
        <CreateTicket />
      </main>
    </div>
  );
}