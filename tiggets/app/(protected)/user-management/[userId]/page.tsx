import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/rbac';
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

    // delete when connect to db
    const mockTargetUser = {
        id: userId, // <-- Changed from params.userId
        name: 'Charlie Kirk', 
        email: 'charliekirk@edu.com',
        role: 'manager' 
    };

    let mockUserTickets = [];

    // DB READY: The Conditional Fetch Logic
    if (mockTargetUser.role === 'customer') {
        // mockUserTickets = await db.collection("tickets").find({ userId: userId }).toArray();
        console.log("Fetching tickets CREATED by this customer...");
    } 
    else if (mockTargetUser.role === 'manager') {
        // mockUserTickets = await db.collection("tickets").find({ assignedTo: userId }).toArray();
        console.log("Fetching tickets ASSIGNED TO this manager...");
        
        mockUserTickets = [
            { id: '#0142069', userId: '#0142011', assignedTo: userId, subject: 'Slow database queries', type: 'Service Request', status: 'Processing', lastUpdate: 'August 6, 2020' },
            { id: '#0142070', userId: '#0142022', assignedTo: userId, subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
        ];
    }
    // delete when connect to db

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <ManageUserTickets 
                targetUser={mockTargetUser} 
                tickets={mockUserTickets} 
                role={session.role} 
            />
        </main>
    );
}