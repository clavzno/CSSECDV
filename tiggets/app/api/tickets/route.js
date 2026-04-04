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
        const { subject, type, body, attachments = [] } = payload; 

        // --- 🚨 CRITICAL CHECK: Tampering ---
        if (payload.userId && payload.userId !== session.userId) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_CREATED',
                ticketStatus: 'NA',
                details: `${session.userId} tampers with the request to create a ticket under another user's account (${payload.userId}).`,
                priorityLevel: 'critical',
                assignedTo: 'N/A', 
                replyTo: 'N/A',
                attachments: attachments
            });
            return NextResponse.json({ error: 'Forbidden Tampering' }, { status: 403 });
        }

        // --- ERROR CHECK: Validation ---
        if (!subject || !type || !body) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_CREATED',
                ticketStatus: 'NA', 
                details: `Ticket creation by ${session.userId} fails due to validation issue: Missing required fields.`,
                priorityLevel: 'error',
                assignedTo: 'N/A', 
                replyTo: 'N/A',
                attachments: attachments
            });
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        const ticketid = `#${Math.floor(100000 + Math.random() * 900000)}`;

        // --- REORDERED OBJECT ---
        const newTicket = {
            ticketid, 
            subject,
            type,
            body,
            status: 'OPEN', 
            createdBy: session.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            // --- MOVED: Now appears before the arrays ---
            assignedTo: null, // assignedManagerId 
            attachments: attachments,
            replies: [],
            editedAt: null, 
            editedBy: null
        };
        
        await db.collection('tickets').insertOne(newTicket);

        // --- INFO CHECK ---
        await createLog({
            userId: session.userId,
            actionType: 'TICKET_CREATED',
            ticketStatus: 'OPEN',
            details: `${session.userId} created Ticket ID ${ticketid} with subject ${subject} and details ${body}.`,
            priorityLevel: 'info',
            assignedTo: 'N/A', 
            replyTo: 'N/A',
            attachments: attachments
        });

        return NextResponse.json({ message: 'Ticket created', ticketid }, { status: 201 });

        // do not remove this
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        if (session) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_CREATED',
                ticketStatus: 'NA',
                details: `Ticket creation by ${session.userId} fails due to server or database issue.`,
                priorityLevel: 'error',
                assignedTo: 'N/A',
                replyTo: 'N/A',
                attachments: []
            });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}