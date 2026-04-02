import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import Sidebar from '@/components/Sidebar';
import ManagerTickets from '@/components/ManagerTickets';
import AdminTickets from '@/components/AdminTickets';

export default async function TicketsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  const role = session.role?.toLowerCase();

  async function renderRoleSpecificView() {
    switch (role) {
      case "manager":
        return <ManagerTickets role={role} />;
      case "admin":
        return <AdminTickets role={role} />;
      case "customer":
        return <h1>blank</h1>;
      default:
        return <div>You do not have permission to view this page.</div>;
    }
  }

  return (
    <div className="flex h-screen bg-background font-text text-foreground">
      <Sidebar role={role} />
      
      <main className="ml-56 flex-1 p-8 overflow-y-auto">
        {renderRoleSpecificView()}
      </main>
    </div>
  );
}