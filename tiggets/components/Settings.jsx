import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
                    username: 1,
                    role: 1,
                    emailLower: 1,
                },
            }
        );
    }

    const username = user?.username ?? "N/A";
    const email = user?.emailLower ?? "N/A";
    const role = user?.role ?? "N/A";

    return (
        <div>
            {/** Header */}
            <div className="w-full font-text text-foreground">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>
            </div>

            {/** Profile Content */}
            <div className="max-w-3xl rounded-xl border border-border-gray bg-background p-6 shadow-sm">
                <div className="space-y-6">


                    {/** actual content should go here, just remove the divs that are inside this one for settings */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Username: {username}</p>
                        <p className="mt-1 text-base text-foreground">Please contact an admin to change your username.</p>
                    </div>

                    {/** Role */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Role: {role}</p>
                        <p className="mt-1 text-base text-foreground">Please contact an admin to change your role.</p>
                    </div>

                    {/** Email */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Email: {email}</p>
                        <p className="mt-1 text-base text-foreground">Please contact an admin to change your email.</p>
                    </div>

                    {/** Change Password Link */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Password</p>
                        <a
                            href="/settings"
                            className="mt-1 inline-block text-sm font-medium text-blue-600 hover:underline"
                        >
                            Change Password
                        </a>
                    </div>


                </div>
            </div>
        </div>
    );
}