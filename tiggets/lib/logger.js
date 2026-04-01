import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

// 1. Define your strict priority levels
const VALID_PRIORITIES = ['info', 'warning', 'error', 'critical'];

/**
 * Universal Logging Utility for the Ticketing System
 * @param {Object} params
 * @param {string} params.userId - The ID of the user performing the action
 * @param {string} params.actionType - E.g., 'Ticket Creation', 'Login Failure'
 * @param {string} params.details - Specific details about the event
 * @param {string} [params.ticketStatus] - Optional: Status of the ticket if applicable
 * @param {string} [params.priorityLevel] - Optional: Must be info, warning, error, or critical
 */
export async function createLog({ 
    userId, 
    actionType, 
    details, 
    ticketStatus = 'N/A', 
    priorityLevel = 'info' // Updated default
}) {
    try {
        // 2. Validate the priority level to ensure data integrity
        const safePriority = VALID_PRIORITIES.includes(priorityLevel.toLowerCase()) 
            ? priorityLevel.toLowerCase() 
            : 'info';

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        
        const logEntry = {
            logId: crypto.randomUUID(),
            timestamp: new Date(),
            userId: userId || 'System/Unauthenticated', 
            actionType,
            ticketStatus,
            details,
            priorityLevel: safePriority // Uses the validated string
        };

        await db.collection('logs').insertOne(logEntry);
        
        // Log to the server console with the priority tag for easy local debugging
        console.log(`[AUDIT LOG - ${safePriority.toUpperCase()}] ${actionType}: ${details}`);

        return true;
    } catch (error) {
        console.error('Failed to write audit log to database:', error);
        return false;
    }
}