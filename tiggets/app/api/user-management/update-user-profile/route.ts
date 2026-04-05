import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getCurrentSession } from '@/lib/rbac';
import { createLog, LOG_EVENT_TYPES } from '@/lib/logger';

// do not remove this line
// @ts-expect-error:request as any type
export async function PATCH(request) {
  try {
    const session = await getCurrentSession();

    if (!session || String(session.role || '').toLowerCase() !== 'admin') {
      return Response.json(
        { error: 'Unauthorized.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const userId = String(body?.userId || '').trim();
    const username = String(body?.username || '').trim();
    const email = String(body?.email || '').trim();
    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();
    const role = String(body?.role || '').trim().toLowerCase();

    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return Response.json(
        { error: 'Invalid user ID.' },
        { status: 400 }
      );
    }

    if (!username || !email || !firstName || !lastName || !role) {
      return Response.json(
        { error: 'Username, email, first name, last name, and role are required.' },
        { status: 400 }
      );
    }

    const allowedRoles = new Set(['admin', 'manager', 'customer']);
    if (!allowedRoles.has(role)) {
      return Response.json(
        { error: 'Invalid role.' },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return Response.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();

    const client = await clientPromise;
    const db = client.db('TicketingSystem');
    const users = db.collection('users');

    const targetObjectId = new ObjectId(userId);

    const existingUser = await users.findOne({ _id: targetObjectId });

    if (!existingUser) {
      return Response.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    const existingUsername = await users.findOne({
      _id: { $ne: targetObjectId },
      usernameLower
    });

    if (existingUsername) {
      return Response.json(
        { error: 'Username is already in use.' },
        { status: 409 }
      );
    }

    const existingEmail = await users.findOne({
      _id: { $ne: targetObjectId },
      emailLower
    });

    if (existingEmail) {
      return Response.json(
        { error: 'Email is already in use.' },
        { status: 409 }
      );
    }

    const oldUsername = String(existingUser.username || 'N/A');
    const oldEmail = String(existingUser.email || 'N/A');
    const oldFirstName = String(existingUser.firstName || 'N/A');
    const oldLastName = String(existingUser.lastName || 'N/A');
    const oldRole = String(existingUser.role || 'customer').toLowerCase();

    const updateResult = await users.updateOne(
      { _id: targetObjectId },
      {
        $set: {
          username,
          usernameLower,
          email,
          emailLower,
          firstName,
          lastName,
          role,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return Response.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    const changedFields = [];

    if (oldUsername !== username) {
      changedFields.push(`username: ${oldUsername} --> ${username}`);
    }

    if (oldEmail !== email) {
      changedFields.push(`email: ${oldEmail} --> ${email}`);
    }

    if (oldFirstName !== firstName) {
      changedFields.push(`firstName: ${oldFirstName} --> ${firstName}`);
    }

    if (oldLastName !== lastName) {
      changedFields.push(`lastName: ${oldLastName} --> ${lastName}`);
    }

    if (oldRole !== role) {
      changedFields.push(`role: ${oldRole} --> ${role}`);
    }

    await createLog({
      userId: String(session.userId),
      actionType: LOG_EVENT_TYPES.USER_PROFILE_UPDATE,
      eventType: LOG_EVENT_TYPES.USER_PROFILE_UPDATE,
      priority: 'INFO',
      status: 'SUCCESS',
      ticketStatus: 'N/A',
      priorityLevel: 'INFO',
      details: `${String(session.userId)} updated profile for ${oldUsername}${changedFields.length > 0 ? ` | ${changedFields.join(' | ')}` : ' | no field changes detected'}`
    });

    return Response.json({
      success: true
    });
  } catch (error) {
    console.error('Update User Profile Error:', error);

    return Response.json(
      { error: 'Failed to update user profile.' },
      { status: 500 }
    );
  }
}