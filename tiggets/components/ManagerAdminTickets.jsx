// tickets are fetched in tiggets\app\(protected)\tickets\page.tsx
"use client";

import { useMemo, useState } from "react";
import TicketList from "@/components/TicketList";
import { Filter, Search, CheckCircle2, Circle, X } from "lucide-react";

export default function ManagerAdminTickets({ role, session, tickets }) {
  const normalizedRole = role?.toLowerCase();
  const isManager = normalizedRole === "manager";
  const isAdmin = normalizedRole === "admin";
  const canShowMyTickets = isManager;

  const [showFilters, setShowFilters] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    id: "",
    userId: "",
    subject: "",
    type: "",
    status: "",
  });

  const normalizedTickets = useMemo(() => {
    return tickets.map((ticket) => ({
      ...ticket,
      id: String(ticket.ticketid ?? ticket.ticketId ?? ticket._id ?? ""),
      userId: String(ticket.createdBy ?? ""),
      assignedTo: String(ticket.assignedTo ?? "N/A"),
      lastUpdate: ticket.createdAt
        ? new Date(ticket.createdAt).toLocaleDateString()
        : "",
    }));
  }, [tickets]);

  const ticketTypes = useMemo(() => {
    return [...new Set(normalizedTickets.map((ticket) => ticket.type).filter(Boolean))];
  }, [normalizedTickets]);

  const ticketStatuses = useMemo(() => {
    return [...new Set(normalizedTickets.map((ticket) => ticket.status).filter(Boolean))];
  }, [normalizedTickets]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      id: "",
      userId: "",
      subject: "",
      type: "",
      status: "",
    });
    setSearchTerm("");
    setShowMyTickets(false);
  };

  const filteredTickets = normalizedTickets.filter((ticket) => {
    const quick = searchTerm.toLowerCase();

    const matchesSearch =
      quick === "" ||
      ticket.id.toLowerCase().includes(quick) ||
      ticket.userId.toLowerCase().includes(quick) ||
      ticket.subject.toLowerCase().includes(quick) ||
      ticket.type.toLowerCase().includes(quick) ||
      ticket.status.toLowerCase().includes(quick) ||
      ticket.assignedTo.toLowerCase().includes(quick);

    const matchesId = ticket.id.toLowerCase().includes(filters.id.toLowerCase());
    const matchesUserId = ticket.userId.toLowerCase().includes(filters.userId.toLowerCase());
    const matchesSubject = ticket.subject.toLowerCase().includes(filters.subject.toLowerCase());
    const matchesType = filters.type === "" || ticket.type === filters.type;
    const matchesStatus = filters.status === "" || ticket.status === filters.status;

    const matchesAssignment = canShowMyTickets && showMyTickets
      ? ticket.assignedTo === String(session?.userId ?? "")
      : true;

    return (
      matchesSearch &&
      matchesId &&
      matchesUserId &&
      matchesSubject &&
      matchesType &&
      matchesStatus &&
      matchesAssignment
    );
  });

  // do not move this
  if (!isManager && !isAdmin) return null;

  return (
    <div className="w-full font-text text-foreground">
      <div className="mb-8 w-full">
        <h1 className="w-full text-3xl font-bold">Tickets</h1>
      </div>

      <div className="flex min-h-150 flex-col rounded-t-md border border-zinc-300 bg-[#e2e2e2] pt-8 shadow-sm">
        <div className="mb-4 flex w-full flex-col items-center gap-6 px-6 sm:flex-row">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex w-full cursor-pointer items-center justify-center gap-3 rounded-sm border px-4 py-2 text-sm font-medium shadow-sm transition-all sm:w-35 ${showFilters
              ? "border-[#3b5949] text-[#3b5949]"
              : "border-zinc-300 bg-white text-zinc-400"
              }`}
          >
            <Filter size={18} />
            Filters
          </button>

          <div className="flex w-full max-w-112.5 overflow-hidden rounded-sm border border-zinc-300 bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#3b5949]">
            <input
              type="text"
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
            />
            <div className="flex items-center justify-center border-l border-zinc-300 px-3 text-zinc-400">
              <Search size={18} />
            </div>
          </div>

          {canShowMyTickets && (
            <button
              onClick={() => setShowMyTickets((prev) => !prev)}
              className={`flex cursor-pointer items-center justify-center gap-3 rounded-full border px-6 py-2 text-sm font-medium shadow-sm transition-all ${showMyTickets
                  ? "border-transparent bg-tiggets-lightgreen text-white"
                  : "border-zinc-300 bg-white text-zinc-400 hover:border-zinc-400"
                }`}
            >
              {showMyTickets ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              Show My Tickets
            </button>
          )}
        </div>

        {showFilters && (
          <div className="animate-in slide-in-from-top-2 mb-8 grid grid-cols-1 gap-4 px-6 fade-in sm:grid-cols-5">
            <input
              name="id"
              value={filters.id}
              onChange={handleFilterChange}
              placeholder="Filter by Ticket ID"
              className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#3b5949]"
            />

            <input
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="Filter by User ID"
              className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#3b5949]"
            />

            <input
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              placeholder="Filter by Subject"
              className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#3b5949]"
            />

            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-500 outline-none focus:border-[#3b5949]"
            >
              <option value="">All Types</option>
              {ticketTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-500 outline-none focus:border-[#3b5949]"
            >
              <option value="">All Statuses</option>
              {ticketStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="col-span-1 flex cursor-pointer items-center gap-1 text-xs text-zinc-500 hover:text-red-600 sm:col-span-5"
            >
              <X size={14} /> Clear all filters
            </button>
          </div>
        )}

        <TicketList tickets={filteredTickets} role={role} />
      </div>
    </div>
  );
}