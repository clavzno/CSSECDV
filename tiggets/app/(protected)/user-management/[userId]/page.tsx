import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import ManageUserTickets from '@/components/ManageUserTickets.jsx';

export default async function ManageSingleUserPage({ params }) {
    const { userId } = await params;

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

    let targetUserRaw;
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
        targetUserRaw = await db.collection('users').findOne({
            $or: [{ _id: new ObjectId(userId) }, { userId: userId }]
        });
    } else {
        targetUserRaw = await db.collection('users').findOne({ userId: userId });
    }

    if (!targetUserRaw) {
        return <div className="p-6 font-text">User not found.</div>;
    }

    const targetUser = {
        id: targetUserRaw.userId || String(targetUserRaw._id),
        name: targetUserRaw.username || 'Unknown',
        email: targetUserRaw.email || 'No email provided',
        role: (targetUserRaw.role || 'customer').toLowerCase()
    };

    let query = {};
    const rawIdStr = String(targetUserRaw._id);
    
    if (targetUser.role === 'customer') {
        query = { 
            $or: [{ createdBy: targetUser.id }, { createdBy: rawIdStr }, { createdBy: targetUserRaw.username }] 
        };
    } else {
        query = { 
            $or: [{ assignedTo: targetUser.id }, { assignedTo: rawIdStr }, { assignedTo: targetUserRaw.username }] 
        };
    }

    const rawTickets = await db.collection('tickets')
        .find(query)
        .sort({ lastAccessedAt: -1, createdAt: -1 })
        .toArray();

    const formattedTickets = rawTickets.map(t => ({
        id: String(t.ticketid || t.ticketId || t._id),
        userId: String(t.createdBy || 'N/A'),
        subject: String(t.subject || 'Untitled'),
        type: String(t.type || 'General'),
        status: String(t.status || 'Open'),
        lastUpdate: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
    }));

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <ManageUserTickets 
                targetUser={targetUser} 
                tickets={formattedTickets} 
                role={session.role} 
            />
        </main>
    );
}