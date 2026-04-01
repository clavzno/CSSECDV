import ViewTicket from '@/components/ViewTicket';
import ManagerViewTicket from '@/components/ManagerViewTicket';
import { getCurrentSession } from '@/lib/rbac'; 
import { redirect } from 'next/navigation';

export default async function ViewTicketPage({ params }: { params: any }) {
    const session = await getCurrentSession();

    if (!session) {
        redirect('/');
    }

    const isManager = session.role?.toLowerCase() === 'manager';

    // THE FIX: We securely 'await' the params so Next.js gives us the actual string ID
    const resolvedParams = await params;
    const currentTicketId = resolvedParams.ticketid;

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            {isManager ? (
                <ManagerViewTicket ticketId={currentTicketId} />
            ) : (
                <ViewTicket ticketId={currentTicketId} />
            )}
        </main>
    );
}