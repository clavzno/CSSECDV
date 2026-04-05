import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content
import Profile from '@/components/Profile';

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  return (
    <main className="ml-56 min-h-screen bg-background p-6">
      <Profile session={session} />
    </main>
  );
}

