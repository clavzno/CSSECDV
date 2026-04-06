// this layout applies to every single (protected) page,
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// check role
import isAuthorized, { getCurrentSession } from '@/lib/rbac';

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

    const headerStore = await headers();
    const currentPath = headerStore.get('x-current-path') || '';

    if (!isAuthorized(session.role, currentPath)) {
        redirect('/dashboard');
    }

    return (
        <>
            {/* All pages will now have a sidebar */}
            <Sidebar role={session.role} />
            {children}
        </>
    );
}