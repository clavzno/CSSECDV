"use client";
import { Filter, Search, X } from 'lucide-react';

export default function SystemLogsFilter({
    showFilters,
    setShowFilters,
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    clearFilters,
}) {
    return (
        <>
            <div className="flex flex-col sm:flex-row items-center gap-6 px-6 py-6 w-full border-b border-border-gray bg-[#e2e2e2]">
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center gap-3 bg-white border px-4 py-2 rounded-sm text-sm font-medium transition-all shadow-sm cursor-pointer w-full sm:w-35 ${showFilters ? 'border-[#3b5949] text-[#3b5949]' : 'border-zinc-300 text-zinc-400'
                        }`}
                >
                    <Filter size={18} />
                    Filters
                </button>

                <div className="flex bg-white border border-zinc-300 rounded-sm w-full max-w-112.5 shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-[#3b5949]">
                    <input
                        type="text"
                        placeholder="Search details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 text-sm outline-none text-zinc-700 placeholder:text-zinc-400"
                    />
                    <div className="px-3 border-l border-zinc-300 text-zinc-400 flex items-center justify-center hover:cursor-pointer hover:text-zinc-600">
                        <Search size={18} />
                    </div>
                </div>
            </div>

            {showFilters && (
                <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-5 gap-4 bg-[#e2e2e2] animate-in fade-in slide-in-from-top-2 border-b border-border-gray">
                    <input
                        name="username"
                        value={filters.username}
                        onChange={handleFilterChange}
                        placeholder="Filter by Username"
                        className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949]"
                    />

                    <select
                        name="actionType"
                        value={filters.actionType}
                        onChange={handleFilterChange}
                        className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500"
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN_FAIL">LOGIN_FAIL</option>
                        <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                        <option value="LOGOUT">LOGOUT</option>
                        <option value="TIMED_LOGOUT">TIMED_LOGOUT</option>
                        <option value="USER_CREATION_FAIL">USER_CREATION_FAIL</option>
                        <option value="USER_CREATION_SUCCESS">USER_CREATION_SUCCESS</option>
                        <option value="TICKET_CREATED">TICKET_CREATED</option>
                        <option value="TICKET_EDITED">TICKET_EDITED</option>
                        <option value="TICKET_STATUS_CHANGE">TICKET_STATUS_CHANGE</option>
                    </select>

                    <select
                        name="ticketStatus"
                        value={filters.ticketStatus}
                        onChange={handleFilterChange}
                        className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="N/A">N/A</option>
                        <option value="open">OPEN</option>
                        <option value="pending">PENDING</option>
                        <option value="processing">PROCESSING</option>
                        <option value="resolved">RESOLVED</option>
                    </select>

                    <select
                        name="priorityLevel"
                        value={filters.priorityLevel}
                        onChange={handleFilterChange}
                        className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500"
                    >
                        <option value="">All Priorities</option>
                        <option value="info">INFO</option>
                        <option value="warning">WARNING</option>
                        <option value="error">ERROR</option>
                        <option value="critical">CRITICAL</option>
                    </select>

                    <input
                        name="dateRange"
                        value={filters.dateRange}
                        onChange={handleFilterChange}
                        placeholder="Filter by Date Range (WIP)"
                        className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949]"
                    />

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-zinc-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                    >
                        <X size={14} /> Clear all filters
                    </button>
                </div>
            )}
        </>
    );
}