import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// database
import clientPromise from '@/lib/mongodb';
// content
import UserManagement from '@/components/UserManagement';
// rbac 
import isAuthorized from '@/lib/rbac'

export default async function UserManagementPage() {
    const rawSession = await getCurrentSession();

    if (!rawSession) {
        redirect('/');
    }

    const session = {
        ...rawSession,
        userId: rawSession.userId.toString()
    };

    const currentSessionId = String(rawSession.userId || "").trim();

    const client = await clientPromise;
    const db = client.db('TicketingSystem');

    // check if authorized
    const currentPath = '/user-management'
    if (!isAuthorized(session.role.toLowerCase(), currentPath)) {
        return (
            <main className="ml-56 min-h-screen bg-background p-6">
                <h1 className="mb-8 text-3xl font-bold">
                    You are not authorized to view this page.
                </h1>
            </main>
        );
    }

    const users = await db.collection('users').find({}).toArray();
    const tickets = await db.collection('tickets').find({}).toArray();

    // Map the users and get their ticket metrics
    const formattedUsers = users.map(user => {
        const userIdStr = String(user._id);
        const altUserId = String(user.userId || '').trim();
        const username = String(user.username || '').trim();

        const isCurrentUser =
            currentSessionId === userIdStr ||
            currentSessionId === altUserId ||
            currentSessionId === username;

        // Find tickets tied to this user based on their role
        let userTickets = [];
        if (user.role?.toLowerCase() === 'customer') {
            userTickets = tickets.filter(t =>
                t.createdBy === userIdStr || t.createdBy === altUserId || t.createdBy === username
            );
        } else {
            userTickets = tickets.filter(t =>
                t.assignedTo === userIdStr || t.assignedTo === altUserId || t.assignedTo === username
            );
        }

        // Count active tickets (anything not resolved)
        const activeCount = userTickets.filter(t =>
            ['Open', 'Processing', 'Pending'].includes(t.status || 'Open')
        ).length;

        return {
            id: altUserId || userIdStr,
            name: user.firstName + " " + user.lastName || 'No name provided.',
            username: user.username || "No username provided.",
            email: user.email || 'No email provided.',
            role: user.role?.toLowerCase() || 'customer' || "No role provided.",
            active: activeCount,
            all: userTickets.length,
            isCurrentUser,
        };
    });

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            {/** if the user is a manager, they can see the list of tickets per user */}
            <UserManagement role={session.role} session={session} users={formattedUsers} />
            {/** if the user is an admin, they can see that and change the roles per user */}
        </main>
    );
}