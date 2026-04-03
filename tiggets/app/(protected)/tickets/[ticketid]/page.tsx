// specific ticket page
// this is the server page which will fetch data
import ViewTicket from '@/components/ViewTicket';
import ManagerViewTicket from '@/components/ManagerViewTicket';
import { getCurrentSession } from '@/lib/rbac';
import { redirect } from 'next/navigation';

import clientPromise from '@/lib/mongodb';

type ViewTicketPageProps = {
    params: {
        ticketid: string;
    };
};

export default async function ViewTicketPage({ params }: ViewTicketPageProps) {
    const session = await getCurrentSession();

    if (!session) {
        redirect('/');
    }

    const isManager = session.role?.toLowerCase() === 'manager';
    const currentTicketId = params.ticketid;

    const client = await clientPromise;
    const db = client.db();

    const ticket = await db.collection('tickets').findOne(
        { ticketid: currentTicketId },
        {
            projection: {
                _id: 0,
            },
        }
    );

    // return not found 
    if (!ticket) {
        return (
            <main className="ml-56 min-h-screen bg-background p-6">
                <h1 className="text-3xl font-bold mb-8">Not found.</h1>
            </main>
        );
    }

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