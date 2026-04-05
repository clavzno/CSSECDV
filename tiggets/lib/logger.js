import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { ObjectId } from 'mongodb'; 

export const LOG_EVENT_TYPES = {
    // Admin & User Management (Original)
    ROLE_CHANGE: 'ROLE_CHANGE',
    BULK_ROLE_CHANGE: 'BULK_ROLE_CHANGE',
    USER_DELETION: 'USER_DELETION',
    BULK_USER_DELETION: 'BULK_USER_DELETION',

    // Password Management (Requirement 2.1.13)
    PASSWORD_CHANGE_ATTEMPT: 'PASSWORD_CHANGE_ATTEMPT',
    PASSWORD_CHANGE_SUCCESS: 'PASSWORD_CHANGE_SUCCESS',
    PASSWORD_CHANGE_FAIL: 'PASSWORD_CHANGE_FAIL',
    PASSWORD_CHANGE_VALIDATION_FAIL: 'PASSWORD_CHANGE_VALIDATION_FAIL',

    // Password Recovery (Forgot Password flow)
    FORGOT_PWD_EMAIL_CHECK: 'FORGOT_PWD_EMAIL_CHECK',
    FORGOT_PWD_ATTEMPT: 'FORGOT_PWD_ATTEMPT',
    FORGOT_PWD_SUCCESS: 'FORGOT_PWD_SUCCESS',
    FORGOT_PWD_IDENTITY_FAIL: 'FORGOT_PWD_IDENTITY_FAIL',
    FORGOT_PWD_VALIDATION_FAIL: 'FORGOT_PWD_VALIDATION_FAIL',

    // General Security & System Logs
    ACCESS_DENIED: 'ACCESS_DENIED',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
};

export async function createLog({ 
    userId, 
    actionType,     
    eventType,      
    details, 
    ticketStatus,   
    status,         
    priorityLevel,  
    priority,
    assignedTo = 'N/A', 
    replyTo = 'N/A',    
    attachments = [],
    editedAt = null,
    editedBy = null
}) {
    try {
        const finalEventType = eventType || actionType;
        const finalStatus = status || ticketStatus || 'NA';
        const rawPriority = priority || priorityLevel || 'INFO';
        const finalPriority = rawPriority.toUpperCase(); 

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        
        const stringUserId = userId ? String(userId).trim() : '';
        let displayUser = stringUserId || 'System/Unauthenticated';
        let displayEditor = editedBy ? String(editedBy).trim() : null; 
        
        if (stringUserId.length === 24) {
            try {
                const userDoc = await db.collection('users').findOne({ _id: new ObjectId(stringUserId) });
                if (userDoc && userDoc.username) {
                    displayUser = userDoc.username; 
                    if (displayEditor === stringUserId) {
                        displayEditor = userDoc.username;
                    }
                }
            } catch (err) {
                console.error(`[LOGGER CRASH] The database lookup crashed:`, err.message);
            }
        } 

        const finalDetails = details ? details.replace(new RegExp(stringUserId, 'g'), displayUser) : '';

        const logEntry = {
            logId: crypto.randomUUID(),
            timestamp: new Date(),
            userId: displayUser, 
            eventType: finalEventType, 
            status: finalStatus,
            details: finalDetails, 
            priority: finalPriority,
            assignedTo: assignedTo,
            replyTo: replyTo,
            attachments: attachments,
            editedAt: editedAt,
            editedBy: displayEditor
        };

        await db.collection('logs').insertOne(logEntry);
        console.log(`[AUDIT] ${finalPriority} | ${finalEventType}: ${finalDetails}`);

        return true;
    } catch (error) {
        console.error('Failed to write audit log:', error);
        return false;
    }
}