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
import { usePathname } from 'next/navigation';

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
    const router = useRouter();
    const pathname = usePathname();

    // if there's no role that means there's no session, return NO links
    if (!role) {
        return null;
    }

    // dynamic sidebar based on role
    const links = sidebarLinks[role] ?? [];

    // Secure logout handler
    async function handleLogout(event) {
        event.preventDefault();
        
        try {
            // 1. Hit the API route we built to destroy the HttpOnly session cookie
            await fetch('/api/auth/logout', { method: 'POST' });

            // 2. Clear the user data out of the browser's local storage
            localStorage.removeItem('user');

            // 3. Force a hard redirect to the login page. 
            // Using window.location.href instead of router.push('/') is a security 
            // best practice here because it completely wipes the React state memory.
            window.location.href = '/';
            
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    }

    return (
        <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col bg-linear-to-b from-[#173329] to-[#0f261d] px-4 py-7 text-background shadow-xl">
            <div className="mb-8 flex justify-center">
                <Image
                    src={Tiggets}
                    alt="Tiggets logo"
                    width={170}
                    height={60}
                    className='h-auto py-2'
                    priority
                />
            </div>

            <nav className="flex flex-col gap-1.5">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                        <Link key={link.href} href={link.href}>
                            <div className={`flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-white transition hover:cursor-pointer ${
                                isActive ? 'bg-tiggets-lightgreen' : 'hover:bg-tiggets-lightgreen/70'
                            }`}>
                                <Icon className="h-5 w-5" />
                                <span className="font-text text-base font-medium">
                                    {link.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t border-white/15 pt-2">
                <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-white transition hover:cursor-pointer hover:bg-tiggets-lightgreen/70"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-text text-base font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}