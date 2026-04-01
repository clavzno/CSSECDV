import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// content

export default async function ProfilePage() {
    const session = await getCurrentSession();
    
      if (!session) {
        redirect('/');
      }
    
    return(
        <>
        <h1>Profile Page</h1>
        </>
    );
}