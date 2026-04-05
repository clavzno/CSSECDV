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

   // authorization is checked in AdminDashboard, ManagerDashboard (not yet for CustomerDashboard)
   return (
         <main className="ml-56 min-h-screen bg-background p-6">
           <Dashboard role={session.role} session={session} />
         </main>
   );
 }