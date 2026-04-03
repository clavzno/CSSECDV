import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content
import UserManagement from '@/components/UserManagement';

export default async function UserManagementPage() {
    const rawSession = await getCurrentSession(); //
    
    if (!rawSession) {
      redirect('/'); //
    }

    // Serialize the MongoDB ID to prevent Vercel Server-to-Client build errors
    const session = {
        ...rawSession,
        userId: rawSession.userId.toString()
    };
    
    return(
        <main className="ml-56 min-h-screen bg-background p-6"> {/* */}
            <UserManagement role={session.role} session={session} />
        </main>
    );
}