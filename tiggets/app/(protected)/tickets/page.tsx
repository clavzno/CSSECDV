import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import Sidebar from '@/components/Sidebar';
import ManagerTickets from '@/components/ManagerTickets';

export default async function TicketsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  function renderRoleSpecificView() {
    switch (session.role?.toLowerCase()) {
      case "manager":
        return <ManagerTickets role={session.role} />;
      case "admin":
        return <h1>blank</h1>;
      case "customer":
        return <h1>blank</h1>;
      default:
        return <div>No Access. Role: {session.role}</div>;
    }
  }

  return (
    <div className="flex h-screen bg-background font-text text-foreground">
      <Sidebar role={session.role} />
      
      <main className="ml-56 flex-1 p-8 overflow-y-auto">
        {renderRoleSpecificView()}
      </main>
    </div>
  );
}