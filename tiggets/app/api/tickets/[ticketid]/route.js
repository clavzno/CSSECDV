import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog } from '@/lib/logger';
import crypto from 'crypto'; 
import { ObjectId } from 'mongodb'; // Ensure ObjectId is imported for role validation

export async function PUT(request, { params }) {
    let session;
    try {
        session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const ticketid = resolvedParams.ticketid; 
        const updates = await request.json(); 
        
        // Setup defaults for incoming updates
        const incomingReplyId = updates.replyId || 'N/A';
        const incomingAttachments = updates.attachments || [];

        // --- ERROR CHECK: Validation ---
        if (Object.keys(updates).length === 0 || (updates.status !== undefined && updates.status.trim() === '')) {
            const isStatusChange = updates.status !== undefined;
            await createLog({
                userId: session.userId,
                actionType: isStatusChange ? 'TICKET_STATUS_CHANGE' : 'TICKET_EDITED',
                ticketStatus: 'NA', 
                details: `Authorized edit by ${session.userId} fails due to validation issue: Invalid or missing update data.`,
                priorityLevel: 'error',
                assignedTo: 'N/A', 
                replyTo: incomingReplyId,
                attachments: incomingAttachments
            });
            return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const existingTicket = await db.collection('tickets').findOne({ ticketid });
        if (!existingTicket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        const currentAssignedManager = existingTicket.assignedManagerId || 'N/A';

        // --- 🚨 CRITICAL CHECK: Security & Ownership ---
        if (session.role === 'customer' && existingTicket.createdBy.toString() !== session.userId.toString()) {
            const actionType = updates.status ? 'TICKET_STATUS_CHANGE' : 'TICKET_EDITED';
            await createLog({
                userId: session.userId,
                actionType: actionType,
                ticketStatus: existingTicket.status,
                details: `${session.userId} attempts to edit another user's content or tampers with identifiers on ticket ${ticketid}.`,
                priorityLevel: 'critical',
                assignedTo: currentAssignedManager,
                replyTo: incomingReplyId,
                attachments: incomingAttachments
            });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ==========================================
        // 🛡️ SECURITY: VALIDATE MANAGER ASSIGNMENT
        // ==========================================
        if (updates.assignedManagerId) {
            try {
                // Look up the target user to verify their role
                const targetUser = await db.collection('users').findOne({ 
                    _id: new ObjectId(updates.assignedManagerId) 
                });

                // Fail if user doesn't exist or isn't a manager/admin
                if (!targetUser || (targetUser.role !== 'manager' && targetUser.role !== 'admin')) {
                    await createLog({
                        userId: session.userId,
                        actionType: 'TICKET_ASSIGN_FAIL',
                        ticketStatus: existingTicket.status,
                        details: `${session.userId} attempted to assign ticket ${ticketid} to unauthorized user ID: ${updates.assignedManagerId}.`,
                        priorityLevel: 'error',
                        assignedTo: currentAssignedManager,
                        replyTo: 'N/A',
                        attachments: []
                    });
                    return NextResponse.json({ error: 'Target user lacks manager permissions' }, { status: 403 });
                }
            } catch (err) {
                return NextResponse.json({ error: 'Invalid Manager ID format' }, { status: 400 });
            }
        }

        // ==========================================
        // 💬 NEW: ADDING A NEW REPLY (FLAT CHAT)
        // ==========================================
        if (updates.newMessage) {
            const newReplyId = `rep_${crypto.randomUUID()}`;
            
            const newReply = {
                replyId: newReplyId,
                senderId: session.userId,
                message: updates.newMessage,
                timestamp: new Date(),
                attachments: incomingAttachments 
            };

            await db.collection('tickets').updateOne(
                { ticketid },
                { 
                    $push: { replies: newReply },
                    $set: { updatedAt: new Date() }
                }
            );

            await createLog({
                userId: session.userId,
                actionType: 'TICKET_REPLIED', 
                ticketStatus: existingTicket.status,
                details: `${session.userId} added a new reply to ticket ${ticketid}.`,
                priorityLevel: 'info',
                assignedTo: currentAssignedManager,
                replyTo: newReplyId, 
                attachments: incomingAttachments
            });

            return NextResponse.json({ message: 'Reply added successfully', reply: newReply }, { status: 200 });
        }

        // ==========================================
        // ✏️ EXISTING: EDITING, STATUS, OR ASSIGNMENT
        // ==========================================
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
                priorityLevel: 'info',
                assignedTo: currentAssignedManager,
                replyTo: 'N/A', 
                attachments: incomingAttachments
            });
        } else if (updates.replyId) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_EDITED',
                ticketStatus: existingTicket.status,
                details: `${session.userId} has edited reply ${updates.replyId} to message ${ticketid}`,
                priorityLevel: 'info',
                assignedTo: currentAssignedManager,
                replyTo: updates.replyId, 
                attachments: incomingAttachments
            });
        } else if (updates.assignedManagerId) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_ASSIGNED', 
                ticketStatus: existingTicket.status,
                details: `${session.userId} assigned ticket ${ticketid} to manager ${updates.assignedManagerId}.`,
                priorityLevel: 'info',
                assignedTo: updates.assignedManagerId, 
                replyTo: 'N/A', 
                attachments: incomingAttachments
            });
        } else {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_EDITED',
                ticketStatus: existingTicket.status,
                details: `${session.userId} has edited starting post in message ${ticketid}`,
                priorityLevel: 'info',
                assignedTo: currentAssignedManager,
                replyTo: 'N/A', 
                attachments: incomingAttachments
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
                details: `Authorized edit by ${session.userId} fails due to server or database issue.`,
                priorityLevel: 'error',
                assignedTo: 'N/A',
                replyTo: 'N/A',
                attachments: []
            });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}