// this layout applies to every single (protected) page,
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

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
        redirect('/');
    }

    return (
        <>
            {/* All pages will now have a sidebar */}
            <Sidebar role={session.role} />
            {children}
        </>
    );
}