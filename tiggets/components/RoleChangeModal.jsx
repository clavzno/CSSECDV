"use client";

import { CircleX } from "lucide-react";

export default function RoleChangeModal({
    isOpen,
    onClose,
    onConfirm,
    selectedCount,
    selectedRole,
    setSelectedRole,
    isSubmitting,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-2xl rounded-md border border-border-gray bg-background shadow-xl">
                <div className="flex items-start justify-between border-b border-border-gray px-4 py-4 md:px-6">
                    <div className="w-full">
                        <h2 className="text-lg font-semibold text-foreground">Change Role</h2>
                        <p className="mt-1 text-sm text-zinc-600">
                            Select a new role for the chosen users.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:cursor-pointer hover:bg-zinc-200 hover:text-zinc-700"
                    >
                        <CircleX size={24} />
                    </button>
                </div>

                <div className="px-4 py-5 md:px-6">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                                New Role
                            </label>

                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-[#3b5949]"
                            >
                                <option value="">Select a role</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="customer">Customer</option>
                            </select>
                        </div>

                        <div className="rounded-sm border border-border-gray bg-[#f3f3f3] p-4 text-sm text-foreground">
                            {selectedRole ? (
                                <p>
                                    Do you want to change the role for{" "}
                                    <span className="font-semibold">{selectedCount}</span>{" "}
                                    {selectedCount === 1 ? "user" : "users"} to{" "}
                                    <span className="font-semibold capitalize">{selectedRole}</span>?
                                </p>
                            ) : (
                                <p>
                                    Select a role first before confirming the change for{" "}
                                    <span className="font-semibold">{selectedCount}</span>{" "}
                                    {selectedCount === 1 ? "user" : "users"}.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border-gray px-4 py-4 md:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded bg-zinc-200 px-5 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-300 hover:cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!selectedRole || isSubmitting}
                        className="rounded bg-yellow-500 px-5 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition-all hover:opacity-90 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Confirm Role Change"}
                    </button>
                </div>
            </div>
        </div>
    );
}