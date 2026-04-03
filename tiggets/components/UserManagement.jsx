"use client";
import { useState } from 'react';
import { Search, ArrowUpDown, Filter, X } from 'lucide-react';

const mockUsers = [
  { id: '#0142067', name: 'John Smith', email: 'email@edu.com', role: 'admin', active: 'N/A', all: 'N/A' },
  { id: '#0142068', name: 'George Droid', email: 'georgedroid@edu.com', role: 'customer', active: 2, all: 2 },
  { id: '#0142069', name: 'Charlie Kirk', email: 'charliekirk@edu.com', role: 'manager', active: 3, all: 3 },
  { id: '#0142070', name: 'Jacobi Dream', email: 'jacobidream@edu.com', role: 'manager', active: 4, all: 4 },
];

export default function UserManagement({ role, session, users }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('numerical');

  if (role?.toLowerCase() !== 'manager' && role?.toLowerCase() !== 'admin') {
    return <div className="p-6 font-text">Access Denied.</div>;
  }

  const clearFilters = () => {
    setRoleFilter('');
    setSortBy('numerical');
    setSearchTerm('');
  };

  const dataToUse = users || mockUsers;

  let processedUsers = dataToUse.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.includes(searchTerm);

    const matchesRole = roleFilter === '' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  processedUsers.sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else {
      const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
      const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
      return idA - idB;
    }
  });

  return (
    <div className="w-full font-text text-foreground">

      <div className="w-full mb-8">
        {/* Header */}
        <h1 className="text-3xl font-bold w-full">User Management</h1>
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
            <div className="px-3 border-l border-zinc-300 text-zinc-400 flex items-center justify-center bg-zinc-50">
              <Search size={18} />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500 cursor-pointer"
            >
              <option value="numerical">Sort by ID #</option>
              <option value="alphabetical">Sort by Name (A-Z)</option>
            </select>

            <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-red-600 flex items-center gap-1 cursor-pointer">
              <X size={14} /> Clear all filters
            </button>
          </div>
        )}

        <div className="w-full mt-2">
          <div className="rounded-t-lg overflow-hidden border-y border-border-gray shadow-sm bg-background">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-div-gray border-b border-border-gray">
                  <th className="py-4 px-6 font-semibold">User ID #</th>
                  <th className="py-4 px-6 font-semibold">Name</th>
                  <th className="py-4 px-6 font-semibold">Email</th>
                  <th className="py-4 px-6 font-semibold">Role</th>
                  <th className="py-4 px-6 font-semibold text-center">Active Tickets</th>
                  <th className="py-4 px-6 font-semibold text-center">All Tickets</th>
                  <th className="py-4 px-6 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border-gray hover:bg-div-gray/30 transition-colors bg-white">
                    <td className="py-4 px-6 font-medium text-zinc-800">{user.id}</td>
                    <td className="py-4 px-6 text-zinc-800">{user.name}</td>
                    <td className="py-4 px-6 text-zinc-800">{user.email}</td>
                    <td className="py-4 px-6 text-zinc-800 capitalize">{user.role}</td>
                    <td className="py-4 px-6 text-center text-zinc-800">{user.active}</td>
                    <td className="py-4 px-6 text-center text-zinc-800">{user.all}</td>
                    <td className="py-4 px-6 text-center">

                      {/* DB LOGIC: Only render the Manage button if the user is NOT an admin */}
                      {user.role?.toLowerCase() !== 'admin' && (
                        <button className="bg-tiggets-lightgreen hover:opacity-90 text-white px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer">
                          Manage
                        </button>
                      )}

                    </td>
                  </tr>
                ))}
                {processedUsers.length === 0 && (
                  <tr className="bg-white">
                    <td colSpan="7" className="py-8 text-center text-zinc-500 italic border-b border-border-gray">
                      No users match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="text-center py-6 text-sm font-medium bg-div-gray text-foreground border-t border-border-gray" />
          </div>
        </div>
      </div>
    </div>
  );
}