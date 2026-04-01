import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog } from '@/lib/logger';

export async function POST() {
    try {
        // 1. Identify the session
        const session = await getCurrentSession();

        if (session) {
            const client = await clientPromise;
            const db = client.db('TicketingSystem');
            
            // Optional: Fetch the username using the session's userId (which is the DB _id) for a cleaner log
            // If you don't do this, it will just log the raw DB ID, which is still safe!
            const user = await db.collection('users').findOne({ _id: session.userId });
            const logIdentifier = user ? user.username : session.userId;

            // 2. Destroy the session in the database
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('session');
            
            if (sessionCookie) {
                 await db.collection('sessions').deleteOne({ sessionId: sessionCookie.value });
            }

            // 📝 LOG: LOGOUT
            await createLog({
                userId: logIdentifier,
                actionType: 'LOGOUT',
                details: `${logIdentifier} successfully logged out via manual logout.`,
                priorityLevel: 'info'
            });
        }

        // 3. Clear the cookie from the browser
        const cookieStore = await cookies();
        cookieStore.delete('session');

        return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    } catch (error) {
        console.error('Logout Route Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}