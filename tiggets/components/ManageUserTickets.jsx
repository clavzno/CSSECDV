"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  X,
  ArrowLeft,
  Pencil,
  Save,
  CircleX
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TicketList from '@/components/TicketList';

export default function ManageUserTickets({
  targetUser,
  createdTickets,
  assignedTickets,
  role
}) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ type: '', status: '' });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: ''
  });

  const isAdmin = String(role || '').toLowerCase() === 'admin';
  const isManager = String(targetUser?.role || '').toLowerCase() === 'manager';
  const canEditProfile = Boolean(targetUser?.canEditProfile);

  useEffect(() => {
    setProfileForm({
      username: String(targetUser?.username || ''),
      email: String(targetUser?.email || ''),
      firstName: String(targetUser?.firstName || ''),
      lastName: String(targetUser?.lastName || ''),
      role: String(targetUser?.role || 'customer')
    });
  }, [targetUser]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));
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

  const fullName = useMemo(() => {
    const built = `${profileForm.firstName} ${profileForm.lastName}`.trim();
    return built || targetUser?.name || 'Unknown User';
  }, [profileForm.firstName, profileForm.lastName, targetUser?.name]);

  const hasProfileChanges = useMemo(() => {
    return (
      profileForm.username !== String(targetUser?.username || '') ||
      profileForm.email !== String(targetUser?.email || '') ||
      profileForm.firstName !== String(targetUser?.firstName || '') ||
      profileForm.lastName !== String(targetUser?.lastName || '') ||
      profileForm.role !== String(targetUser?.role || 'customer')
    );
  }, [profileForm, targetUser]);

  function cancelProfileEdit() {
    setProfileForm({
      username: String(targetUser?.username || ''),
      email: String(targetUser?.email || ''),
      firstName: String(targetUser?.firstName || ''),
      lastName: String(targetUser?.lastName || ''),
      role: String(targetUser?.role || 'customer')
    });
    setIsEditingProfile(false);
  }

  async function saveProfileChanges() {
    if (!canEditProfile) {
      alert('You are not allowed to edit this profile.');
      return;
    }

    const trimmedPayload = {
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      role: String(profileForm.role || '').trim().toLowerCase()
    };

    if (
      !trimmedPayload.username ||
      !trimmedPayload.email ||
      !trimmedPayload.firstName ||
      !trimmedPayload.lastName ||
      !trimmedPayload.role
    ) {
      alert('Username, email, first name, last name, and role are required.');
      return;
    }

    const confirmed = window.confirm('Save changes to this user profile?');
    if (!confirmed) return;

    try {
      setIsSavingProfile(true);

      const response = await fetch('/api/user-management/update-user-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: targetUser?.mongoId,
          ...trimmedPayload
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update user profile.');
      }

      setIsEditingProfile(false);
      router.refresh();
    } catch (error) {
      alert(error.message || 'Failed to update user profile.');
    } finally {
      setIsSavingProfile(false);
    }
  }

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
          {fullName ? `${fullName}'s Tickets` : 'User Tickets'}
        </h1>
      </div>

      {/** User Profile Section */}
      {canEditProfile && (
        <div className="mb-8 rounded-md border border-zinc-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border-gray px-6 py-4">
            <h2 className="text-xl font-semibold text-black">User Profile</h2>

            {canEditProfile && !isEditingProfile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center gap-2 rounded bg-tiggets-lightgreen px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 cursor-pointer"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}

            {canEditProfile && isEditingProfile && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelProfileEdit}
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-2 rounded border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CircleX size={14} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveProfileChanges}
                  disabled={isSavingProfile || !hasProfileChanges}
                  className="inline-flex items-center gap-2 rounded bg-tiggets-lightgreen px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save size={14} />
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Username
              </label>
              {isEditingProfile ? (
                <input
                  name="username"
                  type="text"
                  value={profileForm.username}
                  onChange={handleProfileChange}
                  className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#3b5949]"
                />
              ) : (
                <div className="rounded-sm border border-zinc-300 bg-[#e2e2e2] px-3 py-2 text-sm text-zinc-800">
                  {targetUser?.username || 'N/A'}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Email
              </label>
              {isEditingProfile ? (
                <input
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#3b5949]"
                />
              ) : (
                <div className="rounded-sm border border-zinc-300 bg-[#e2e2e2] px-3 py-2 text-sm text-zinc-800">
                  {targetUser?.email || 'N/A'}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                First Name
              </label>
              {isEditingProfile ? (
                <input
                  name="firstName"
                  type="text"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#3b5949]"
                />
              ) : (
                <div className="rounded-sm border border-zinc-300 bg-[#e2e2e2] px-3 py-2 text-sm text-zinc-800">
                  {targetUser?.firstName || 'N/A'}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Last Name
              </label>
              {isEditingProfile ? (
                <input
                  name="lastName"
                  type="text"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#3b5949]"
                />
              ) : (
                <div className="rounded-sm border border-zinc-300 bg-[#e2e2e2] px-3 py-2 text-sm text-zinc-800">
                  {targetUser?.lastName || 'N/A'}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Role
              </label>
              {isEditingProfile ? (
                <select
                  name="role"
                  value={profileForm.role}
                  onChange={handleProfileChange}
                  className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm capitalize text-zinc-800 outline-none focus:border-[#3b5949] cursor-pointer bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="customer">Customer</option>
                </select>
              ) : (
                <div className="rounded-sm border border-zinc-300 bg-[#e2e2e2] px-3 py-2 text-sm capitalize text-zinc-800">
                  {targetUser?.role || 'N/A'}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                User ID
              </label>
              <div className="rounded-sm border border-zinc-300 bg-[#e2e2e2] px-3 py-2 text-sm text-zinc-800 break-all">
                {targetUser?.mongoId || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/** Tickets Section */}
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