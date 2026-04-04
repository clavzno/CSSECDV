import Link from 'next/link';
import TicketList from '@/components/TicketList';
import { Clock, BarChart2 } from 'lucide-react';

export default function ManagerDashboard({ role, tickets }) {
  if (role?.toLowerCase() !== "manager" && role?.toLowerCase() !== "admin") {
    return null;
  }

  const typeCounts = tickets.reduce((acc, ticket) => {
    const typeName = ticket.type || 'Unspecified';
    acc[typeName] = (acc[typeName] || 0) + 1;
    return acc;
  }, {});

  const typeMetrics = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const recentTickets = tickets.slice(0, 4);

  const formattedTableTickets = tickets.map(t => ({
    id: t.ticketid || t._id,
    userId: t.createdBy || 'N/A',
    subject: t.subject || 'Untitled',
    type: t.type || 'General',
    status: t.status || 'Open',
    lastUpdate: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
  }));

  return (
    <div className="w-full font-text text-foreground">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold w-full text-black">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[220px] border border-zinc-200 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-[#3b5949]" />
            Ticket Type Metrics
          </h2>
          <div className="w-full flex-1 flex flex-col gap-3 overflow-y-auto">
            {typeMetrics.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-zinc-400 italic text-sm">
                No ticket data available.
              </div>
            ) : (
              typeMetrics.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0">
                  <span className="text-sm text-zinc-600 truncate pr-4">{type}</span>
                  <span className="text-sm font-bold text-[#3b5949] bg-[#3b5949]/10 px-3 py-1 rounded-full">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[220px] border border-zinc-200 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-zinc-800 flex items-center gap-2">
            <Clock size={20} className="text-[#3b5949]" />
            Recently Opened
          </h2>
          <div className="w-full flex-1 flex flex-col gap-3 overflow-y-auto">
            {recentTickets.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-zinc-400 italic text-sm">
                 No recent tickets.
               </div>
            ) : (
              recentTickets.map(ticket => {
                const cleanId = (ticket.ticketid || ticket._id).replace('#', '');
                return (
                  <Link 
                    href={`/tickets/${cleanId}`} 
                    key={ticket._id} 
                    className="group flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0 hover:bg-zinc-50 p-1 -mx-1 px-2 rounded transition-colors"
                  >
                    <div className="flex flex-col overflow-hidden pr-4">
                      <span className="text-sm font-medium text-zinc-800 group-hover:text-[#3b5949] transition-colors truncate">
                        {ticket.subject || 'Untitled Ticket'}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {ticket.lastAccessedAt 
                          ? `Viewed ${new Date(ticket.lastAccessedAt).toLocaleDateString()}` 
                          : (ticket.createdAt ? `Created ${new Date(ticket.createdAt).toLocaleDateString()}` : 'Just now')}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-zinc-100 text-zinc-600 whitespace-nowrap">
                      {ticket.status}
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
      <div className="w-full">
        <h2 className="text-xl font-bold mb-4 text-zinc-800">Your Assigned Tickets</h2>
        <TicketList role={role} tickets={formattedTableTickets} />
      </div>
      
    </div>
  );
}