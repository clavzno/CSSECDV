// has a similar view as ManagerTickets, but admins cannot assign themselves or change status
"use client";
import { useState } from 'react';
import { Filter, Search, CheckCircle2, Circle, X } from 'lucide-react';
// content
import TicketList from '@/components/TicketList';

const sessionUsers = [
    {
        id: 1,
        name: "John Doe",
    },
    {
        id: 2,
        name: "Jane Doe",
    },
];

const ticketTypes = [
    'Course Registration and Enlistment Issues',
    'Shifting Inquiries',
    'Application for Leave of Absence (LOA)',
    'Request for Course Syllabi or Descriptions',
    'Academic Advising and Curriculum Inquiries',
    'Graduation Requirements and Clearance',
    'Course Withdrawals or Dropping Procedures',
    'Transferees: Credit Transfer and Accreditations'
]

const mockTickets = [
    { id: '#0142067', userId: '#0142067', assignedTo: '1', subject: 'Login issues on mobile', type: 'Bug Report', status: 'Resolved', lastUpdate: 'August 8, 2020' },
    { id: '#0142068', userId: '#0142068', assignedTo: '2', subject: 'Request for password reset', type: 'Account Issue', status: 'Open', lastUpdate: 'August 7, 2020' },
    { id: '#0142069', userId: '#0142069', assignedTo: '1', subject: 'Slow database queries', type: 'Service Request', status: 'Processing', lastUpdate: 'August 6, 2020' },
    { id: '#0142070', userId: '#0142070', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142071', userId: '#0142071', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142072', userId: '#0142072', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142073', userId: '#0142073', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142074', userId: '#0142074', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142075', userId: '#0142075', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
    { id: '#0142076', userId: '#0142076', assignedTo: '2', subject: 'New employee onboarding', type: 'Other', status: 'Pending', lastUpdate: 'August 5, 2020' },
];

/**
 * Tickets have _id, ticketId, subject, type, body, status, createdBy, createdAt, updatedAt
 * @param {*} param0 
 * @returns 
 */
export default function AdminTickets({ role }) {
    // filter states
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [filters, setFilters] = useState({
        id: '',
        subject: '',
        type: '',
        status: '',
    });

    if (role?.toLowerCase() !== 'admin') return null;

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({ id: '', subject: '', type: '', status: '' });
        setSearchTerm('');
    };

    const filteredTickets = mockTickets.filter((ticket) => {
        const matchesSearch =
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.includes(searchTerm);

        const matchesId = ticket.id.toLowerCase().includes(filters.id.toLowerCase());
        const matchesSubject = ticket.subject.toLowerCase().includes(filters.subject.toLowerCase());
        const matchesType = filters.type === '' || ticket.type === filters.type;
        const matchesStatus = filters.status === '' || ticket.status === filters.status;

        return matchesSearch && matchesId && matchesSubject && matchesType && matchesStatus;
    });

    return (
        <div className="w-full font-text text-foreground">
            {/** Header */}
            <h1 className="text-3xl font-bold mb-8">Tickets</h1>

            <div className="bg-[#e2e2e2] pt-8 flex flex-col min-h-150 rounded-t-md shadow-sm border border-zinc-300">
                {/* Main Action Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-6 px-6 mb-4 w-full">
                    <button
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
                            placeholder="Quick search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 text-sm outline-none text-zinc-700 placeholder:text-zinc-400"
                        />
                        <div className="px-3 border-l border-zinc-300 text-zinc-400 flex items-center justify-center">
                            <Search size={18} />
                        </div>
                    </div>

                    {/* Admins should not see "Show My Tickets" */}
                </div>

                {/* Expanded Filters Section */}
                {showFilters && (
                    <div className="px-6 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                        <input
                            name="id"
                            value={filters.id}
                            onChange={handleFilterChange}
                            placeholder="Filter by ID#"
                            className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949]"
                        />
                        <input
                            name="subject"
                            value={filters.subject}
                            onChange={handleFilterChange}
                            placeholder="Filter by Subject"
                            className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949]"
                        />

                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500"
                        >
                            <option value="">All Types</option>
                            <option value="Bug Report">Bug Report</option>
                            <option value="Account Issue">Account Issue</option>
                            <option value="Service Request">Service Request</option>
                            <option value="Other">Other</option>
                        </select>

                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="bg-white border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-[#3b5949] text-zinc-500"
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


                <TicketList tickets={filteredTickets} role="admin" />
            </div>
        </div>
    );
}