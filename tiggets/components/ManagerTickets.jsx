"use client";
import { useState } from 'react';
import TicketList from '@/components/TicketList';
import { Filter, Search, CheckCircle2, Circle, X } from 'lucide-react';

const mockTickets = [
  { id: '#0142067', userId: '#0142067', assignedTo: '1', subject: 'Login issues on mobile', type: 'Bug Report', status: 'Resolved', lastUpdate: 'August 8, 2020' },
  { id: '#0142068', userId: '#0142068', assignedTo: '2', subject: 'Request for password reset', type: 'Account Issue', status: 'Open', lastUpdate: 'August 7, 2020' },
  { id: '#0142069', userId: '#0142069', assignedTo: '1', subject: 'Slow database queries', type: 'Service Request', status: 'Processing', lastUpdate: 'August 6, 2020' },
  { id: '#0142070', userId: '#0142070', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
  { id: '#0142071', userId: '#0142071', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
];

export default function ManagerTickets({ role, session }) {
  const [showFilters, setShowFilters] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [filters, setFilters] = useState({
    id: '',
    subject: '',
    type: '',
    status: ''
  });

  if (role?.toLowerCase() !== 'manager') return null;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ id: '', subject: '', type: '', status: '' });
    setSearchTerm('');
  };

  // for testing, maps 1 to real ID
  const testTickets = mockTickets.map(ticket =>
    ticket.assignedTo === '1' ? { ...ticket, assignedTo: session?.userId } : ticket
  );

  const filteredTickets = testTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.id.includes(searchTerm);
    const matchesId = ticket.id.toLowerCase().includes(filters.id.toLowerCase());
    const matchesSubject = ticket.subject.toLowerCase().includes(filters.subject.toLowerCase());
    const matchesType = filters.type === '' || ticket.type === filters.type;
    const matchesStatus = filters.status === '' || ticket.status === filters.status;

    const matchesAssignment = showMyTickets ? ticket.assignedTo === session?.userId : true;

    return matchesSearch && matchesId && matchesSubject && matchesType && matchesStatus && matchesAssignment;
  });

  return (
    <div className="w-full font-text text-foreground">
      <div className="w-full mb-8">
        {/* Header */}
        <h1 className="text-3xl font-bold w-full">Tickets</h1>
      </div>

      <div className="bg-[#e2e2e2] pt-8 flex flex-col min-h-150 rounded-t-md shadow-sm border border-zinc-300">

        <div className="flex flex-col sm:flex-row items-center gap-6 px-6 mb-4 w-full">

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-3 bg-white border px-4 py-2 rounded-sm text-sm font-medium transition-all shadow-sm cursor-pointer w-full sm:w-35 ${showFilters ? 'border-[#3b5949] text-[#3b5949]' : 'border-zinc-300 text-zinc-400'}`}
          >
            <Filter size={18} />
            Filters
          </button>

          <div className="flex bg-white border border-zinc-300 rounded-sm w-full max-w-112.5 shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-[#3b5949]">
            <input
              type="text"
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 text-sm outline-none text-zinc-700 placeholder:text-zinc-400"
            />
            <div className="px-3 border-l border-zinc-300 text-zinc-400 flex items-center justify-center">
              <Search size={18} />
            </div>
          </div>

          <button
            onClick={() => setShowMyTickets(!showMyTickets)}
            className={`flex items-center justify-center gap-3 px-6 py-2 rounded-full text-sm font-medium transition-all shadow-sm cursor-pointer border ${showMyTickets ? 'bg-tiggets-lightgreen text-white border-transparent' : 'bg-white text-zinc-400 border-zinc-300 hover:border-zinc-400'}`}
          >
            {showMyTickets ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            Show My Tickets
          </button>
        </div>

        {showFilters && (
          <div className="px-6 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            <input name="id" value={filters.id} onChange={handleFilterChange} placeholder="Filter by ID#" className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949]" />
            <input name="subject" value={filters.subject} onChange={handleFilterChange} placeholder="Filter by Subject" className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949]" />

            <select name="type" value={filters.type} onChange={handleFilterChange} className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500">
              <option value="">All Types</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Account Issue">Account Issue</option>
              <option value="Service Request">Service Request</option>
            </select>

            <select name="status" value={filters.status} onChange={handleFilterChange} className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500">
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
            </select>

            <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-red-600 flex items-center gap-1 cursor-pointer">
              <X size={14} /> Clear all filters
            </button>
          </div>
        )}

        <TicketList tickets={filteredTickets} role={role} />
      </div>
    </div>
  );
}