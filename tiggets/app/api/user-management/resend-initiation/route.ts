import crypto from 'crypto';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog, LOG_EVENT_TYPES } from '@/lib/logger';
import { ObjectId } from 'mongodb';

// do not remove this line
// @ts-expect-error:inviteToken as any type
function buildInviteUrl(inviteToken) {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        'http://localhost:3000';

    return `${appUrl}/CreateAccount?invite=${encodeURIComponent(inviteToken)}`;
}

// do not remove this line
// @ts-expect-error:to, username, role, inviteUrl, firstName, lastName as any type
function buildMailToUrl({ to, username, role, inviteUrl, firstName, lastName }) {
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const greeting = displayName || username;

    const subject = `Tiggets Account Setup Invitation`;
    const bodyLines = [
        `Hello ${greeting},`,
        ``,
        `An administrator has initiated a ${role} account for you in Tiggets.`,
        ``,
        `Defined account details:`,
        `Username: ${username}`,
        `Email: ${to}`,
        `Role: ${role}`,
        ...(firstName ? [`First Name: ${firstName}`] : []),
        ...(lastName ? [`Last Name: ${lastName}`] : []),
        ``,
        `Complete your account here:`,
        `${inviteUrl}`,
        ``,
        `The predefined fields on the setup page are locked.`,
        `Please complete the remaining required fields to activate your account.`,
    ];

    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
}

// do not remove this line
// @ts-expect-error:request
export async function POST(request) {
    try {
        const session = await getCurrentSession();

        if (!session || String(session.role || '').toLowerCase() !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const userId = String(body?.userId || '').trim();

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing pending user id.' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        const usersCollection = db.collection('users');

        const pendingUser = await usersCollection.findOne({
            _id: new ObjectId(userId),
            accountStatus: 'invited',
        });

        if (!pendingUser) {
            await createLog({
                userId: String(session.userId),
                actionType: LOG_EVENT_TYPES.ACCOUNT_INITIATION,
                eventType: LOG_EVENT_TYPES.ACCOUNT_INITIATION,
                details: `Failed resend for pending invited user id ${userId}: user not found.`,
                ticketStatus: 'N/A',
                status: 'FAILED',
                priorityLevel: 'LOW',
                priority: 'INFO',
            });

            return NextResponse.json(
                { error: 'Pending invited user not found.' },
                { status: 404 }
            );
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteTokenHash = crypto
            .createHash('sha256')
            .update(inviteToken)
            .digest('hex');

        const now = new Date();
        const inviteExpiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);

        await usersCollection.updateOne(
            { _id: pendingUser._id },
            {
                $set: {
                    inviteTokenHash,
                    inviteExpiresAt,
                    invitedAt: now,
                    updatedAt: now,
                },
            }
        );

        const inviteUrl = buildInviteUrl(inviteToken);
        const mailToUrl = buildMailToUrl({
            to: String(pendingUser.email || ''),
            username: String(pendingUser.username || ''),
            role: String(pendingUser.role || 'customer'),
            inviteUrl,
            firstName: String(pendingUser.firstName || ''),
            lastName: String(pendingUser.lastName || ''),
        });

        await createLog({
            userId: String(session.userId),
            actionType: LOG_EVENT_TYPES.ACCOUNT_INITIATION,
            eventType: LOG_EVENT_TYPES.ACCOUNT_INITIATION,
            details: `Resent account initiation email for ${String(pendingUser.username || '')} (${String(pendingUser.email || '')}) with role ${String(pendingUser.role || '')}.`,
            ticketStatus: 'N/A',
            status: 'N/A',
            priorityLevel: 'LOW',
            priority: 'INFO',
        });

        return NextResponse.json({
            success: true,
            inviteUrl,
            mailToUrl,
        });
    } catch (error) {
        console.error('resend-initiation POST error:', error);

        return NextResponse.json(
            { error: 'Failed to resend initiation email.' },
            { status: 500 }
        );
    }
}