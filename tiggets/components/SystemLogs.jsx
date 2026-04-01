import Link from 'next/link';

// getting logs
import clientPromise from '@/lib/mongodb';

const mockLogs = [
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'N/A',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'info',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'open',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'warning',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'resolved',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'error',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'processing',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'pending',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
    // add more
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'N/A',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'info',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'open',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'warning',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'resolved',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'error',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'processing',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'pending',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'N/A',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'info',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'open',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'warning',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'resolved',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'error',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'processing',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'pending',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'N/A',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'info',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'open',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'warning',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'resolved',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'error',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'processing',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
    {
        logId: '1212121',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        userId: 'manager',
        actionType: 'LOGOUT',
        ticketStatus: 'pending',
        details: 'admin successfully logged out via manual logout.',
        priorityLevel: 'critical',
    },
]

export default async function SystemLogs({ session }) {
    // TODO: call a security function here that checks the role
    const role = session?.role;

    if (role?.toLowerCase() != "admin") {
        return null;
    }

    function setTicketStatusColor(status) {
        switch (status) {
            case 'Resolved': return 'bg-green-200 text-green-800 border-green-300';
            case 'Open': return 'bg-red-200 text-red-800 border-red-300';
            case 'Processing': return 'bg-teal-200 text-teal-800 border-teal-300';
            case 'Pending': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    }

    function setPriorityStatusColor(priority) {
        switch (priority) {
            case 'info': return 'bg-div-gray text-gray-800 border-gray-300';
            case 'warning': return 'bg-warning-yellow text-warning-yellow-stroke border-warning-yellow-stroke';
            case 'error': return 'bg-error-orange text-error-orange-stroke border-error-orange-stroke';
            case 'critical': return 'bg-red-200 text-red-800 border-red-300';
            default: return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    }

    async function getSystemLogs() {
        try {
            const client = await clientPromise;
            const db = client.db('TicketingSystem');

            const logs = await db
                .collection('logs')
                .find({})
                .sort({ timestamp: -1 })
                .toArray();

            return logs;
        } catch (error) {
            console.error('Failed to fetch system logs:', error);
            return [];
        }
    }
    // TODO: call a security function here that checks the role
    if (role?.toLowerCase() != "admin") {
        return null;
    }

    // get the logs
    const logs = await getSystemLogs();

    return (
        <div className="w-full font-text text-foreground">
            <div className="w-full mb-8">
                {/* Header */}
                <h1 className="text-3xl font-bold w-full">System Logs</h1>
            </div>

            {/** Logs Div */}
            <div className="rounded-t-lg overflow-hidden border border-border-gray shadow-sm">

                {/** Filter Section  */}

                {/** Logs */}
                <table className="w-full text-left border-collapse bg-background text-sm">
                    <thead>
                        <tr className="bg-div-gray border-b border-border-gray">
                            <th className="py-4 px-6 font-semibold text-center">Log ID #</th>
                            <th className="py-4 px-6 font-semibold text-center">Timestamp</th>
                            <th className="py-4 px-6 font-semibold text-center">User ID #</th>
                            <th className="py-4 px-6 font-semibold text-center">Action Type</th>
                            <th className="py-4 px-6 font-semibold">Details</th>
                            <th className="py-4 px-6 font-semibold text-center">Status</th>
                            <th className="py-4 px-6 font-semibold text-center">Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr
                                key={`${log.logId}-${log.timestamp}-${log.priorityLevel}`}
                                className="border-b border-border-gray hover:bg-div-gray/30 transition-colors bg-white"
                            >
                                <td className="py-4 px-6 text-center font-medium">
                                    {log.logId}
                                </td>
                                <td className="py-4 px-6 text-center whitespace-nowrap text-gray-600">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    {log.userId}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    {log.actionType}
                                </td>
                                <td className="py-4 px-6">
                                    {/** cut off if it's too long */}
                                    <div className="max-w-80 truncate">
                                        {log.details}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setTicketStatusColor(
                                        log.ticketStatus?.charAt(0).toUpperCase() + log.ticketStatus?.slice(1)
                                    )}`}>
                                        {log.ticketStatus?.toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setPriorityStatusColor(log.priorityLevel)}`}>
                                        {log.priorityLevel?.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="text-center py-6 text-sm font-medium bg-div-gray text-foreground border-t border-border-gray" />
            </div>
        </div>
    );
}