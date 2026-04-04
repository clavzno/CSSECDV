// for customer
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Edit, MoreHorizontal, Trash2, Upload, X } from 'lucide-react';

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
    const [attachments, setAttachments] = useState([]);
    const fileInputRef = useRef(null);

    const handleSubmit = () => {
        if (replyContent.trim()) {
            onSubmit(replyContent, attachments);
            setReplyContent('');
            setAttachments([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFilesSelected = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        setAttachments((prev) => [...prev, ...files.map((file) => file.name)]);
        event.target.value = '';
    };

    const removeAttachment = (indexToRemove) => {
        setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
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
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFilesSelected}
                        className="hidden"
                    />
                    <button
                        disabled={isDisabled}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 text-zinc-600 border border-zinc-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Upload className="h-4 w-4" />
                        Click to upload file...
                    </button>
                    {attachments.map((attachmentName, index) => (
                        <div key={`${attachmentName}-${index}`} className="flex items-center gap-2 text-sm text-zinc-600 bg-gray-100 px-3 py-1 rounded">
                            {attachmentName}
                            <button
                                onClick={() => removeAttachment(index)}
                                className="hover:text-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
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

export default function ViewTicket({ ticketId, ticket: ticketData, currentUserId }) {
    const router = useRouter();

    const normalizeTicketForCustomerView = (sourceTicket) => {
        const baseTicket = sourceTicket ?? {};

        return {
            id: String(baseTicket.id ?? ticketId ?? ''),
            title: String(baseTicket.subject ?? baseTicket.title ?? ''),
            typeOfInquiry: String(baseTicket.type ?? baseTicket.typeOfInquiry ?? ''),
            status: String(baseTicket.status ?? 'Open'),
            description: String(baseTicket.description ?? baseTicket.body ?? ''),
            author: String(baseTicket.author ?? ''),
            createdAt: String(baseTicket.createdAt ?? ''),
            attachment: baseTicket.attachment ?? null,
            replies: Array.isArray(baseTicket.replies)
                ? baseTicket.replies.map((reply) => {
                    const replyAuthorId = String(reply.authorId ?? '');
                    const replyAttachments = Array.isArray(reply.attachments)
                        ? reply.attachments.map((item) => String(item))
                        : [];

                    return {
                        id: String(reply.id ?? ''),
                        author: String(reply.author ?? ''),
                        content: String(reply.content ?? ''),
                        createdAt: String(reply.date ?? reply.createdAt ?? ''),
                        editedAt: reply.isEdited
                            ? String(reply.editDate ?? reply.editedAt ?? '')
                            : null,
                        attachment: reply.attachment ?? (replyAttachments[0] ?? null),
                        attachments: replyAttachments,
                        isAuthorReply:
                            replyAuthorId.length > 0 &&
                            replyAuthorId === String(currentUserId ?? ''),
                    };
                })
                : [],
        };
    };

    const initialTicket = normalizeTicketForCustomerView(ticketData);

    const [ticket, setTicket] = useState(initialTicket);
    const [replies, setReplies] = useState(initialTicket.replies);
    const [isEditingBody, setIsEditingBody] = useState(false);
    const [editedBody, setEditedBody] = useState(initialTicket.description);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const cleanId = String(ticket.id ?? ticketId ?? '').replace(/^#/, '');
    const ticketApiPath = `/api/tickets/%23${encodeURIComponent(cleanId)}`;

    const canEditBody = ticket.status === 'Open';
    const canManageReplies = ticket.status !== 'Resolved';

    useEffect(() => {
        const nextTicket = normalizeTicketForCustomerView(ticketData);
        setTicket(nextTicket);
        setReplies(nextTicket.replies);
        setEditedBody(nextTicket.description);
    }, [ticketData]);

    const handleMarkSolved = async () => {
        const hasConfirmed = window.confirm(
            'Mark this ticket as resolved? You can no longer edit the body or reply after resolving it.'
        );

        if (!hasConfirmed) {
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(ticketApiPath, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Resolved' }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to mark ticket as resolved.');
            }

            setTicket((prev) => ({ ...prev, status: 'Resolved' }));
            setIsEditingBody(false);
            router.refresh();
        } catch (err) {
            setError(err.message || 'Failed to mark ticket as resolved.');
        } finally {
            setIsSaving(false);
        }
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

    const handleSaveEditBody = async () => {
        const nextBody = editedBody.trim();
        if (!nextBody) {
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(ticketApiPath, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: nextBody }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update ticket body.');
            }

            setTicket((prev) => ({
                ...prev,
                description: nextBody,
            }));
            setIsEditingBody(false);
            router.refresh();
        } catch (err) {
            setError(err.message || 'Failed to update ticket body.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddReply = async (content, attachments) => {
        if (!canManageReplies) {
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(ticketApiPath, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newMessage: content,
                    attachments: Array.isArray(attachments) ? attachments : [],
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to add reply.');
            }

            const returnedReply = data.reply;
            const replyAttachments = Array.isArray(returnedReply?.attachments)
                ? returnedReply.attachments.map((item) => String(item))
                : [];

            const newReply = {
                id: String(returnedReply?.replyId ?? Date.now()),
                author: 'You',
                content: String(returnedReply?.message ?? content),
                attachment: replyAttachments[0] ?? null,
                attachments: replyAttachments,
                createdAt: returnedReply?.timestamp
                    ? new Date(returnedReply.timestamp).toLocaleString()
                    : new Date().toLocaleString(),
                editedAt: null,
                isAuthorReply: true,
            };

            setReplies((prev) => [...prev, newReply]);
            router.refresh();
        } catch (err) {
            setError(err.message || 'Failed to add reply.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditReply = async (replyId, newContent) => {
        if (!canManageReplies) {
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(ticketApiPath, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ replyId, message: newContent }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to edit reply.');
            }

            setReplies((prev) =>
                prev.map((reply) =>
                    reply.id === replyId
                        ? { ...reply, content: newContent, editedAt: new Date().toLocaleString() }
                        : reply
                )
            );
            router.refresh();
        } catch (err) {
            setError(err.message || 'Failed to edit reply.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteReply = async (replyId) => {
        if (!canManageReplies) {
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(ticketApiPath, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleteReplyId: replyId }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete reply.');
            }

            setReplies((prev) => prev.filter((reply) => reply.id !== replyId));
            router.refresh();
        } catch (err) {
            setError(err.message || 'Failed to delete reply.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="space-y-6">
            {error && (
                <div className="rounded bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

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
                <ReplyComposer onSubmit={handleAddReply} isDisabled={!canManageReplies || isSaving} />
            </div>
        </main>
    );
}
