import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog } from '@/lib/logger';

export async function POST(request) {
    let session;
    try {
        session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await request.json();
        const { subject, type, body } = payload;

        // --- 🚨 CRITICAL CHECK ---
        if (payload.userId && payload.userId !== session.userId) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_CREATED',
                ticketStatus: 'NA',
                // Updated to include exact user ID
                details: `${session.userId} tampers with the request to create a ticket under another user's account (${payload.userId}).`,
                priorityLevel: 'critical'
            });
            return NextResponse.json({ error: 'Forbidden Tampering' }, { status: 403 });
        }

        // --- ERROR CHECK ---
        if (!subject || !type || !body) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_CREATED',
                ticketStatus: 'NA', 
                // Updated to include exact user ID
                details: `Ticket creation by ${session.userId} fails due to validation issue: Missing required fields.`,
                priorityLevel: 'error'
            });
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        const ticketid = `#${Math.floor(100000 + Math.random() * 900000)}`;

        const newTicket = {
            ticketid, 
            subject,
            type,
            body,
            status: 'OPEN', 
            createdBy: session.userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection('tickets').insertOne(newTicket);

        // --- INFO CHECK ---
        await createLog({
            userId: session.userId,
            actionType: 'TICKET_CREATED',
            ticketStatus: 'OPEN',
            details: `${session.userId} created Ticket ID ${ticketid} with subject ${subject} and details ${body}.`,
            priorityLevel: 'info'
        });

        return NextResponse.json({ message: 'Ticket created', ticketid }, { status: 201 });

    } catch (error) {
        if (session) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_CREATED',
                ticketStatus: 'NA',
                // Updated to include exact user ID
                details: `Ticket creation by ${session.userId} fails due to server or database issue.`,
                priorityLevel: 'error' 
            });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}