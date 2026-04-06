import { redirect } from 'next/navigation';
// session
import { getCurrentSession } from '@/lib/rbac';
// database
import clientPromise from '@/lib/mongodb';
// content
import UserManagement from '@/components/UserManagement';

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

    const users = await db.collection('users').find({}).toArray();
    const tickets = await db.collection('tickets').find({}).toArray();

    const pendingInvitedUsers = await db.collection('users')
        .find({ accountStatus: 'invited' })
        .sort({ invitedAt: -1 })
        .toArray();

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
            mongoId: objectId,
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

    const formattedPendingUsers = pendingInvitedUsers.map((user) => ({
        id: String(user._id || '').trim(),
        username: String(user.username || '').trim(),
        email: String(user.email || '').trim(),
        role: String(user.role || 'customer').trim().toLowerCase(),
        firstName: String(user.firstName || '').trim(),
        lastName: String(user.lastName || '').trim(),
        invitedAt: user.invitedAt ? new Date(user.invitedAt).toLocaleString() : 'N/A',
        inviteExpiresAt: user.inviteExpiresAt ? new Date(user.inviteExpiresAt).toLocaleString() : 'N/A',
        accountStatus: String(user.accountStatus || '').trim(),
    }));

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            {/** if the user is a manager, they can see the list of tickets per user. if they are an admin, they can create a new user and/or change roles. */}
            <UserManagement
                role={session.role}
                session={session}
                users={formattedUsers}
                pendingUsers={formattedPendingUsers}
            />
        </main>
    );
}