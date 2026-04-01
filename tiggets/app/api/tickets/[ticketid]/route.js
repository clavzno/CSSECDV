import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog } from '@/lib/logger';

export async function PUT(request, { params }) {
    let session;
    try {
        session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const ticketid = resolvedParams.ticketid; 
        const updates = await request.json(); 
        
        // --- ERROR CHECK ---
        if (Object.keys(updates).length === 0 || (updates.status !== undefined && updates.status.trim() === '')) {
            const isStatusChange = updates.status !== undefined;
            await createLog({
                userId: session.userId,
                actionType: isStatusChange ? 'TICKET_STATUS_CHANGE' : 'TICKET_EDITED',
                ticketStatus: 'NA', 
                // Updated to include exact user ID
                details: `Authorized edit by ${session.userId} fails due to validation issue: Invalid or missing update data.`,
                priorityLevel: 'error' 
            });
            return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const existingTicket = await db.collection('tickets').findOne({ ticketid });
        if (!existingTicket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        // --- 🚨 CRITICAL CHECK ---
        if (session.role === 'customer' && existingTicket.createdBy.toString() !== session.userId.toString()) {
            const actionType = updates.status ? 'TICKET_STATUS_CHANGE' : 'TICKET_EDITED';
            await createLog({
                userId: session.userId,
                actionType: actionType,
                ticketStatus: existingTicket.status,
                // Updated to include exact user ID
                details: `${session.userId} attempts to edit another user's content or tampers with identifiers on ticket ${ticketid}.`,
                priorityLevel: 'critical' 
            });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await db.collection('tickets').updateOne(
            { ticketid },
            { $set: { ...updates, updatedAt: new Date() } }
        );

        // --- INFO LOGGING ---
        if (updates.status) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_STATUS_CHANGE',
                ticketStatus: updates.status, 
                details: `${session.userId} has edited the status of ${ticketid} to ${updates.status}.`,
                priorityLevel: 'info'
            });
        } else if (updates.replyId) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_EDITED',
                ticketStatus: existingTicket.status,
                details: `${session.userId} has edited reply ${updates.replyId} to message ${ticketid}`,
                priorityLevel: 'info'
            });
        } else {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_EDITED',
                ticketStatus: existingTicket.status,
                details: `${session.userId} has edited starting post in message ${ticketid}`,
                priorityLevel: 'info'
            });
        }

        return NextResponse.json({ message: 'Ticket updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Ticket Update Error:', error);
        if (session) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_EDITED', 
                ticketStatus: 'NA',
                // Updated to include exact user ID
                details: `Authorized edit by ${session.userId} fails due to server or database issue.`,
                priorityLevel: 'error'
            });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}