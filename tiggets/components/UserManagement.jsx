"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import RoleChangeModal from '@/components/RoleChangeModal';
import DeleteUsersModal from '@/components/DeleteUsersModal';
import AccountInitiationModal from '@/components/AccountInitiationModal';
import PendingUsersModal from '@/components/PendingUsersModal';

import { useRouter } from 'next/navigation';

export default function UserManagement({ role, users, pendingUsers }) {
  // authorization is checked in page.tsx
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('numerical');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  const [showAccountInitiationModal, setShowAccountInitiationModal] = useState(false);
  const [showPendingUsersModal, setShowPendingUsersModal] = useState(false);

  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [showDeleteUsersModal, setShowDeleteUsersModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const isAdmin = String(role || '').toLowerCase() === 'admin';
  const pendingUsersList = Array.isArray(pendingUsers) ? pendingUsers : [];

  function toggleUser(id) {
    if (!isAdmin) return;

    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  function toggleAll(users) {
    if (!isAdmin) return;

    const selectableUsers = users.filter((u) => String(u.role || '').toLowerCase() !== 'admin');
    const selectableIds = selectableUsers.map((u) => u.id);

    if (selectableIds.length > 0 && selectableIds.every((id) => selectedUsers.has(id))) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(selectableIds));
    }
  }

  function openRoleChangeModal() {
    if (!isAdmin || selectedUsers.size === 0) return;
    setSelectedRole('');
    setShowRoleChangeModal(true);
  }

  function closeRoleChangeModal() {
    setShowRoleChangeModal(false);
    setSelectedRole('');
  }

  function openDeleteUsersModal() {
    if (!isAdmin || selectedUsers.size === 0) return;
    setShowDeleteUsersModal(true);
  }

  function closeDeleteUsersModal() {
    setShowDeleteUsersModal(false);
  }

  function promptMfaCredentials() {
    const useBackup = window.confirm('Use backup code? Click OK for backup code, Cancel for authenticator code.');
    const code = window.prompt(useBackup ? 'Enter backup code:' : 'Enter 6-digit authentication code:');
    if (!code) return null;

    return useBackup
      ? { mfaCode: '', backupCode: code.trim().toUpperCase() }
      : { mfaCode: code.trim(), backupCode: '' };
  }

  function openAccountInitiationModal() {
    if (!isAdmin) return;
    setShowAccountInitiationModal(true);
  }

  function closeAccountInitiationModal() {
    setShowAccountInitiationModal(false);
  }

  function openPendingUsersModal() {
    if (!isAdmin) return;
    setShowPendingUsersModal(true);
  }

  function closePendingUsersModal() {
    setShowPendingUsersModal(false);
  }

  async function handleConfirmRoleChange() {
    if (!selectedRole || selectedUsers.size === 0) return;

    try {
      setIsSubmitting(true);

      const sendRequest = async (mfaPayload = { mfaCode: '', backupCode: '' }) => {
        const response = await fetch('/api/user-management/change-role', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds: Array.from(selectedUsers),
            role: selectedRole,
            ...mfaPayload,
          }),
        });

        const data = await response.json();
        return { response, data };
      };

      let { response, data } = await sendRequest();

      if (response.status === 401 && data?.mfaRequired) {
        const mfaPayload = promptMfaCredentials();
        if (!mfaPayload) {
          throw new Error('MFA is required to change user roles.');
        }
        ({ response, data } = await sendRequest(mfaPayload));
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to change role.');
      }

      setSelectedUsers(new Set());
      closeRoleChangeModal();
      router.refresh();
    } catch (error) {
      alert(error.message || 'Failed to change role.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAccountInitiation(payload) {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user-management/initiate-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to initiate account.');
      }

      if (data?.mailToUrl) {
        window.location.href = data.mailToUrl;
        return;
      }

      if (data?.redirectToCompose) {
        window.open(data.redirectToCompose, '_blank', 'noopener,noreferrer');
        return;
      }

      alert('Account initiation created successfully.');
      router.refresh();
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendInvitation(user) {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/user-management/resend-initiation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Resend route returned a non-JSON response.');
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to resend invitation email.');
      }

      if (data?.mailToUrl) {
        window.location.href = data.mailToUrl;
        return;
      }

      if (data?.redirectToCompose) {
        window.open(data.redirectToCompose, '_blank', 'noopener,noreferrer');
        return;
      }

      alert('Invitation email resent successfully.');
      router.refresh();
    } catch (error) {
      alert(error.message || 'Failed to resend invitation email.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDeleteUsersModal() {
    if (!isAdmin || selectedUsers.size === 0) return;
    setShowDeleteUsersModal(true);
  }

  function closeDeleteUsersModal() {
    setShowDeleteUsersModal(false);
  }

  async function handleConfirmDeleteUsers() {
    if (selectedUsers.size === 0) return;

    try {
      setIsSubmitting(true);

      const sendRequest = async (mfaPayload = { mfaCode: '', backupCode: '' }) => {
        const response = await fetch('/api/user-management/delete-users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds: Array.from(selectedUsers),
            ...mfaPayload,
          }),
        });

        const data = await response.json();
        return { response, data };
      };

      let { response, data } = await sendRequest();

      if (response.status === 401 && data?.mfaRequired) {
        const mfaPayload = promptMfaCredentials();
        if (!mfaPayload) {
          throw new Error('MFA is required to delete users.');
        }
        ({ response, data } = await sendRequest(mfaPayload));
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete users.');
      }

      setSelectedUsers(new Set());
      closeDeleteUsersModal();
      router.refresh();
    } catch (error) {
      alert(error.message || 'Failed to delete users.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const clearFilters = () => {
    setRoleFilter('');
    setSortBy('numerical');
    setSearchTerm('');
  };

  const dataToUse = users;

  let processedUsers = dataToUse.filter((user) => {
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
        <h1 className="text-3xl font-bold w-full">User Management</h1>
      </div>

      <div className="bg-[#e2e2e2] pt-8 flex flex-col min-h-150 rounded-t-md shadow-sm border border-zinc-300">
        <div className="flex flex-col gap-4 px-6 mb-4 w-full lg:flex-row lg:items-center">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-3 bg-white border px-4 py-2 rounded-sm text-sm font-medium transition-all shadow-sm cursor-pointer w-full sm:w-35 ${showFilters ? 'border-[#3b5949] text-[#3b5949]' : 'border-zinc-300 text-zinc-400'}`}
            >
              <Filter size={18} />
              Filters
            </button>

            <div className="flex bg-white border border-zinc-300 rounded-sm w-full shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-[#3b5949]">
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

          {isAdmin && (
            <div className="flex w-full justify-end gap-3 lg:w-auto">
              <button
                onClick={openPendingUsersModal}
                className="bg-white border border-zinc-300 hover:border-[#3b5949] hover:text-[#3b5949] text-zinc-600 px-5 py-2 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                Pending Users
              </button>

              <button
                onClick={openAccountInitiationModal}
                className="bg-tiggets-lightgreen hover:opacity-90 text-white px-5 py-2 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                Initiate Account
              </button>
            </div>
          )}
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
            {isAdmin && selectedUsers.size > 0 && (
              <div className="px-6 py-4 flex gap-3 border-b border-border-gray bg-white">
                <button
                  onClick={openRoleChangeModal}
                  className="bg-yellow-500 hover:opacity-90 text-zinc-800 px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Change Role
                </button>

                <button
                  onClick={openDeleteUsersModal}
                  className="bg-red-600 hover:opacity-90 text-[#F6F6F6] px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Delete Selected ({selectedUsers.size})
                </button>
              </div>
            )}

            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-div-gray border-b border-border-gray">
                  {/** will not render a checkbox for other admin accounts */}
                  {isAdmin && (
                    <th className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={
                          processedUsers.filter((u) => String(u.role || '').toLowerCase() !== 'admin').length > 0 &&
                          processedUsers
                            .filter((u) => String(u.role || '').toLowerCase() !== 'admin')
                            .every((u) => selectedUsers.has(u.id))
                        }
                        onChange={() => toggleAll(processedUsers)}
                      />
                    </th>
                  )}
                  <th className="py-4 px-6 font-semibold">User ID #</th>
                  <th className="py-4 px-6 font-semibold">Username</th>
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
                    {isAdmin && (
                      <td className="py-2 px-4">
                        {user.role?.toLowerCase() !== 'admin' ? (
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUser(user.id)}
                          />
                        ) : null}
                      </td>
                    )}

                    <td className="py-2 px-6 font-medium text-zinc-800">{user.id}</td>
                    <th className="py-2 px-6 font-semibold">{user.username}</th>
                    <td className="py-2 px-6 text-zinc-800">{user.name}</td>
                    <td className="py-2 px-6 text-zinc-800">{user.email}</td>
                    <td className="py-2 px-6 text-zinc-800 capitalize">{user.role}</td>
                    <td className="py-2 px-6 text-center text-zinc-800">{user.active}</td>
                    <td className="py-2 px-6 text-center text-zinc-800">{user.all}</td>


                    <td className="py-2 px-6 text-center">
                      {/** Admins can't edit other admin info */}
                      {user.isCurrentUser ? (
                        isAdmin ? (
                          <Link href={`/user-management/${user.mongoId}`} className="flex justify-center">
                            <button className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-5 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 cursor-pointer hover:bg-blue-100 transition-colors">
                              You
                            </button>
                          </Link>
                        ) : (
                          <div className="flex justify-center">
                            <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-5 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              You
                            </span>
                          </div>
                        )
                      ) : user.role?.toLowerCase() !== 'admin' ? (
                        <Link href={`/user-management/${user.mongoId}`}>
                          <button className="bg-tiggets-lightgreen hover:opacity-90 text-white px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer">
                            Manage
                          </button>
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}

                {processedUsers.length === 0 && (
                  <tr className="bg-white">
                    <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-zinc-500 italic border-b border-border-gray">
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

      {isAdmin && (
        <RoleChangeModal
          isOpen={showRoleChangeModal}
          onClose={closeRoleChangeModal}
          onConfirm={handleConfirmRoleChange}
          selectedCount={selectedUsers.size}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          isSubmitting={isSubmitting}
        />
      )}

      {isAdmin && (
        <DeleteUsersModal
          isOpen={showDeleteUsersModal}
          onClose={closeDeleteUsersModal}
          onConfirm={handleConfirmDeleteUsers}
          selectedCount={selectedUsers.size}
          isSubmitting={isSubmitting}
        />
      )}

      {isAdmin && (
        <AccountInitiationModal
          isOpen={showAccountInitiationModal}
          onClose={closeAccountInitiationModal}
          onSubmit={handleAccountInitiation}
          isSubmitting={isSubmitting}
        />
      )}

      {isAdmin && (
        <PendingUsersModal
          isOpen={showPendingUsersModal}
          onClose={closePendingUsersModal}
          pendingUsers={pendingUsersList}
          onResend={handleResendInvitation}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}