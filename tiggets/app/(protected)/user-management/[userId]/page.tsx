import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import ManageUserTickets from '@/components/ManageUserTickets.jsx';

// do not remove this line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function ManageSingleUserPage({ params }: { params: any }) {
    const { userid } = await params;

    const rawSession = await getCurrentSession();

    if (!rawSession) {
        redirect('/');
    }

    const session = {
        ...rawSession,
        userId: rawSession.userId.toString()
    };

    if (session.role?.toLowerCase() !== 'manager' && session.role?.toLowerCase() !== 'admin') {
        return <div className="p-6 font-text">Access Denied.</div>;
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');

    if (!/^[0-9a-fA-F]{24}$/.test(userid)) {
        return <div className="p-6 font-text">User not found.</div>;
    }

    const targetUserRaw = await db.collection('users').findOne({
        _id: new ObjectId(userid)
    });

    if (!targetUserRaw) {
        return <div className="p-6 font-text">User not found.</div>;
    }

    const targetMongoId = String(targetUserRaw._id);
    const targetUsername = String(targetUserRaw.username || '').trim();
    const targetUsernameLower = String(targetUserRaw.usernameLower || targetUsername.toLowerCase()).trim();
    const targetEmail = String(targetUserRaw.email || '').trim();
    const targetEmailLower = String(targetUserRaw.emailLower || targetEmail.toLowerCase()).trim();
    const targetRole = String(targetUserRaw.role || 'customer').toLowerCase();

    const targetIdentifiers = new Set(
        [
            targetMongoId,
            targetUsername,
            targetUsernameLower,
            targetEmail,
            targetEmailLower,
        ]
            .map((value) => String(value || '').trim())
            .filter(Boolean)
    );

    const targetUser = {
        mongoId: targetMongoId,
        id: targetMongoId,
        name: `${targetUserRaw.firstName ?? ''} ${targetUserRaw.lastName ?? ''}`.trim() || targetUsername || 'Unknown',
        username: targetUsername || 'Unknown',
        email: targetEmail || 'No email provided',
        role: targetRole
    };

    const allTickets = await db.collection('tickets')
        .find({})
        .sort({ lastAccessedAt: -1, createdAt: -1 })
        .toArray();

    const createdRawTickets = allTickets.filter((ticket) => {
        const createdBy = String(ticket.createdBy || '').trim();
        if (!createdBy) return false;

        return (
            targetIdentifiers.has(createdBy) ||
            targetIdentifiers.has(createdBy.toLowerCase())
        );
    });

    const assignedRawTickets = allTickets.filter((ticket) => {
        const assignedTo = String(ticket.assignedTo || '').trim();
        if (!assignedTo) return false;

        return (
            targetIdentifiers.has(assignedTo) ||
            targetIdentifiers.has(assignedTo.toLowerCase())
        );
    });

    // do not remove this line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatTickets = (rawTickets: any[]) =>
        rawTickets.map((t) => ({
            id: String(t.ticketid || t.ticketId || t._id),
            userId: String(t.createdBy || 'N/A'),
            subject: String(t.subject || 'Untitled'),
            type: String(t.type || 'General'),
            status: String(t.status || 'Open'),
            lastUpdate: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
        }));

    const createdTickets = formatTickets(createdRawTickets);
    const assignedTickets = formatTickets(assignedRawTickets);

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <ManageUserTickets
                targetUser={targetUser}
                createdTickets={createdTickets}
                assignedTickets={assignedTickets}
                role={session.role}
            />
        </main>
    );
}