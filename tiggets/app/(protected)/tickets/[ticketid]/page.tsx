type ViewTicketPageProps = {
    params: {
        ticketID: string;
    };
};

// view ticket page
export default async function ViewTicketPage({
    params,
}: ViewTicketPageProps) {
    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <h1>{params.ticketID}</h1>
        </main>
    );
}