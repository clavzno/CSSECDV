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

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    
    const users = await db.collection('users').find({}).toArray();
    const tickets = await db.collection('tickets').find({}).toArray();

    // Map the users and get their ticket metrics
    const formattedUsers = users.map(user => {
        const userIdStr = String(user._id);
        const altUserId = user.userId || '';
        const username = user.username || '';

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
            name: username || 'Unknown User',
            email: user.email || 'No email provided',
            role: user.role?.toLowerCase() || 'customer',
            active: activeCount,
            all: userTickets.length
        };
    });
    // -------------------------------------
    
    return(
        <main className="ml-56 min-h-screen bg-background p-6"> 
            <UserManagement role={session.role} session={session} users={formattedUsers} />
        </main>
    );
}