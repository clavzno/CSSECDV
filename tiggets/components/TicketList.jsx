// tickets contain id, subject, type, status, lastUpdate
// TODO: replace with whatever's returned from MongoDB
const mockTickets = [
    {
        id: '#0142067',
        subject: 'Lorem ipsum dolor sit amet...',
        type: 'Transferees: Credit transfer and accreditations',
        status: 'Resolved',
        lastUpdate: 'August 8, 2020',
    },
    {
        id: '#0142068',
        subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, esse!Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, esse!',
        type: 'Course withdrawals or dropping procedures',
        status: 'Open',
        lastUpdate: 'August 7, 2020',
    },
    {
        id: '#0142069',
        subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...',
        type: 'Graduation requirements and clearance',
        status: 'Processing',
        lastUpdate: 'August 6, 2020',
    },
    {
        id: '#0142070',
        subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...',
        type: 'Graduation requirements and clearance',
        status: 'Pending',
        lastUpdate: 'August 5, 2020',
    },
    {
        id: '#0142040',
        subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...',
        type: 'Graduation requirements and clearance',
        status: 'Pending',
        lastUpdate: 'August 5, 2020',
    },
    {
        id: '#0142030',
        subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...',
        type: 'Graduation requirements and clearance',
        status: 'Pending',
        lastUpdate: 'August 5, 2020',
    },
];


export default function TicketList({ role }) {
    // check if the role is manager, else don't show the edit button
    const isManager = role?.toLowerCase() === 'manager';

    // set the status color based on the ticket status
    function setTicketStatusColor(status) {
        switch (status) {
            case 'Resolved':
                return 'bg-green-200 text-green-800 border-green-300';

            case 'Open':
                return 'bg-red-200 text-red-800 border-red-300';

            case 'Processing':
                return 'bg-teal-200 text-teal-800 border-teal-300';

            case 'Pending':
                return 'bg-yellow-200 text-yellow-800 border-yellow-300';

            default:
                return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    }

    return (
        <div className="rounded-t-lg overflow-hidden border border-border-gray shadow-sm">
            <table className="w-full text-left border-collapse bg-background text-sm">
                <thead>
                    <tr className="bg-div-gray border-b border-border-gray">
                        <th className="py-4 px-6 font-semibold">Ticket ID #</th>
                        <th className="py-4 px-6 font-semibold">Subject</th>
                        <th className="py-4 px-6 font-semibold">Type</th>
                        <th className="py-4 px-6 font-semibold text-center">Status</th>
                        <th className="py-4 px-6 font-semibold text-center">Last Update</th>
                        <th className="py-4 px-6" />
                    </tr>
                </thead>
                {/* last th is the Header for Edit button, moved this down here because of the Hydration Error */}
                <tbody>
                    {mockTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b border-border-gray hover:bg-div-gray/30 transition-colors bg-white">
                            <td className="py-4 px-6 font-medium">{ticket.id}</td>
                            <td className="py-4 px-6 truncate max-w-37.5">{ticket.subject}</td>
                            <td className="py-4 px-6 max-w-37.5">{ticket.type}</td>
                            <td className="py-4 px-6 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setTicketStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-center whitespace-nowrap text-gray-600">
                                {ticket.lastUpdate}
                            </td>
                            {/* If the user is an admin/not manager, it will not show the edit button; TODO: onclick lead to another page */}
                            {isManager && (
                                <td className="py-4 px-6 text-right">
                                    <button className="bg-tiggets-lightgreen hover:opacity-90 text-white px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer">
                                        Edit
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Table Footer */}
            <div className="text-center py-6 text-sm font-medium bg-div-gray text-foreground border-t border-border-gray" />
        </div>
    );
}