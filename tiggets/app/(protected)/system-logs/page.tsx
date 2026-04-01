import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content
import SystemLogs from '@/components/SystemLogs';

export default async function SystemLogsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  return (
    <main className="ml-56 min-h-screen bg-background p-6">
      <SystemLogs session={session} />
    </main>
  );
}