"use client";

import { CircleX } from 'lucide-react';
import { normalize } from 'path';

export default function SystemLogsModal({
    log,
    onClose,
    setTicketStatusColor,
    setPriorityStatusColor,
}) {
    if (!log) return null;

    const normalizedStatus = log.ticketStatus?.toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-5xl rounded-md border border-border-gray bg-background shadow-xl">
                <div className="flex items-start justify-between border-b border-border-gray px-6 py-4">
                    <div className="grid grid-cols-3 gap-x-50 gap-y-4 text-sm w-full">
                        {/** 1st col */}
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <span className="min-w-20 font-medium">Log ID #</span>
                                <span className="whitespace-nowrap">{log.logId}</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="min-w-20 font-medium">Date/Time</span>
                                <span className="whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="min-w-20 font-medium">User ID #</span>
                                <span className="whitespace-nowrap">{log.userId}</span>
                            </div>
                        </div>
                        {/** 2nd Col */}
                        <div className="space-y-4">

                            <div className="flex gap-3">
                                <span className="min-w-28 font-medium">Action Type</span>
                                <span className="whitespace-nowrap">{log.actionType}</span>
                            </div>

                            <div className="flex gap-3 items-center">
                                <span className="min-w-28 font-medium">Status</span>
                                <span
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setTicketStatusColor(normalizedStatus)}`}
                                >
                                    {log.ticketStatus?.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex gap-3 items-center">
                                <span className="min-w-28 font-medium">Priority</span>
                                <span
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setPriorityStatusColor(log.priorityLevel)}`}
                                >
                                    {log.priorityLevel?.toUpperCase()}
                                </span>
                            </div>

                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:cursor-pointer hover:bg-zinc-200 hover:text-zinc-700"
                            >
                                <CircleX size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <div className="flex gap-6">
                        <span className="min-w-20 font-medium text-sm">Description</span>

                        <div className="flex-1 h-60 overflow-y-auto rounded-sm border border-border-gray bg-[#f3f3f3] p-4 text-sm text-foreground">
                            {log.details}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}