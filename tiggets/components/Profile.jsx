import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function Profile({ session }) {
    const client = await clientPromise;
    const db = client.db('TicketingSystem');

    let user = null;
    const rawId = String(session?.userId || "").trim();

    if (rawId) {
        // Build a flexible query just in case your DB mixes ObjectIds and String IDs
        const query = [];
        if (ObjectId.isValid(rawId) && rawId.length === 24) {
            query.push({ _id: new ObjectId(rawId) });
        }
        query.push({ userId: rawId }); 
        query.push({ username: rawId }); // Just in case the session stored the username

        user = await db.collection('users').findOne(
            { $or: query },
            {
                projection: {
                    _id: 0,
                    username: 1,
                    role: 1,
                    email: 1,
                    emailLower: 1,
                    lastLoginAttempt: 1,
                },
            }
        );
    }

    // Safely extract and format the data
    const username = user?.username || "N/A";
    const email = user?.email || user?.emailLower || "N/A";
    const role = user?.role 
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1) // Capitalize the role
        : "N/A";
        
    // Safely parse the date regardless of how MongoDB saved it
    let lastLoginAttempt = "N/A";
    if (user?.lastLoginAttempt?.date) {
        lastLoginAttempt = new Date(user.lastLoginAttempt.date).toLocaleString();
    } else if (user?.lastLoginAttempt && !isNaN(new Date(user.lastLoginAttempt))) {
        lastLoginAttempt = new Date(user.lastLoginAttempt).toLocaleString();
    }

    return (
        <div>
            {/** Header */}
            <div className="mb-8 w-full font-text text-foreground">
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="mt-2 text-zinc-500">View and manage your account details.</p>
            </div>

            {/** Profile Content */}
            <div className="max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="space-y-6">
                    {/** Username */}
                    <div>
                        <p className="text-sm font-medium text-zinc-500">Username</p>
                        <p className="mt-1 text-base font-medium text-zinc-900">{username}</p>
                    </div>

                    {/** Role */}
                    <div>
                        <p className="text-sm font-medium text-zinc-500">Role</p>
                        <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {role}
                        </span>
                    </div>

                    {/** Email */}
                    <div>
                        <p className="text-sm font-medium text-zinc-500">Email Address</p>
                        <p className="mt-1 text-base text-zinc-900">{email}</p>
                    </div>

                    {/** Last Login Attempt Date */}
                    <div>
                        <p className="text-sm font-medium text-zinc-500">Last Login Attempt</p>
                        <p className="mt-1 text-base text-zinc-900">{lastLoginAttempt}</p>
                    </div>

                    {/** Change Password Action */}
                    <div className="pt-4 border-t border-zinc-100">
                        <p className="text-sm font-medium text-zinc-500 mb-2">Security</p>
                        <a
                            href="/settings"
                            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                        >
                            Change Password
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}