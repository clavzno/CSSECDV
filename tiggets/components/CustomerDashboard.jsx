import { Plus } from 'lucide-react';
import Link from 'next/link';

// customer dummy data for now, will be fetched from backend later

const customerTickets = [
    {
        id: '#0142069',
        title: "HELP I CAN'T DO THIS ANYMORE",
        status: 'Processing',
        updatedAt: 'August 6, 2020',
    },
    {
        id: '#0142068',
        title: "It's over...",
        status: 'Open',
        updatedAt: 'August 7, 2020',
    },
    {
        id: '#0142070',
        title: 'Excused Absence Forms.',
        status: 'Pending',
        updatedAt: 'August 5, 2020',
    },
    {
        id: '#0142067',
        title: 'Pls help. I want to know where I can...',
        status: 'Resolved',
        updatedAt: 'August 8, 2020',
    },
];

const statusClasses = {
    Processing: 'bg-cyan-200 text-cyan-900 border-cyan-300',
    Open: 'bg-rose-300 text-rose-900 border-rose-400',
    Pending: 'bg-amber-200 text-amber-900 border-amber-400',
    Resolved: 'bg-green-300 text-green-900 border-green-400',
};

function TicketCard({ ticket }) {
    const ticketPath = `/tickets/${encodeURIComponent(ticket.id.replace('#', ''))}`;

    return (
        <Link
            href={ticketPath}
            aria-label={`View ticket ${ticket.id}`}
            className="relative flex h-52 min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:ring-1 hover:ring-blue-500/60"
        >
            <span
                className={`absolute right-4 top-3 rounded-full border px-4 py-1 text-xs font-medium ${
                    statusClasses[ticket.status] ?? 'bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}
            >
                {ticket.status}
            </span>

            <h2 className="mt-7 max-w-[90%] text-xl leading-tight font-medium text-zinc-800 sm:text-2xl">
                {ticket.title}
            </h2>

            <div className="mt-auto flex items-end justify-between gap-4 pt-6 text-zinc-800">
                <div>
                    <p className="text-[1.25rem] font-bold leading-none sm:text-[1.45rem]">Ticket ID</p>
                    <p className="text-lg leading-none sm:text-xl">{ticket.id}</p>
                </div>

                <div className="text-right">
                    <p className="text-sm font-bold leading-tight sm:text-base">Last Updated</p>
                    <p className="text-sm leading-tight sm:text-base">{ticket.updatedAt}</p>
                </div>
            </div>
        </Link>
    );
}

export default function CustomerDashboard() {
    return (
        <section className="relative min-h-[calc(100vh-3rem)]">
            <h1 className="mb-8 text-3xl font-bold text-zinc-800">My Tickets</h1>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {customerTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                ))}
            </div>

            <Link
                href="/tickets"
                aria-label="Create a new ticket"
                className="fixed bottom-6 right-6 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-tiggets-lightgreen text-white shadow-xl transition hover:scale-105 hover:bg-[#2b4a3c]"
            >
                <Plus className="h-8 w-8" strokeWidth={2.4} />
            </Link>
        </section>
    );
}