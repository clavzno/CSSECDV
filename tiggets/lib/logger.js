import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { ObjectId } from 'mongodb'; 

export async function createLog({ 
    userId, 
    actionType,     
    eventType,      
    details, 
    ticketStatus,   
    status,         
    priorityLevel,  
    priority,
    // Safely default new fields so old calls don't crash
    assignedTo = 'N/A', 
    replyTo = 'N/A',    
    attachments = []    
}) {
    try {
        // Map old variables to new ones if needed
        const finalEventType = eventType || actionType;
        const finalStatus = status || ticketStatus || 'NA';
        const rawPriority = priority || priorityLevel || 'INFO';
        const finalPriority = rawPriority.toUpperCase(); 

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        
        // Clean the ID string
        const stringUserId = userId ? String(userId).trim() : '';
        let displayUser = stringUserId || 'System/Unauthenticated';
        
        if (stringUserId.length === 24) {
            try {
                // Database lookup to swap ID for Username
                const userDoc = await db.collection('users').findOne({ _id: new ObjectId(stringUserId) });
                if (userDoc && userDoc.username) {
                    displayUser = userDoc.username; 
                }
            } catch (err) {
                console.error(`[LOGGER CRASH] The database lookup crashed:`, err.message);
            }
        } 

        // Replace raw IDs in the details text with the human-readable username
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
            attachments: attachments
        };

        await db.collection('logs').insertOne(logEntry);
        console.log(`[AUDIT] ${finalPriority} | ${finalEventType}: ${finalDetails}`);

        return true;
    } catch (error) {
        console.error('Failed to write audit log:', error);
        return false;
    }
}