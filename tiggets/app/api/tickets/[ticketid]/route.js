import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog } from '@/lib/logger';
import crypto from 'crypto'; 
import { ObjectId } from 'mongodb'; 

export async function PUT(request, { params }) {
    let session;
    try {
        session = await getCurrentSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const ticketid = resolvedParams.ticketid; 
        const updates = await request.json(); 
        
        const incomingReplyId = updates.replyId || 'N/A';
        
        // --- SECURE FILE LOGGING ---
        // Keep the raw data for the tickets collection, but strip out the base64 string for the logs!
        const incomingAttachments = updates.attachments || [];
        const safeLogAttachments = incomingAttachments.map(att => att.name || att || 'Unknown File');

        // --- ERROR CHECK: Validation ---
        if (Object.keys(updates).length === 0 || (updates.status !== undefined && updates.status.trim() === '')) {
            const isStatusChange = updates.status !== undefined;
            await createLog({
                userId: session.userId,
                actionType: isStatusChange ? 'TICKET_STATUS_CHANGE' : 'TICKET_EDITED',
                ticketStatus: 'NA', 
                details: `Authorized edit by ${session.userId} fails due to validation issue.`,
                priorityLevel: 'error',
                assignedTo: 'N/A', 
                replyTo: incomingReplyId,
                attachments: safeLogAttachments // <-- UPDATED
            });
            return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');

        const existingTicket = await db.collection('tickets').findOne({ ticketid });
        if (!existingTicket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        const currentAssignedManager = existingTicket.assignedTo || 'N/A';

        // --- 🚨 CRITICAL CHECK: Security & Ownership ---
        if (session.role === 'customer' && existingTicket.createdBy.toString() !== session.userId.toString()) {
            const actionType = updates.status ? 'TICKET_STATUS_CHANGE' : 'TICKET_EDITED';
            await createLog({
                userId: session.userId,
                actionType: actionType,
                ticketStatus: existingTicket.status,
                details: `${session.userId} attempts to edit unauthorized content on ticket ${ticketid}.`,
                priorityLevel: 'critical',
                assignedTo: currentAssignedManager,
                replyTo: incomingReplyId,
                attachments: safeLogAttachments // <-- UPDATED
            });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // --- 🛡️ SECURITY: VALIDATE MANAGER ASSIGNMENT ---
        if (updates.assignedTo) {
            try {
                const targetUser = await db.collection('users').findOne({ 
                    _id: new ObjectId(updates.assignedTo) 
                });

                if (!targetUser || (targetUser.role !== 'manager' && targetUser.role !== 'admin')) {
                    await createLog({
                        userId: session.userId,
                        actionType: 'TICKET_ASSIGN_FAIL',
                        ticketStatus: existingTicket.status,
                        details: `${session.userId} attempted unauthorized assignment to ${updates.assignedTo}.`,
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
        // 🛡️ SECURITY: VALIDATE REPLY OWNERSHIP
        // ==========================================
        const actionReplyId = updates.replyId || updates.deleteReplyId;
        if (actionReplyId) {
            const targetReply = existingTicket.replies?.find(r => r.replyId === actionReplyId);
            
            if (targetReply && session.role !== 'admin' && targetReply.senderId.toString() !== session.userId.toString()) {
                await createLog({
                    userId: session.userId,
                    actionType: 'TICKET_EDITED',
                    ticketStatus: existingTicket.status,
                    details: `${session.userId} attempted unauthorized modification/deletion of reply ${actionReplyId}.`,
                    priorityLevel: 'error',
                    assignedTo: currentAssignedManager,
                    replyTo: actionReplyId,
                    attachments: []
                });
                return NextResponse.json({ error: 'You can only modify or delete your own replies' }, { status: 403 });
            }
        }

        // ==========================================
        // 💬 NEW REPLY (FLAT CHAT)
        // ==========================================
        if (updates.newMessage) {
            const newReplyId = `rep_${crypto.randomUUID()}`;
            
            const newReply = {
                replyId: newReplyId,
                senderId: session.userId,
                message: updates.newMessage,
                timestamp: new Date(),
                editedAt: null,
                editedBy: null,
                attachments: incomingAttachments // <-- Keep the full data payload for the DB ticket object
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
                attachments: safeLogAttachments // <-- UPDATED
            });

            return NextResponse.json({ message: 'Reply added successfully', reply: newReply }, { status: 200 });
        }

        // ==========================================
        // ✏️ EDITING, DELETING, OR TICKET STATUS
        // ==========================================
        
        // Ensure log timestamp perfectly matches database timestamp
        const actionTimestamp = new Date(); 

        if (updates.replyId && updates.message) {
            // EDIT SPECIFIC REPLY
            await db.collection('tickets').updateOne(
                { ticketid, "replies.replyId": updates.replyId },
                { 
                    $set: { 
                        "replies.$.message": updates.message,
                        "replies.$.editedAt": actionTimestamp, 
                        "replies.$.editedBy": session.userId, 
                        updatedAt: new Date() 
                    } 
                }
            );
        } else if (updates.deleteReplyId) {
            // DELETE SPECIFIC REPLY
            await db.collection('tickets').updateOne(
                { ticketid },
                { 
                    $pull: { replies: { replyId: updates.deleteReplyId } },
                    $set: { updatedAt: new Date() }
                }
            );
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_EDITED',
                ticketStatus: existingTicket.status,
                details: `${session.userId} deleted reply ${updates.deleteReplyId} on ticket ${ticketid}.`,
                priorityLevel: 'info',
                assignedTo: currentAssignedManager,
                replyTo: 'N/A',
                attachments: []
            });
            return NextResponse.json({ message: 'Reply deleted successfully' }, { status: 200 });
        } else {
            // STANDARD TICKET-LEVEL UPDATES
            const setPayload = { ...updates, updatedAt: new Date() };
            
            // NEW: If they edit the main starting post (body/subject), stamp it with edit fields
            if (updates.body || updates.subject) {
                setPayload.editedAt = actionTimestamp;
                setPayload.editedBy = session.userId;
            }

            await db.collection('tickets').updateOne(
                { ticketid },
                { $set: setPayload }
            );
        }

        // --- INFO LOGGING FOR STANDARD UPDATES ---
        if (updates.status) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_STATUS_CHANGE',
                ticketStatus: updates.status, 
                details: `${session.userId} edited ticket status to ${updates.status}.`,
                priorityLevel: 'info',
                assignedTo: currentAssignedManager,
                replyTo: 'N/A', 
                attachments: safeLogAttachments // <-- UPDATED
            });
        } else if (updates.replyId) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_EDITED',
                ticketStatus: existingTicket.status,
                details: `${session.userId} edited reply ${updates.replyId} on ticket ${ticketid}`,
                priorityLevel: 'info',
                assignedTo: currentAssignedManager,
                replyTo: updates.replyId, 
                attachments: safeLogAttachments, // <-- UPDATED
                editedAt: actionTimestamp, 
                editedBy: session.userId
            });
        } else if (updates.assignedTo) {
            await createLog({
                userId: session.userId,
                actionType: 'TICKET_ASSIGNED', 
                ticketStatus: existingTicket.status,
                details: `${session.userId} assigned ticket ${ticketid} to manager ${updates.assignedTo}.`,
                priorityLevel: 'info',
                assignedTo: updates.assignedTo, 
                replyTo: 'N/A', 
                attachments: safeLogAttachments // <-- UPDATED
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
                attachments: safeLogAttachments, // <-- UPDATED
                ...(updates.body || updates.subject ? { editedAt: actionTimestamp, editedBy: session.userId } : {})
            });
        }

        return NextResponse.json({ message: 'Ticket updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Ticket Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}