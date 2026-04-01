// this layout applies to every single (protected) page,
import type { ReactNode } from 'react';

// check role
import { getCurrentSession } from '@/lib/rbac';

// content
import Sidebar from '@/components/Sidebar';

// children = actual content from the page.tsx in dashboard,profile,etc.
type ProtectedLayoutProps = {
    children: ReactNode;
};

export default async function ProtectedLayout({
        children,
    }: ProtectedLayoutProps) {

    const session = await getCurrentSession();

    if (!session) {
        return <div>Unauthorized</div>;
    }

    return (
        <>
            {/* All pages will now have a sidebar */}
            <Sidebar role={session.role} />
            <main className="ml-64 min-h-screen bg-background p-6">
                {children}
            </main>
        </>
    );
}