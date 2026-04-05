import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog, LOG_EVENT_TYPES } from '@/lib/logger';

// do not remove this line
// @ts-expect-error:value as any type
function normalizeString(value) {
    return String(value ?? '').trim();
}


// do not remove this line
// @ts-expect-error:email as any type
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// do not remove this line
// @ts-expect-error:request as any type
export async function POST(request) {
    try {
        const session = await getCurrentSession();

        if (!session?.userId || !ObjectId.isValid(String(session.userId))) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        const sessionRole = String(session.role ?? '').toLowerCase();

        if (sessionRole !== 'admin') {
            await createLog({
                userId: String(session.userId),
                actionType: LOG_EVENT_TYPES.ACCESS_DENIED,
                eventType: LOG_EVENT_TYPES.ACCESS_DENIED,
                details: 'Non-admin attempted to access admin-only profile update route.',
                ticketStatus: 'N/A',
                status: 'FAILED',
                priorityLevel: 'WARNING',
                priority: 'WARNING',
            });

            return NextResponse.redirect(new URL('/settings', request.url));
        }

        const formData = await request.formData();

        const firstName = normalizeString(formData.get('firstName'));
        const lastName = normalizeString(formData.get('lastName'));
        const username = normalizeString(formData.get('username'));
        const email = normalizeString(formData.get('email'));

        if (!username || !email || !isValidEmail(email)) {
            return NextResponse.redirect(new URL('/settings', request.url));
        }

        const usernameLower = username.toLowerCase();
        const emailLower = email.toLowerCase();

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        const userObjectId = new ObjectId(String(session.userId));

        const currentUser = await db.collection('users').findOne(
            { _id: userObjectId },
            {
                projection: {
                    firstName: 1,
                    lastName: 1,
                    username: 1,
                    email: 1,
                    emailLower: 1,
                    role: 1,
                },
            }
        );

        if (!currentUser || String(currentUser.role ?? '').toLowerCase() !== 'admin') {
            await createLog({
                userId: String(session.userId),
                actionType: LOG_EVENT_TYPES.ACCESS_DENIED,
                eventType: LOG_EVENT_TYPES.ACCESS_DENIED,
                details: 'Profile update blocked because account is not an admin.',
                ticketStatus: 'N/A',
                status: 'FAILED',
                priorityLevel: 'WARNING',
                priority: 'WARNING',
            });

            return NextResponse.redirect(new URL('/settings', request.url));
        }

        const usernameTaken = await db.collection('users').findOne({
            _id: { $ne: userObjectId },
            usernameLower,
        });

        if (usernameTaken) {
            return NextResponse.redirect(new URL('/settings', request.url));
        }

        const emailTaken = await db.collection('users').findOne({
            _id: { $ne: userObjectId },
            emailLower,
        });

        if (emailTaken) {
            return NextResponse.redirect(new URL('/settings', request.url));
        }

        await db.collection('users').updateOne(
            { _id: userObjectId },
            {
                $set: {
                    firstName,
                    lastName,
                    username,
                    usernameLower,
                    email,
                    emailLower,
                    updatedAt: new Date(),
                },
            }
        );

        const changedFields = [];

        if ((currentUser.firstName ?? '') !== firstName) {
            changedFields.push(`firstName: "${currentUser.firstName ?? ''}" -> "${firstName}"`);
        }

        if ((currentUser.lastName ?? '') !== lastName) {
            changedFields.push(`lastName: "${currentUser.lastName ?? ''}" -> "${lastName}"`);
        }

        if ((currentUser.username ?? '') !== username) {
            changedFields.push(`username: "${currentUser.username ?? ''}" -> "${username}"`);
        }

        const previousEmail = currentUser.email ?? currentUser.emailLower ?? '';
        if (previousEmail !== email) {
            changedFields.push(`email: "${previousEmail}" -> "${email}"`);
        }

        await createLog({
            userId: String(session.userId),
            actionType: LOG_EVENT_TYPES.USER_PROFILE_UPDATE,
            eventType: LOG_EVENT_TYPES.USER_PROFILE_UPDATE,
            details:
                changedFields.length > 0
                    ? `Updated own profile. Changes: ${changedFields.join(', ')}`
                    : 'Submitted profile update with no field changes.',
            ticketStatus: 'N/A',
            status: 'SUCCESS',
            priorityLevel: 'INFO',
            priority: 'INFO',
        });

        return NextResponse.redirect(new URL('/settings', request.url));
    } catch (error) {
        console.error('Settings profile update error:', error);

        return NextResponse.redirect(new URL('/settings', request.url));
    }
}