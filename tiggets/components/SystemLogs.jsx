"use client";
import { useState } from 'react';
// content
import SystemLogsFilter from '@/components/SystemLogsFilter';
import SystemLogsModal from '@/components/SystemLogsModal';

// page.tsx for system logs handles all the server-side fetching and passes it down to this component
// this will not render properly and will have horizontal scroll on some screens, user may have to zoom out
export default function SystemLogs({ session, logs }) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        username: '',
        actionType: '',
        ticketStatus: '',
        priorityLevel: '',
        dateRange: '',
    });

    const [selectedLog, setSelectedLog] = useState(null);

    function handleFilterChange(e) {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    }

    function clearFilters() {
        setFilters({
            username: '',
            actionType: '',
            ticketStatus: '',
            priorityLevel: '',
            dateRange: '',
        });
        setSearchTerm('');
    }

    function setTicketStatusColor(status) {
        const normalizedStatus = status?.toUpperCase();

        switch (normalizedStatus) {
            case 'RESOLVED':
                return 'bg-green-200 text-green-800 border-green-300';
            case 'OPEN':
                return 'bg-red-200 text-red-800 border-red-300';
            case 'PROCESSING':
                return 'bg-teal-200 text-teal-800 border-teal-300';
            case 'PENDING':
                return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            case 'N/A':
                return 'bg-gray-200 text-gray-800 border-gray-300';
            default:
                return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    }

    function setPriorityStatusColor(priority) {
        const normalizedPriority = priority?.toLowerCase();

        switch (normalizedPriority) {
            case 'info':
                return 'bg-div-gray text-gray-800 border-gray-300';
            case 'warning':
                return 'bg-warning-yellow text-warning-yellow-stroke border-warning-yellow-stroke';
            case 'error':
                return 'bg-error-orange text-error-orange-stroke border-error-orange-stroke';
            case 'critical':
                return 'bg-red-200 text-red-800 border-red-300';
            default:
                return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    }

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            searchTerm === '' ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.username?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesUsername =
            filters.username === '' ||
            log.username?.toLowerCase().includes(filters.username.toLowerCase());

        const matchesActionType =
            filters.actionType === '' || log.actionType === filters.actionType;

        const matchesTicketStatus =
            filters.ticketStatus === '' ||
            log.ticketStatus?.toLowerCase() === filters.ticketStatus.toLowerCase();

        const matchesPriority =
            filters.priorityLevel === '' ||
            log.priorityLevel?.toLowerCase() === filters.priorityLevel.toLowerCase();

        return (
            matchesSearch &&
            matchesUsername &&
            matchesActionType &&
            matchesTicketStatus &&
            matchesPriority
        );
    });

    return (
        <div className="w-full font-text text-foreground">
            <div className="w-full mb-8">
                <h1 className="text-3xl font-bold w-full">System Logs</h1>
            </div>

            <div className="rounded-t-lg overflow-hidden border border-border-gray shadow-sm">
                <SystemLogsFilter
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    clearFilters={clearFilters}
                />

                <div className="w-full md:overflow-x-auto">
                    <table className="w-full table-auto border-collapse bg-background text-xs md:text-sm">
                        <thead>
                            <tr className="bg-div-gray border-b border-border-gray">
                                <th className="py-4 px-6 font-semibold text-center">Log ID #</th>
                                <th className="py-4 px-6 font-semibold text-center">Timestamp</th>
                                <th className="py-4 px-6 font-semibold text-center">Username</th>
                                <th className="py-4 px-6 font-semibold text-center">Action Type</th>
                                <th className="py-4 px-6 font-semibold">Details</th>
                                <th className="py-4 px-6 font-semibold text-center">Status</th>
                                <th className="py-4 px-6 font-semibold text-center">Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr
                                    key={`${log.logId}-${log.timestamp}-${log.priorityLevel}`}
                                    onClick={() => setSelectedLog(log)}
                                    className="border-b border-border-gray hover:bg-div-gray/30 transition-colors bg-white cursor-pointer"
                                >
                                    <td className="py-4 px-6 text-center font-medium">
                                        {log.logId}
                                    </td>
                                    <td className="py-4 px-6 text-center whitespace-nowrap text-gray-600">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {log.username}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {log.actionType}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="max-w-80 truncate">
                                            {log.details}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setTicketStatusColor(log.ticketStatus)}`}>
                                            {log.ticketStatus?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${setPriorityStatusColor(log.priorityLevel)}`}>
                                            {log.priorityLevel?.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="text-center py-6 text-sm font-medium bg-div-gray text-foreground border-t border-border-gray" />
            </div>

            {selectedLog && (
                <SystemLogsModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                    setTicketStatusColor={setTicketStatusColor}
                    setPriorityStatusColor={setPriorityStatusColor}
                />
            )}
        </div>
    );
}