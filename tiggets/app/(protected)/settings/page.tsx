import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content

export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  return (
    <main className="ml-56 min-h-screen bg-background p-6">
      {/** Header */}
      <div className="w-full font-text text-foreground">
        <h1 className="text-3xl font-bold mb-8">Settings Header</h1>
      </div>
    </main>
  );
}