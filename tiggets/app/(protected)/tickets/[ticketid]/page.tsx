import ViewTicket from '@/components/ViewTicket';

type ViewTicketPageProps = {
    params: {
        ticketid: string;
    };
};

// view ticket page
export default async function ViewTicketPage({
    params,
}: ViewTicketPageProps) {
    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <ViewTicket ticketId={params.ticketid} />
        </main>
    );
}