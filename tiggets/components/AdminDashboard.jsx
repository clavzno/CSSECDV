// content 
import TicketList from '@/components/TicketList';
// rbac 
import isAuthorized from '@/lib/rbac'

export default function AdminDashboard({ session, role, tickets }) {
    // check if authorized
    const currentPath = '/dashboard'
    if (!isAuthorized(session.role.toLowerCase(), currentPath)) {
        return (
            <main className="ml-56 min-h-screen bg-background p-6">
                <h1 className="mb-8 text-3xl font-bold">
                    You are not authorized to view this page.
                </h1>
            </main>
        );
    }

    const formattedTickets = tickets.map((ticket) => ({
        ...ticket,
        username: ticket.username || ticket.createdByUsername || 'N/A',
        assignedToUsername: ticket.assignedToUsername || 'N/A',
    }));

    return (
        <div className="w-full font-text text-foreground">
            <div className="w-full mb-8">
                {/* Header */}
                <h1 className="text-3xl font-bold w-full">Dashboard</h1>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-50 border border-border-gray flex flex-col">
                    <h2 className="text-lg font-semibold mb-4">Ticket type metrics</h2>
                    <div className="w-full flex-1 bg-div-gray rounded flex items-center justify-center text-sm opacity-60">
                        Chart Area
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-50 border border-border-gray flex flex-col">
                    <h2 className="text-lg font-semibold mb-4">Recently Opened</h2>
                    <div className="w-full flex-1 bg-div-gray rounded flex items-center justify-center text-sm opacity-60">
                        Number Unread Critical Logs
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-50 border border-border-gray flex flex-col">
                    <h2 className="text-lg font-semibold mb-4">Recently Opened</h2>
                    <div className="w-full flex-1 bg-div-gray rounded flex items-center justify-center text-sm opacity-60">
                        Number Open/Pending/Processing Tickets
                    </div>
                </div>
            </div>

            {/* Ticket List */}
            <TicketList
                role={role}
                tickets={formattedTickets}
            />
        </div>
    );
}