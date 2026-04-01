// content for admin dashboard
import TicketList from '@/components/TicketList';

export default function AdminDashboard({ role }) {
    // TODO: call a security function here that checks the role
    if (role?.toLowerCase() != "admin") {
        return null;
    }

    return (
        <div>
            <div className="w-full font-text text-foreground">
                {/* Header */}
                <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
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
            <TicketList role={role} />
        </div>
    );
}