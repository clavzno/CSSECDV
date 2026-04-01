"use client";
import { useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    User,
    ChevronDown,
    MoreHorizontal,
    Upload,
    Download,
    Pencil,
    Trash2,
    Info,
} from 'lucide-react';

// remove nalang when connected na sa db
const localTicketData = [
    {
        id: '0142067',
        subject: "Lorem ipsum dolor sit amet...",
        type: "Transferees: Credit transfer and accreditations",
        description:
            'I would like to ask about transferring and accrediting courses from my previous institution and what documents are needed to process this request.',
        status: "Resolved",
        assignedTo: "me",
        author: 'Juan Dela Cruz',
        createdAt: 'August 8, 2020 09:00AM',
        attachment: 'Syllabus_STINTSY.pdf',
        replies: [
            { id: 1, author: "Juan Dela Cruz", date: "August 8, 2020 09:00AM", content: "Good day! I would like to ask about the process for crediting my STINTSY class from my previous university. Attached is my syllabus.", attachment: "Syllabus_STINTSY.pdf", isEdited: false }
        ]
    },
    {
        id: '0142068',
        subject: "Course withdrawals or dropping procedures",
        type: "Course withdrawals...",
        description:
            'Hello, I need clarification on the deadline and process for dropping a course this term, including any effects on fees and transcript notation.',
        status: "Open",
        assignedTo: "other",
        author: 'Maria Santos',
        createdAt: 'August 7, 2020 02:30PM',
        attachment: null,
        replies: [
            { id: 1, author: "Maria Santos", date: "August 7, 2020 02:30PM", content: "Hello, what is the deadline for dropping a course this term?", attachment: null, isEdited: false }
        ]
    },
    {
        id: '0142069', 
        subject: "HELP I CAN'T DO THIS ANYMORE",
        type: "Application for Leave of Absence (LOA)",
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...',
        status: "Processing",
        assignedTo: "unassigned",
        author: 'Angelica Therese I Clavano',
        createdAt: 'March 29, 2026 11:16PM',
        attachment: 'PretendThisIsDownloadIcon.pdf',
        replies: [
            { id: 1, author: "Angelica Therese I Clavano", date: "March 29, 2026 11:16PM", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...", attachment: "PretendThisIsDownloadIcon.pdf", isEdited: false },
            { id: 2, author: "Olajide Olayinka Williams Olatunji", date: "March 30, 2026 12:42AM", content: "Aye bruh ion think I can handle this. Imma close this ticket gng.", attachment: null, isEdited: true, editDate: "March 31, 2026 2:00PM" }
        ]
    }
];

export default function ManagerViewTicket({ ticketId }) {
    const cleanId = ticketId?.replace('#', '');
    const foundTicket = localTicketData.find(t => t.id === cleanId);

    const activeTicket = foundTicket || {
        subject: `Inquiry regarding issue #${cleanId}`,
        type: "General Support Request",
        description: `This is a generic view for ticket #${cleanId}. Real data will populate here when the database is connected.`,
        status: "Pending",
        assignedTo: "unassigned",
        author: 'System',
        createdAt: 'Just now',
        attachment: null,
        replies: [{ id: 1, author: "System", date: "Just now", content: `This is a generic view for ticket #${cleanId}. Real data will populate here when the database is connected.`, attachment: null, isEdited: false }]
    };

    const [status, setStatus] = useState(activeTicket.status);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [assignmentState, setAssignmentState] = useState(activeTicket.assignedTo);
    const [activeMessageMenu, setActiveMessageMenu] = useState(null);
    const [replyText, setReplyText] = useState("");

    const [replies, setReplies] = useState(activeTicket.replies);

    const getStatusColors = (currentStatus) => {
        switch (currentStatus) {
            case 'Resolved': return 'bg-green-300 text-green-900 border-green-400';
            case 'Open': return 'bg-rose-300 text-rose-900 border-rose-400';
            case 'Processing': return 'bg-cyan-200 text-cyan-900 border-cyan-300';
            case 'Pending': return 'bg-amber-200 text-amber-900 border-amber-400';
            default: return 'bg-zinc-200 text-zinc-800 border-zinc-300';
        }
    };

    // placeholder functions for other backend shit

    const handleToggleAssignment = () => {
        let newState = 'unassigned';
        if (assignmentState === 'unassigned') newState = 'me';
        else if (assignmentState === 'me') newState = 'other';

        console.log(`[Database Alert] Update ticket ${cleanId} assignment to: ${newState}`);
        setAssignmentState(newState);
    };

    const handleStatusChange = (newStatus) => {
        console.log(`[Database Alert] Update ticket ${cleanId} status to: ${newStatus}`);
        setStatus(newStatus);
        setIsStatusDropdownOpen(false);
    };

    const handlePostReply = () => {
        if (!replyText.trim()) return;

        console.log(`[Database Alert] Posting new reply to ticket ${cleanId}: ${replyText}`);

        const newReply = {
            id: Date.now(),
            author: "Manager (You)",
            date: "Just now",
            content: replyText,
            attachment: null,
            isEdited: false
        };
        setReplies([...replies, newReply]);
        setReplyText(""); 
    };

    const handleDeleteReply = (replyId) => {
        console.log(`[Database Alert] Deleting reply ID ${replyId} from ticket ${cleanId}`);

        setReplies(replies.filter(r => r.id !== replyId));
        setActiveMessageMenu(null);
    };

    const handleEditReply = (replyId) => {
        console.log(`[Database Alert] Editing reply ID ${replyId} on ticket ${cleanId}`);
        alert("Edit functionality will be wired up to the database here!");
        setActiveMessageMenu(null);
    };


    const actionBoxBaseClass = "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors min-h-[44px]";

    return (
        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="mb-2 text-3xl font-bold text-zinc-800">&quot;{activeTicket.subject}&quot;</h1>
                            <p className="text-lg text-zinc-600">Type of Inquiry: {activeTicket.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-4 py-1 text-sm font-medium ${getStatusColors(status)}`}>
                                {status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="rounded-lg border border-zinc-200 bg-gray-200 p-4">
                        <p className="leading-relaxed text-zinc-700">{activeTicket.description}</p>
                    </div>

                    {activeTicket.attachment && (
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                        >
                            <Download className="h-4 w-4" />
                            <span>{activeTicket.attachment}</span>
                        </button>
                    )}

                    <div className="flex justify-end text-sm text-zinc-500">
                        <div>
                            <p className="font-medium">{activeTicket.author}</p>
                            <p>{activeTicket.createdAt}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-zinc-200 pt-6">
                    <h2 className="mb-4 text-xl font-bold text-zinc-800">Replies</h2>

                    <div className="rounded-lg border border-zinc-200 bg-gray-100 p-4">
                        <div className="space-y-4">
                            {replies.map((reply) => (
                                <div key={reply.id} className="space-y-3">
                                    <div className="space-y-3 bg-gray-200 p-4 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-zinc-800">{reply.author}</p>
                                                <p className="text-sm text-zinc-600">{reply.date}</p>
                                                {reply.isEdited && (
                                                    <p className="text-xs text-zinc-500 mt-1">Edited: {reply.editDate}</p>
                                                )}
                                            </div>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveMessageMenu(activeMessageMenu === reply.id ? null : reply.id)}
                                                    className="p-2 hover:bg-gray-300 rounded transition"
                                                    aria-label="Manage reply"
                                                >
                                                    <MoreHorizontal className="h-4 w-4 text-zinc-600" />
                                                </button>
                                                {activeMessageMenu === reply.id && (
                                                    <div className="absolute right-0 top-10 bg-white border border-zinc-200 shadow-md rounded-sm w-28 z-10 overflow-hidden text-sm">
                                                        <button onClick={() => handleEditReply(reply.id)} className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-600"><Pencil size={14} /> Edit</button>
                                                        <button onClick={() => handleDeleteReply(reply.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-zinc-100"><Trash2 size={14} /> Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-zinc-700 leading-relaxed">{reply.content}</p>
                                    </div>

                                    {reply.attachment && (
                                        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-600 cursor-pointer hover:bg-zinc-50 transition-colors">
                                            {reply.attachment}
                                            <Download size={14} className="text-zinc-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-zinc-200 pt-6">
                    <h2 className="mb-4 text-xl font-bold text-zinc-800">Add Reply</h2>
                    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Add a reply..."
                            className="w-full rounded-lg border border-zinc-300 p-3 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                        />

                        <div className="flex items-center justify-between">
                            <button className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-600 transition hover:bg-gray-50">
                                <Upload className="h-4 w-4" />
                                Click to upload file...
                            </button>

                            <button
                                onClick={handlePostReply}
                                disabled={!replyText.trim()}
                                className="rounded-lg bg-tiggets-lightgreen px-6 py-2 font-medium text-white transition hover:bg-[#2b4a3c] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <aside className="w-full lg:w-72">
                <div className="sticky top-8 rounded-lg border border-zinc-300 bg-white shadow-sm">
                    <div className="rounded-t-lg border-b border-zinc-300 bg-zinc-100 py-3 text-center">
                        <h3 className="text-lg font-semibold text-zinc-800">Actions</h3>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        <button
                            onClick={handleToggleAssignment}
                            className={`${actionBoxBaseClass} text-left ${assignmentState === 'me' ? 'bg-[#3b5949] text-white border-[#3b5949]' : assignmentState === 'other' ? 'bg-zinc-100 text-zinc-400 border-zinc-300 cursor-not-allowed' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-300'}`}
                        >
                            {assignmentState === 'me' ? <CheckCircle2 size={16} /> : assignmentState === 'other' ? <XCircle size={16} /> : <CheckCircle2 size={16} className="opacity-50" />}
                            {assignmentState === 'me' ? 'You are assigned.' : assignmentState === 'other' ? 'This is already taken.' : 'Assign Yourself'}
                        </button>
                        <div className={`${actionBoxBaseClass} ${assignmentState === 'me' ? 'bg-[#3b5949] text-white border-[#3b5949]' : 'bg-white text-zinc-600 border-zinc-300'}`}>
                            <User size={16} />
                            {assignmentState === 'me' ? 'Ral is Goated' : assignmentState === 'other' ? 'Jack Clavano' : 'None'}
                        </div>
                        <div className="relative z-20">
                            <button onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)} className={`${actionBoxBaseClass} justify-between ${getStatusColors(status)}`}>
                                <div className="flex items-center gap-2"><Info size={16} /> Status: {status}</div>
                                <ChevronDown size={16} className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isStatusDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-zinc-300 bg-white text-sm shadow-xl">
                                    {['Open', 'Pending', 'Processing', 'Resolved'].map((opt) => (
                                        <button key={opt} onClick={() => handleStatusChange(opt)} className={`w-full text-left px-4 py-2.5 hover:opacity-80 transition-opacity font-medium ${getStatusColors(opt)} border-none rounded-none`}>{opt}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </main>
    );
}