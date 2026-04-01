type EditTicketPageProps = {
    params: {
        ticketID: string;
    };
};

// edit ticket page
export default async function EditTicketPage({
    params,
}: EditTicketPageProps) {
    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <h1>{params.ticketID}</h1>
        </main>
    );
}