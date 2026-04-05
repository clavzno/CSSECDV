import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content
import Settings from '@/components/Settings';

export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  return (
    <main className="ml-56 min-h-screen bg-background p-6">
      <Settings session={session} />
    </main>
  );
}