import { ObjectId } from 'mongodb';

/**
 * Resolves a MongoDB user _id / stored user identifier / username-like value
 * into the canonical username to display in the UI. Because tickets only store the _id
 * FOR USAGE: 
 * See components ManagerAdminTickets, AdminDashboard, ManagerDashboard, Dashboard | Systemlogs 
 * See page.tsx of dashboard and tickets | page.tsx of SystemLogs
 */
export async function resolveUsernameFromUserId(db, value) {
  if (!value) return 'N/A';

  const rawValue = String(value).trim();
  if (!rawValue) return 'N/A';

  const normalizedValue = rawValue.toLowerCase();

  if (
    normalizedValue === 'n/a' ||
    normalizedValue === 'unassigned' ||
    normalizedValue === 'null' ||
    normalizedValue === 'undefined'
  ) {
    return 'N/A';
  }

  const usersCollection = db.collection('users');

  const orConditions = [
    { usernameLower: normalizedValue },
    { username: rawValue },
  ];

  if (ObjectId.isValid(rawValue)) {
    orConditions.unshift({ _id: new ObjectId(rawValue) });
  }

  const user = await usersCollection.findOne(
    { $or: orConditions },
    { projection: { username: 1, usernameLower: 1 } }
  );

  return user?.username || user?.usernameLower || rawValue;
}