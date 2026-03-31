import { redirect } from 'next/navigation';

import Sidebar from '@/components/Sidebar';
import CreateTicket from '@/components/CreateTicket';

// placeholder for auth lookup
async function getCurrentUser() {
  return {
    username: 'customer',
    role: 'customer',
  };
}

export default async function TicketsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div>
      <Sidebar role={user.role} />
      <main className="ml-64 min-h-screen bg-background p-6">
        <CreateTicket />
      </main>
    </div>
  );
}
