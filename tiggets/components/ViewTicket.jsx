// for customer
'use client';

import { useState } from 'react';
import { Download, Edit, MoreHorizontal, Trash2, Upload, X } from 'lucide-react';

// Mock data - will be replaced with API calls
const mockTicketData = {
    id: '0142069',
    title: "HELP I CAN'T DO THIS ANYMORE",
    typeOfInquiry: 'Application for Leave of Absence (LOA)',
    status: 'Processing',
    description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    author: 'Angelica Therese | Clavano',
    createdAt: 'March 29, 2026 11:16PM',
    attachment: 'PretendThisIsADownloadIcon.pdf',
    replies: [
        {
            id: 1,
            author: 'Olajide Olayinka Williams Olatunji',
            content:
                'Aye bruh ion think I can handle this. Imma close this ticket gng.',
            createdAt: 'March 30, 2026 12:42AM',
            editedAt: 'March 31, 2026 2:00PM',
            isAuthorReply: false,
        },
    ],
};

const statusClasses = {
    Processing: 'bg-cyan-200 text-cyan-900 border-cyan-300',
    Open: 'bg-rose-300 text-rose-900 border-rose-400',
    Pending: 'bg-amber-200 text-amber-900 border-amber-400',
    Resolved: 'bg-green-300 text-green-900 border-green-400',
};

function StatusBadge({ status }) {
    return (
        <span
            className={`rounded-full border px-4 py-1 text-sm font-medium ${
                statusClasses[status] ?? 'bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}
        >
            {status}
        </span>
    );
}

function TicketDescription({
    ticket,
    onMarkSolved,
    canEditBody,
    isEditingBody,
    editedBody,
    onEditedBodyChange,
    onStartEditBody,
    onCancelEditBody,
    onSaveEditBody,
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-zinc-800 mb-2">&quot;{ticket.title}&quot;</h1>
                    <p className="text-lg text-zinc-600">Type of Inquiry: {ticket.typeOfInquiry}</p>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={ticket.status} />
                    {ticket.status !== 'Resolved' && !isEditingBody && (
                        <button
                            onClick={onMarkSolved}
                            className="flex items-center gap-2 rounded-lg bg-green-500 text-white px-4 py-2 font-medium hover:bg-green-600 transition"
                        >
                            ✓ Mark as Resolved
                        </button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-gray-200 p-4 space-y-3">
                {isEditingBody ? (
                    <textarea
                        value={editedBody}
                        onChange={(e) => onEditedBodyChange(e.target.value)}
                        rows="5"
                        className="w-full rounded-lg border border-zinc-300 p-3 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ) : (
                    <p className="text-zinc-700 leading-relaxed">{ticket.description}</p>
                )}

                {canEditBody && (
                    <div className="flex justify-end gap-2">
                        {isEditingBody ? (
                            <>
                                <button
                                    onClick={onCancelEditBody}
                                    className="px-4 py-2 rounded-lg bg-zinc-200 text-zinc-800 hover:bg-zinc-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onSaveEditBody}
                                    disabled={!editedBody.trim()}
                                    className="px-4 py-2 rounded-lg bg-tiggets-lightgreen text-white hover:bg-[#2b4a3c] disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onStartEditBody}
                                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-zinc-700 border border-zinc-300 hover:bg-zinc-50 transition"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Body
                            </button>
                        )}
                    </div>
                )}
            </div>

            {ticket.attachment && (
                <button
                    type="button"
                    className="flex items-center gap-2 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition"
                    aria-label={`Download attachment ${ticket.attachment}`}
                >
                    <Download className="h-4 w-4" />
                    <span>{ticket.attachment}</span>
                </button>
            )}

            <div className="flex justify-end text-sm text-zinc-500">
                <div>
                    <p className="font-medium">{ticket.author}</p>
                    <p>{ticket.createdAt}</p>
                </div>
            </div>
        </div>
    );
}

function Reply({ reply, isCurrentUserAuthor, canManageReplies, onEdit, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(reply.content);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

    const handleSaveEdit = () => {
        onEdit(reply.id, editedContent);
        setIsEditing(false);
        setIsActionsMenuOpen(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(reply.content);
        setIsEditing(false);
        setIsActionsMenuOpen(false);
    };

    return (
        <div className="space-y-3 bg-gray-200 p-4 rounded-lg">
            {isEditing && canManageReplies ? (
                <div className="space-y-3">
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="4"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-zinc-800 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 rounded-lg bg-tiggets-lightgreen text-white hover:bg-[#2b4a3c] transition"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-medium text-zinc-800">{reply.author}</p>
                            <p className="text-sm text-zinc-600">{reply.createdAt}</p>
                            {reply.editedAt && (
                                <p className="text-xs text-zinc-500 mt-1">Edited: {reply.editedAt}</p>
                            )}
                        </div>
                        {isCurrentUserAuthor && canManageReplies && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsActionsMenuOpen((prev) => !prev)}
                                    className="p-2 hover:bg-gray-300 rounded transition"
                                    aria-label="Reply options"
                                >
                                    <MoreHorizontal className="h-4 w-4 text-zinc-600" />
                                </button>

                                {isActionsMenuOpen && (
                                    <div className="absolute right-0 top-10 bg-white border border-zinc-200 shadow-md rounded-sm w-28 z-10 overflow-hidden text-sm">
                                        <button
                                            onClick={() => {
                                                setEditedContent(reply.content);
                                                setIsEditing(true);
                                                setIsActionsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex items-center gap-2 text-zinc-600"
                                        >
                                            <Edit className="h-3.5 w-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                onDelete(reply.id);
                                                setIsActionsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-zinc-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-zinc-700 leading-relaxed">{reply.content}</p>
                </>
            )}
        </div>
    );
}

function ReplyComposer({ onSubmit, isDisabled }) {
    const [replyContent, setReplyContent] = useState('');
    const [attachment, setAttachment] = useState(null);

    const handleSubmit = () => {
        if (replyContent.trim()) {
            onSubmit(replyContent, attachment);
            setReplyContent('');
            setAttachment(null);
        }
    };

    return (
        <div className="space-y-3 bg-white border border-zinc-200 rounded-lg p-4">
            <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Add a reply..."
                disabled={isDisabled}
                className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows="4"
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        disabled={isDisabled}
                        className="flex items-center gap-2 px-4 py-2 text-zinc-600 border border-zinc-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Upload className="h-4 w-4" />
                        Click to upload file...
                    </button>
                    {attachment && (
                        <div className="flex items-center gap-2 text-sm text-zinc-600 bg-gray-100 px-3 py-1 rounded">
                            {attachment}
                            <button
                                onClick={() => setAttachment(null)}
                                className="hover:text-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isDisabled || !replyContent.trim()}
                    className="px-6 py-2 bg-tiggets-lightgreen text-white rounded-lg hover:bg-[#2b4a3c] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                    Post
                </button>
            </div>
        </div>
    );
}

export default function ViewTicket({ ticketId }) {
    const [ticket, setTicket] = useState({
        ...mockTicketData,
        id: ticketId || mockTicketData.id,
    });
    const [replies, setReplies] = useState(mockTicketData.replies);
    const [isEditingBody, setIsEditingBody] = useState(false);
    const [editedBody, setEditedBody] = useState(mockTicketData.description);

    const canEditBody = ticket.status === 'Open';
    const canManageReplies = ticket.status !== 'Resolved';

    const handleMarkSolved = () => {
        const hasConfirmed = window.confirm(
            'Mark this ticket as resolved? You can no longer edit the body or reply after resolving it.'
        );

        if (!hasConfirmed) {
            return;
        }

        setTicket((prev) => ({
            ...prev,
            status: 'Resolved',
        }));
        setIsEditingBody(false);
    };

    const handleStartEditBody = () => {
        if (!canEditBody) {
            return;
        }
        setEditedBody(ticket.description);
        setIsEditingBody(true);
    };

    const handleCancelEditBody = () => {
        setEditedBody(ticket.description);
        setIsEditingBody(false);
    };

    const handleSaveEditBody = () => {
        const nextBody = editedBody.trim();
        if (!nextBody) {
            return;
        }

        setTicket((prev) => ({
            ...prev,
            description: nextBody,
        }));
        setIsEditingBody(false);
    };

    const handleAddReply = (content, attachment) => {
        if (!canManageReplies) {
            return;
        }

        const newReply = {
            id: Math.max(...replies.map((r) => r.id), 0) + 1,
            author: 'Current User',
            content,
            attachment,
            createdAt: new Date().toLocaleString(),
            editedAt: null,
            isAuthorReply: true,
        };
        setReplies((prev) => [...prev, newReply]);
    };

    const handleEditReply = (replyId, newContent) => {
        if (!canManageReplies) {
            return;
        }

        setReplies((prev) =>
            prev.map((reply) =>
                reply.id === replyId
                    ? { ...reply, content: newContent, editedAt: new Date().toLocaleString() }
                    : reply
            )
        );
    };

    const handleDeleteReply = (replyId) => {
        if (!canManageReplies) {
            return;
        }

        setReplies((prev) => prev.filter((reply) => reply.id !== replyId));
    };

    return (
        <main className="space-y-6">
            <TicketDescription
                ticket={ticket}
                onMarkSolved={handleMarkSolved}
                canEditBody={canEditBody}
                isEditingBody={isEditingBody}
                editedBody={editedBody}
                onEditedBodyChange={setEditedBody}
                onStartEditBody={handleStartEditBody}
                onCancelEditBody={handleCancelEditBody}
                onSaveEditBody={handleSaveEditBody}
            />

            <div className="border-t border-zinc-200 pt-6">
                <h2 className="text-xl font-bold text-zinc-800 mb-4">Replies</h2>

                <div className="rounded-lg border border-zinc-200 bg-gray-100 p-4">
                    <div className="space-y-4">
                        {replies.map((reply) => (
                            <Reply
                                key={reply.id}
                                reply={reply}
                                isCurrentUserAuthor={reply.isAuthorReply}
                                canManageReplies={canManageReplies}
                                onEdit={handleEditReply}
                                onDelete={handleDeleteReply}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-zinc-200 pt-6">
                <h2 className="text-xl font-bold text-zinc-800 mb-4">Add Reply</h2>
                <ReplyComposer onSubmit={handleAddReply} isDisabled={!canManageReplies} />
            </div>
        </main>
    );
}
