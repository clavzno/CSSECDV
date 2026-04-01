export default function Profile({ session }) {
    const username = session?.user?.name ?? "N/A";
    const email = session?.user?.email ?? "N/A";
    const role = session?.user?.role ?? "N/A";
    const lastLoginAttempt = session?.user?.lastLoginAttempt ?? "N/A";

    return (
        <div>
            {/** Header */}
            <div className="w-full font-text text-foreground">
                <h1 className="text-3xl font-bold mb-8">Profile (WIP - update session jwt)</h1>
            </div>

            {/** Profile Content */}
            <div className="max-w-3xl rounded-xl border border-border-gray bg-background p-6 shadow-sm">
                <div className="space-y-6">
                    {/** Username */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Username</p>
                        <p className="mt-1 text-base text-foreground">{username}</p>
                    </div>

                    {/** Role */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                        <p className="mt-1 text-base text-foreground">{role}</p>
                    </div>

                    {/** Email */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="mt-1 text-base text-foreground">{email}</p>
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

                    {/** Last Login Attempt Date */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Last Login Attempt</p>
                        <p className="mt-1 text-base text-foreground">{lastLoginAttempt}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}