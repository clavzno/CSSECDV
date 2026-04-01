import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import Dashboard from '@/components/Dashboard';

export default async function DashboardPage() {
  // 1. Call your centralized RBAC file
  const session = await getCurrentSession();

  // 2. Fail securely if no session
  if (!session) {
    redirect('/');
  }

  // 3. Pass the verified role to the client component
  return <Dashboard role={session.role} />;
}