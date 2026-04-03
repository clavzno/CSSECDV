import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content

export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  // replace this later 
  const username = session?.user?.name ?? "N/A";
  const email = session?.user?.email ?? "N/A";
  const role = session?.user?.role ?? "N/A";

  return (
    <main className="ml-56 min-h-screen bg-background p-6">
      {/** Header */}
      <div className="w-full font-text text-foreground">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
      </div>

      {/** Profile Content */}
      <div className="max-w-3xl rounded-xl border border-border-gray bg-background p-6 shadow-sm">
        <div className="space-y-6">


          {/** actual content should go here, just remove the divs that are inside this one for settings */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Username: {username}</p>
            <p className="mt-1 text-base text-foreground">Please contact an admin to change your username.</p>
          </div>

          {/** Role */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Role: {role}</p>
            <p className="mt-1 text-base text-foreground">Please contact an admin to change your role.</p>
          </div>

          {/** Email */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email: {email}</p>
            <p className="mt-1 text-base text-foreground">Please contact an admin to change your email.</p>
          </div>

          {/** Change Password Link */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Password</p>
            <a
              href="/settings"
              className="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Change Password
            </a>
          </div>


        </div>
      </div>
    </main>
  );
}