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
        <>
            <h1>{params.ticketID}</h1>
        </>
    );
}