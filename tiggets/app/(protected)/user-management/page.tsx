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
    const ACTIVE_STATUSES = new Set(['open', 'pending', 'processing']);

    const formattedUsers = users.map((user) => {
        const objectId = String(user._id || '').trim();
        const username = String(user.username || '').trim();
        const usernameLower = String(user.usernameLower || username.toLowerCase()).trim();
        const email = String(user.email || '').trim();
        const emailLower = String(user.emailLower || email.toLowerCase()).trim();
        const role = String(user.role || 'customer').toLowerCase();

        const userIdentifiers = new Set(
            [
                objectId,
                username,
                usernameLower,
                email,
                emailLower,
            ]
                .map((value) => String(value || '').trim())
                .filter(Boolean)
        );

        const isCurrentUser =
            userIdentifiers.has(currentSessionId) ||
            userIdentifiers.has(currentSessionId.toLowerCase());

        const userTickets = tickets.filter((ticket) => {
            const ticketOwnerValue =
                role === 'customer'
                    ? String(ticket.createdBy || '').trim()
                    : String(ticket.assignedTo || '').trim();

            if (!ticketOwnerValue) return false;

            return (
                userIdentifiers.has(ticketOwnerValue) ||
                userIdentifiers.has(ticketOwnerValue.toLowerCase())
            );
        });

        const activeCount = userTickets.filter((ticket) =>
            ACTIVE_STATUSES.has(String(ticket.status || '').trim().toLowerCase())
        ).length;

        return {
            id: objectId,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name provided.',
            username: username || 'No username provided.',
            email: email || 'No email provided.',
            role,
            active: activeCount,
            all: userTickets.length,
            isCurrentUser,
        };
    });

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            {/** if the user is a manager, they can see the list of tickets per user. if they are an admin, they can create a new user and/or change roles. */}
            <UserManagement role={session.role} session={session} users={formattedUsers} />
        </main>
    );
}