// this layout applies to every single (protected) page,

import type { ReactNode } from 'react'; 

// content
import Sidebar from '@/components/Sidebar';

// children = actual content from the page.tsx
type ProtectedLayoutProps = {
    children: ReactNode;
};

// TODO: change this to { user } and access role={user.role}
export default async function ProtectedLayout({
    children,
}: ProtectedLayoutProps) {
    const user = {
        role: 'admin',
    };

    return (
        <>
            {/* All pages will now have a sidebar */}
            <Sidebar role={user.role} />
            <main className="ml-64 min-h-screen bg-background p-6">
                {children}
            </main>
        </>
    );
}