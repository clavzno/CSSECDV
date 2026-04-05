"use client";
import { useState } from 'react';
import { Search, Filter, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TicketList from '@/components/TicketList';

export default function ManageUserTickets({
  targetUser,
  createdTickets,
  assignedTickets,
  role
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: '', status: '' });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '' });
    setSearchTerm('');
  };

  const filterTickets = (tickets) =>
    tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.includes(searchTerm);

      const matchesType =
        filters.type === '' || ticket.type === filters.type;

      const matchesStatus =
        filters.status === '' || ticket.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });

  const filteredCreatedTickets = filterTickets(createdTickets);
  const filteredAssignedTickets = filterTickets(assignedTickets);

  const isManager = String(targetUser?.role || '').toLowerCase() === 'manager';

  return (
    <div className="w-full font-text text-foreground">
      <Link
        href="/user-management"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#3b5949] transition-colors mb-6 font-medium"
      >
        <ArrowLeft size={16} /> Back to User List
      </Link>

      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold w-full text-black">
          {targetUser?.name ? `${targetUser.name}'s Tickets` : 'User Tickets'}
        </h1>
      </div>

      <div className="bg-[#e2e2e2] pt-8 flex flex-col min-h-150 rounded-t-md shadow-sm border border-zinc-300">
        <div className="flex flex-col sm:flex-row items-center gap-6 px-6 mb-4 w-full">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-3 bg-white border px-4 py-2 rounded-sm text-sm font-medium transition-all shadow-sm cursor-pointer w-full sm:w-35 ${showFilters ? 'border-[#3b5949] text-[#3b5949]' : 'border-zinc-300 text-zinc-400'}`}
          >
            <Filter size={18} /> Filters
          </button>

          <div className="flex bg-white border border-zinc-300 rounded-sm w-full max-w-112.5 shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-[#3b5949]">
            <input
              type="text"
              placeholder="Search in tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 text-sm outline-none text-zinc-700 placeholder:text-zinc-400"
            />
            <div className="px-3 border-l border-zinc-300 text-zinc-400 flex items-center justify-center bg-zinc-50">
              <Search size={18} />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="Transferees: Credit transfer and accreditations">Transferees</option>
              <option value="Course withdrawals or dropping procedures">Course Withdrawals</option>
              <option value="Graduation requirements and clearance">Graduation</option>
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
            </select>

            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
            >
              <X size={14} /> Clear all filters
            </button>
          </div>
        )}

        <div className="px-6 pb-6 w-full mt-2">
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-black mb-4">
              Created Tickets
            </h2>
            <TicketList tickets={filteredCreatedTickets} role={role} />
          </div>

          {isManager && (
            <div>
              <h2 className="text-xl font-semibold text-black mb-4">
                Assigned Tickets
              </h2>
              <TicketList tickets={filteredAssignedTickets} role={role} />
            </div>
          )}

          <div className="flex-1 flex items-center justify-center text-zinc-500 font-medium py-12" />
        </div>
      </div>
    </div>
  );
}