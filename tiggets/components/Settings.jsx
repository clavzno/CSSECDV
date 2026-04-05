import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import AdminProfileEditor from '@/components/AdminProfileEditor';
import CustomerProfileEditor from '@/components/CustomerProfileEditor';

export default async function Settings({ session }) {
    const client = await clientPromise;
    const db = client.db('TicketingSystem');

    let user = null;

    if (session?.userId && ObjectId.isValid(String(session.userId))) {
        user = await db.collection('users').findOne(
            { _id: new ObjectId(String(session.userId)) },
            {
                projection: {
                    _id: 0,
                    firstName: 1,
                    lastName: 1,
                    username: 1,
                    role: 1,
                    email: 1,
                    emailLower: 1,
                },
            }
        );
    }

    const firstName = user?.firstName ?? '';
    const lastName = user?.lastName ?? '';
    const username = user?.username ?? 'N/A';
    const email = user?.email ?? user?.emailLower ?? 'N/A';

    const normalizedRole = String(user?.role ?? '').toLowerCase();
    const role = user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : 'N/A';

    const isAdmin = normalizedRole === 'admin';
    const isManager = normalizedRole === 'manager';
    const isCustomer = normalizedRole === 'customer';

    return (
        <div>
            <div className="mb-8 w-full font-text text-foreground">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="mt-2 text-zinc-500">Manage your account preferences and settings.</p>
            </div>

            <div className="max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="space-y-6">
                    {isAdmin ? (
                        <AdminProfileEditor
                            firstName={firstName}
                            lastName={lastName}
                            username={username}
                            email={email}
                            role={role}
                        />
                    ) : isCustomer || isManager ? (
                        <CustomerProfileEditor
                            firstName={firstName}
                            lastName={lastName}
                            username={username}
                            email={email}
                            role={role}
                        />
                    ) : (
                        <>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">First Name</p>
                                <p className="mt-1 text-base text-zinc-900">{firstName || 'N/A'}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-zinc-500">Last Name</p>
                                <p className="mt-1 text-base text-zinc-900">{lastName || 'N/A'}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-zinc-500">Username</p>
                                <p className="mt-1 text-base font-medium text-zinc-900">{username}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-zinc-500">Role</p>
                                <div className="mt-1 mb-2">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {role}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-zinc-500">Email Address</p>
                                <p className="mt-1 text-base text-zinc-900">{email}</p>
                            </div>
                        </>
                    )}

                    <div className="border-t border-zinc-100 pt-4">
                        <p className="mb-2 text-sm font-medium text-zinc-500">Security</p>
                        <a
                            href="/settings/change-password"
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