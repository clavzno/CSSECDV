"use client";

import { useState } from "react";
import { CircleX } from "lucide-react";

export default function DeleteUsersModal({
    isOpen,
    onClose,
    onConfirm,
    selectedCount,
    isSubmitting,
}) {
    const [confirmStep, setConfirmStep] = useState(1);

    if (!isOpen) return null;

    function handleClose() {
        setConfirmStep(1);
        onClose();
    }

    function handleContinue() {
        setConfirmStep(2);
    }

    function handleBack() {
        setConfirmStep(1);
    }

    function handleConfirmDelete() {
        onConfirm();
        setConfirmStep(1);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-2xl rounded-md border border-border-gray bg-background shadow-xl">
                <div className="flex items-start justify-between border-b border-border-gray px-4 py-4 md:px-6">
                    <div className="w-full">
                        <h2 className="text-lg font-semibold text-foreground">
                            Delete Selected Users
                        </h2>
                        <p className="mt-1 text-sm text-zinc-600">
                            {confirmStep === 1
                                ? "This action will remove the selected users from the system."
                                : "Please confirm once more before deleting the selected users."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:cursor-pointer hover:bg-zinc-200 hover:text-zinc-700"
                    >
                        <CircleX size={24} />
                    </button>
                </div>

                <div className="px-4 py-5 md:px-6">
                    <div className="rounded-sm border border-border-gray bg-[#f3f3f3] p-4 text-sm text-foreground">
                        {confirmStep === 1 ? (
                            <p>
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">{selectedCount}</span>{" "}
                                {selectedCount === 1 ? "user" : "users"}?
                            </p>
                        ) : (
                            <p>
                                This is your final confirmation. Do you really want to permanently
                                delete{" "}
                                <span className="font-semibold">{selectedCount}</span>{" "}
                                {selectedCount === 1 ? "user" : "users"}?
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border-gray px-4 py-4 md:px-6">
                    {confirmStep === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded bg-zinc-200 px-5 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-300 hover:cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleContinue}
                                className="rounded bg-red-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:cursor-pointer"
                            >
                                Continue
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="rounded bg-zinc-200 px-5 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-300 hover:cursor-pointer"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isSubmitting}
                                className="rounded bg-red-700 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? "Deleting..." : "Yes, Delete Users"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}