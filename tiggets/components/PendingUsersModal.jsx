"use client";

import { X } from "lucide-react";

export default function PendingUsersModal({
  isOpen,
  onClose,
  pendingUsers,
  onResend,
  isSubmitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-5xl rounded-md border border-border-gray bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border-gray px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pending Users</h2>
            <p className="text-sm text-zinc-500">
              View invited users and resend their account setup email.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-div-gray border-b border-border-gray">
                <th className="py-4 px-6 font-semibold">Username</th>
                <th className="py-4 px-6 font-semibold">Email</th>
                <th className="py-4 px-6 font-semibold">Role</th>
                <th className="py-4 px-6 font-semibold">Name</th>
                <th className="py-4 px-6 font-semibold">Invited At</th>
                <th className="py-4 px-6 font-semibold">Expires At</th>
                <th className="py-4 px-6 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border-gray hover:bg-div-gray/30 transition-colors bg-white"
                >
                  <td className="py-3 px-6 font-medium text-zinc-800">{user.username}</td>
                  <td className="py-3 px-6 text-zinc-800">{user.email}</td>
                  <td className="py-3 px-6 text-zinc-800 capitalize">{user.role}</td>
                  <td className="py-3 px-6 text-zinc-800">
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name provided.'}
                  </td>
                  <td className="py-3 px-6 text-zinc-800">{user.invitedAt}</td>
                  <td className="py-3 px-6 text-zinc-800">{user.inviteExpiresAt}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => onResend(user)}
                      disabled={isSubmitting}
                      className="bg-tiggets-lightgreen hover:opacity-90 text-white px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      Resend Email
                    </button>
                  </td>
                </tr>
              ))}

              {pendingUsers.length === 0 && (
                <tr className="bg-white">
                  <td
                    colSpan={7}
                    className="py-8 text-center text-zinc-500 italic border-b border-border-gray"
                  >
                    No pending invited users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-border-gray px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-400 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-500 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}