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
        <>
            <h1>{params.ticketID}</h1>
        </>
    );
}