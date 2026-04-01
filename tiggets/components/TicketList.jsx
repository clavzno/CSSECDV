import Link from 'next/link';
// mock data
const mockTickets = [
    { id: '#0142067', userId: '#0142067', subject: 'Lorem ipsum dolor sit amet...', type: 'Transferees: Credit transfer and accreditations', status: 'Resolved', lastUpdate: 'August 8, 2020' },
    { id: '#0142068', userId: '#0142068', subject: 'Course withdrawals or dropping procedures', type: 'Course withdrawals...', status: 'Open', lastUpdate: 'August 7, 2020' },
    { id: '#0142069', userId: '#0142069', subject: 'Graduation requirements...', type: 'Graduation requirements...', status: 'Processing', lastUpdate: 'August 6, 2020' },
    { id: '#0142070', userId: '#0142070', subject: 'Graduation requirements...', type: 'Graduation requirements...', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142040', userId: '#0142040', subject: 'Graduation requirements...', type: 'Graduation requirements...', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142030', userId: '#0142030', subject: 'Graduation requirements...', type: 'Graduation requirements...', status: 'Pending', lastUpdate: 'August 5, 2020' },
];

export default function TicketList({ tickets, role }) {
    const isManager = role?.toLowerCase() === 'manager';
    
    // Use the tickets sent from the parent, otherwise use local mockTickets
    const displayTickets = tickets || mockTickets;

    function setTicketStatusColor(status) {
        switch (status) {
            case 'Resolved': return 'bg-green-200 text-green-800 border-green-300';
            case 'Open': return 'bg-red-200 text-red-800 border-red-300';
            case 'Processing': return 'bg-teal-200 text-teal-800 border-teal-300';
            case 'Pending': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    }

    return (
        <div className="rounded-t-lg overflow-hidden border border-border-gray shadow-sm">
            <table className="w-full text-left border-collapse bg-background text-sm">
                <thead>
                    <tr className="bg-div-gray border-b border-border-gray">
                        <th className="py-4 px-6 font-semibold">Ticket ID #</th>
                        <th className="py-4 px-6 font-semibold">User ID #</th>
                        <th className="py-4 px-6 font-semibold">Subject</th>
                        <th className="py-4 px-6 font-semibold">Type</th>
                        <th className="py-4 px-6 font-semibold text-center">Status</th>
                        <th className="py-4 px-6 font-semibold text-center">Last Update</th>
                        {isManager && <th className="py-4 px-6 font-semibold text-center">Details</th>}
                    </tr>
                </thead>
                <tbody>
                    {displayTickets.map((ticket) => {
                        const cleanId = ticket.id.replace('#', '');
                        const viewPath = `/tickets/${cleanId}`;

                        return (
                            <tr key={ticket.id} className="border-b border-border-gray hover:bg-div-gray/30 transition-colors bg-white">
                                <td className="py-4 px-6 font-medium">
                                    <Link href={viewPath}>{ticket.id}</Link>
                                </td>
                                <td className="py-4 px-6">
                                    <Link href={viewPath}>{ticket.userId || ticket.id}</Link> {/* Safely handles missing userIds */}
                                </td>
                                <td className="py-4 px-6 truncate max-w-37.5">
                                    <Link href={viewPath}>{ticket.subject}</Link>
                                </td>
                                <td className="py-4 px-6 max-w-37.5">
                                    <Link href={viewPath}>{ticket.type}</Link>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <Link href={viewPath}>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setTicketStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </Link>
                                </td>
                                <td className="py-4 px-6 text-center whitespace-nowrap text-gray-600">
                                    <Link href={viewPath}>{ticket.lastUpdate}</Link>
                                </td>
                                {isManager && (
                                    <td className="py-4 px-6 text-right">
                                        <Link href={viewPath}>
                                            <button className="bg-tiggets-lightgreen hover:opacity-90 text-white px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer">
                                                View
                                            </button>
                                        </Link>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="text-center py-6 text-sm font-medium bg-div-gray text-foreground border-t border-border-gray" />
        </div>
    );
}