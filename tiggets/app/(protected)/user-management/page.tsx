import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content
import UserManagement from '@/components/UserManagement';

export default async function UserManagementPage() {
    const session = await getCurrentSession();
    
      if (!session) {
        redirect('/');
      }
    
    return(
        <main className="ml-56 min-h-screen bg-background p-6">
            <UserManagement role={session.role} />
        </main>
    );
}