"use client";
import { useState, useEffect } from 'react';
import { 
    CheckCircle2, XCircle, User, ChevronDown, 
    MoreHorizontal, Upload, Download, Pencil, Trash2, Info 
} from 'lucide-react';

// remove nalang when connected na sa db
const localTicketData = [
    {
        id: '0142067',
        subject: "Lorem ipsum dolor sit amet...",
        type: "Transferees: Credit transfer and accreditations",
        status: "Resolved",
        assignedTo: "me",
        replies: [
            { id: 1, author: "Juan Dela Cruz", date: "August 8, 2020 09:00AM", content: "Good day! I would like to ask about the process for crediting my STINTSY class from my previous university. Attached is my syllabus.", attachment: "Syllabus_STINTSY.pdf", isEdited: false }
        ]
    },
    {
        id: '0142068',
        subject: "Course withdrawals or dropping procedures",
        type: "Course withdrawals...",
        status: "Open",
        assignedTo: "other",
        replies: [
            { id: 1, author: "Maria Santos", date: "August 7, 2020 02:30PM", content: "Hello, what is the deadline for dropping a course this term?", attachment: null, isEdited: false }
        ]
    },
    {
        id: '0142069', 
        subject: "HELP I CAN'T DO THIS ANYMORE",
        type: "Application for Leave of Absence (LOA)",
        status: "Processing",
        assignedTo: "unassigned",
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
        status: "Pending",
        assignedTo: "unassigned",
        replies: [{ id: 1, author: "System", date: "Just now", content: `This is a generic view for ticket #${cleanId}. Real data will populate here when the database is connected.`, attachment: null, isEdited: false }]
    };

    const [status, setStatus] = useState(activeTicket.status);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [assignmentState, setAssignmentState] = useState(activeTicket.assignedTo); 
    const [activeMessageMenu, setActiveMessageMenu] = useState(null);
    const [replyText, setReplyText] = useState("");
    
    const [replies, setReplies] = useState(activeTicket.replies);

    useEffect(() => {
        setStatus(activeTicket.status);
        setAssignmentState(activeTicket.assignedTo);
        setReplies(activeTicket.replies); 
    }, [ticketId]); 

    const getStatusColors = (currentStatus) => {
        switch (currentStatus) {
            case 'Resolved': return 'bg-green-200 text-green-800 border-green-300';
            case 'Open': return 'bg-red-200 text-red-800 border-red-300';
            case 'Processing': return 'bg-teal-200 text-teal-800 border-teal-300';
            case 'Pending': return 'bg-yellow-200 text-yellow-800 border-yellow-300';
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


    const actionBoxBaseClass = "w-full flex items-center gap-3 px-4 py-2.5 rounded border text-sm font-medium transition-colors min-h-[44px]";

    return (
        <div className="w-full font-text text-foreground flex flex-col lg:flex-row gap-8 min-h-full">
            
            <div className="flex-1 flex flex-col">
                <div className="mb-6">
                    <div className="inline-block bg-[#3b5949]/10 text-[#3b5949] px-3 py-1 rounded-full text-xs font-bold mb-3 border border-[#3b5949]/20">
                        TICKET #{cleanId}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-zinc-800 mb-2">“{activeTicket.subject}”</h1>
                    <p className="text-lg text-zinc-600">Type of Inquiry: {activeTicket.type}</p>
                </div>

                <div className="flex flex-col gap-6 mb-8">
                    {/* Maps through our dynamic 'replies' state instead of static data */}
                    {replies.map((reply) => (
                        <div key={reply.id} className="relative group flex gap-4">
                            
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="bg-zinc-200/70 p-5 rounded-md text-sm text-zinc-800 leading-relaxed relative">
                                    <p>{reply.content}</p>
                                </div>

                                <div className="flex justify-between items-start gap-4 text-xs text-zinc-500">
                                    <div>
                                        {reply.attachment && (
                                            <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-600 cursor-pointer hover:bg-zinc-50 transition-colors">
                                                {reply.attachment}
                                                <Download size={14} className="text-zinc-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-zinc-700">{reply.author}</p>
                                        <p>{reply.date}</p>
                                        {reply.isEdited && <p>Edited: {reply.editDate}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="relative pt-2">
                                <button onClick={() => setActiveMessageMenu(activeMessageMenu === reply.id ? null : reply.id)} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal size={20} />
                                </button>
                                {activeMessageMenu === reply.id && (
                                    <div className="absolute right-0 top-10 bg-white border border-zinc-200 shadow-md rounded-sm w-28 z-10 overflow-hidden text-sm">
                                        {/* Wired up Edit and Delete Placeholders */}
                                        <button onClick={() => handleEditReply(reply.id)} className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-600"><Pencil size={14} /> Edit</button>
                                        <button onClick={() => handleDeleteReply(reply.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-zinc-100"><Trash2 size={14} /> Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto bg-zinc-100 p-4 rounded-md flex flex-col gap-3 border border-zinc-200">
                    <textarea 
                        value={replyText} 
                        onChange={(e) => setReplyText(e.target.value)} 
                        placeholder="Add a reply..." 
                        className="w-full p-4 bg-white rounded-md border border-zinc-300 text-sm outline-none focus:border-[#3b5949] min-h-[100px] resize-y" 
                    />
                    <div className="flex justify-between items-center">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-md text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm">
                            <Upload size={14} /> 
                            Click to upload file...
                        </button>
                        {/* Wired up Post Placeholder */}
                        <button onClick={handlePostReply} className="bg-[#8fae9d] hover:bg-[#7b9988] text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm">
                            Post
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-72">
                <div className="bg-white rounded-md shadow-sm border border-zinc-300 sticky top-8 z-10">
                    <div className="bg-zinc-100 border-b border-zinc-300 py-3 text-center rounded-t-md">
                        <h3 className="font-semibold text-zinc-800 text-lg">Actions</h3>
                    </div>
                    <div className="p-4 flex flex-col gap-3">
                        <button onClick={handleToggleAssignment} className={`${actionBoxBaseClass} text-left ${assignmentState === 'me' ? 'bg-[#3b5949] text-white border-[#3b5949]' : assignmentState === 'other' ? 'bg-zinc-100 text-zinc-400 border-zinc-300 cursor-not-allowed' : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-300'}`}>
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
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-zinc-300 shadow-xl rounded overflow-hidden z-30 text-sm">
                                    {['Open', 'Pending', 'Processing', 'Resolved'].map((opt) => (
                                        <button key={opt} onClick={() => handleStatusChange(opt)} className={`w-full text-left px-4 py-2.5 hover:opacity-80 transition-opacity font-medium ${getStatusColors(opt)} border-none rounded-none`}>{opt}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}