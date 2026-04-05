import crypto from 'crypto';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = String(searchParams.get('token') || '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing invite token.' }, { status: 400 });
    }

    const inviteTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');

    const invitedUser = await users.findOne({
      inviteTokenHash,
      accountStatus: 'invited',
    });

    if (!invitedUser) {
      return NextResponse.json({ error: 'Invalid invite token.' }, { status: 404 });
    }

    const expiresAt = invitedUser.inviteExpiresAt
      ? new Date(invitedUser.inviteExpiresAt)
      : null;

    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite token has expired.' }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      invite: {
        username: String(invitedUser.username || ''),
        email: String(invitedUser.email || ''),
        role: String(invitedUser.role || 'customer'),
        firstName: String(invitedUser.firstName || ''),
        lastName: String(invitedUser.lastName || ''),
        requiresName: ['admin', 'manager'].includes(
          String(invitedUser.role || '').toLowerCase()
        ),
      },
    });
  } catch (error) {
    console.error('invite GET error:', error);
    return NextResponse.json(
      { error: 'Failed to validate invite token.' },
      { status: 500 }
    );
  }
}