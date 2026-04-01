const mockLogs = [
    {
        id: '#12313',
        eventType: 'Authentication',
        status: 'Success',
        timestamp: '2026-04-01T08:33:26.173+00:00',
        details: 'User logged in successfully'
    },
]

export default async function SystemLogs({ role }) {
    async function getSystemLogs() {

    }

    // TODO: call a security function here that checks the role
    if (role?.toLowerCase() != "admin") {
        return null;
    }

    return (
        <div className="w-full font-text text-foreground bg-red-500">
            <div className="w-full mb-8">
                {/* Header */}
                <h1 className="text-3xl font-bold w-full">System Logs</h1>
            </div>

            {/** List of Tickets */}
        </div>
    );
}