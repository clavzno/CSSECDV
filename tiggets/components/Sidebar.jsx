"use client"
// content will change (dynamic) based on role
import Link from 'next/link';

// icons
import { House, Ticket, UsersRound, MonitorCog, Settings, UserRound, LogOut } from 'lucide-react';

// logo
import Image from 'next/image';
import Tiggets from '@/public/Tiggets.png';

// redirects (for logout)
import { useRouter } from 'next/navigation';

const sidebarLinks = {
    admin: [
        { label: 'Dashboard', href: '/dashboard', icon: House },
        { label: 'Tickets', href: '/tickets', icon: Ticket },
        { label: 'User Management', href: '/user-management', icon: UsersRound },
        { label: 'System Logs', href: '/system-logs', icon: MonitorCog },
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'Profile', href: '/profile', icon: UserRound },
    ],
    manager: [
        { label: 'Dashboard', href: '/dashboard', icon: House },
        { label: 'Tickets', href: '/tickets', icon: Ticket },
        { label: 'User Management', href: '/user-management', icon: UsersRound },
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'Profile', href: '/profile', icon: UserRound },
    ],
    customer: [
        { label: 'Dashboard', href: '/dashboard', icon: House }, // defaults to showing all tickets
        { label: 'Settings', href: '/settings', icon: Settings },
        { label: 'Profile', href: '/profile', icon: UserRound },
    ],
};

export default function Sidebar({ role }) {
    // dynamic sidebar based on role
    const links = sidebarLinks[role] ?? [];
    const router = useRouter();

    // TODO: handle logout properly
    function handleLogout(event) {
        event.preventDefault();
        // something here
        router.push('/');
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-tiggets-green px-6 py-8 text-background shadow-lg flex flex-col">
            <div className="mb-0.5 flex justify-center">
                <Image
                    src={Tiggets}
                    alt="Tiggets logo"
                    width={160}
                    height={60}
                    className='h-auto py-3'
                    priority
                />
            </div>

            <nav className="flex flex-col gap-1">
                {links.map((link) => {
                    const Icon = link.icon;

                    return (
                        <Link key={link.href} href={link.href}>
                            <div className="flex w-full items-center gap-4 rounded-md bg-tiggets-green px-4 py-3 text-white transition hover:bg-tiggets-lightgreen hover:cursor-pointer">
                                <Icon className="h-8 w-8" />
                                <span className="font-text text-sm font-medium">
                                    {link.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto pt-4">
                <button
                    type="button"
                    className="flex w-full items-center gap-4 rounded-md px-4 py-3 text-white transition hover:bg-tiggets-lightgreen hover:cursor-pointer"
                    onClick={handleLogout}
                >
                    <LogOut className="h-8 w-8" />
                    <span className="font-text text-sm font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}