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
    priority        
}) {
    try {
        const finalEventType = eventType || actionType;
        const finalStatus = status || ticketStatus || 'NA';
        const rawPriority = priority || priorityLevel || 'INFO';
        const finalPriority = rawPriority.toUpperCase(); 

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        
        // Ensure the ID is a clean string with no hidden spaces
        const stringUserId = userId ? String(userId).trim() : '';
        let displayUser = stringUserId || 'System/Unauthenticated';
        
        if (stringUserId.length === 24) {
            try {
                // --- DEBUG: Let's see if the collection is correct ---
                const userDoc = await db.collection('users').findOne({ _id: new ObjectId(stringUserId) });
                
                if (userDoc) {
                    if (userDoc.username) {
                        displayUser = userDoc.username; 
                    } else {
                        console.log(`[LOGGER DEBUG] Found user document, but it has no 'username' field.`);
                    }
                } else {
                    console.log(`[LOGGER DEBUG] Query ran successfully, but no user found in 'users' collection with ID: ${stringUserId}. Is the collection named 'Users' with a capital U?`);
                }
            } catch (err) {
                // --- DEBUG: Catching ObjectId or Connection crashes ---
                console.error(`[LOGGER CRASH] The database lookup crashed:`, err.message);
            }
        } else {
            console.log(`[LOGGER DEBUG] ID length is not 24. Length: ${stringUserId.length}, Value: "${stringUserId}"`);
        }

        // Replace ALL instances of the raw ID in the details string
        const finalDetails = details ? details.replace(new RegExp(stringUserId, 'g'), displayUser) : '';

        const logEntry = {
            logId: crypto.randomUUID(),
            timestamp: new Date(),
            userId: displayUser, 
            eventType: finalEventType, 
            status: finalStatus,
            details: finalDetails, 
            priority: finalPriority 
        };

        await db.collection('logs').insertOne(logEntry);
        console.log(`[AUDIT] ${finalPriority} | ${finalEventType}: ${finalDetails}`);

        return true;
    } catch (error) {
        console.error('Failed to write audit log:', error);
        return false;
    }
}