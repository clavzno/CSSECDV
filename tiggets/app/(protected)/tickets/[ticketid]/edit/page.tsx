type EditTicketPageProps = {
    params: Promise<{
        ticketid: string;
    }>;
};

// edit ticket page
export default async function EditTicketPage({
    params,
}: EditTicketPageProps) {
    const resolvedParams = await params;
    const currentTicketId = String(resolvedParams?.ticketid ?? '').trim();

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <h1>{currentTicketId}</h1>
        </main>
    );
}