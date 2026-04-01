import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content 
import Dashboard from '@/components/Dashboard';

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  //Pass the verified role to the client component
  return <Dashboard role={session.role} />;
}