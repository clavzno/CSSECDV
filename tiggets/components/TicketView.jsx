"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function TicketView({ ticketId, role, ticket, currentUserId }) {
  const router = useRouter();
  
  const cleanId = String(ticket?.id ?? ticketId ?? "").replace(/#/g, "");

  useEffect(() => {
    fetch(`/api/tickets/%23${encodeURIComponent(cleanId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastAccessedAt: new Date().toISOString() }),
    }).catch(err => console.error("Failed to update last viewed time", err));
  }, [cleanId]);
  
  const normalizedRole = role?.toLowerCase();
  const isManager = normalizedRole === "manager";
  const isAdmin = normalizedRole === "admin";
  const isStaff = isManager || isAdmin; 
  const canModifyTicket = isManager;

  const activeTicket = ticket ?? {
    id: cleanId,
    subject: `Inquiry regarding issue #${cleanId}`,
    type: "General Support Request",
    description: `This is a generic view for ticket #${cleanId}. Real data will populate here when the database is connected.`,
    status: "Pending",
    assignedTo: "unassigned",
    author: "System",
    createdAt: "Just now",
    attachment: null,
    replies: [],
  };

  const normalizedAssignedTo = String(activeTicket.assignedTo ?? "").trim();
  const normalizedCurrentUserId = String(currentUserId ?? "").trim();
  const isUnassigned =
    normalizedAssignedTo === "" ||
    normalizedAssignedTo.toUpperCase() === "N/A" ||
    normalizedAssignedTo.toLowerCase() === "null" ||
    normalizedAssignedTo.toLowerCase() === "unassigned";
  const isAssignedToCurrentManager =
    !isUnassigned && normalizedAssignedTo === normalizedCurrentUserId;
  const isAssignedToSomeoneElse =
    !isUnassigned && normalizedAssignedTo !== normalizedCurrentUserId;

  const [status, setStatus] = useState(activeTicket.status);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [assignmentState, setAssignmentState] = useState(
    isAssignedToCurrentManager
      ? "me"
      : isAssignedToSomeoneElse
        ? "other"
        : "unassigned"
  );

  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const replyFileInputRef = useRef(null);

  const getStatusColors = (currentStatus) => {
    switch (currentStatus) {
      case "Resolved":
        return "bg-green-300 text-green-900 border-green-400";
      case "Open":
        return "bg-rose-300 text-rose-900 border-rose-400";
      case "Processing":
        return "bg-cyan-200 text-cyan-900 border-cyan-300";
      case "Pending":
        return "bg-amber-200 text-amber-900 border-amber-400";
      default:
        return "bg-zinc-200 text-zinc-800 border-zinc-300";
    }
  };

  const handleToggleAssignment = async () => {
    if (!canModifyTicket) return;
    if (assignmentState !== "unassigned") return;

    try {
      const res = await fetch(`/api/tickets/%23${encodeURIComponent(cleanId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: currentUserId }),
      });

      if (res.ok) {
        setAssignmentState("me");
        router.refresh(); 
      }
    } catch (error) {
      console.error("Failed to assign ticket:", error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!canModifyTicket) return;

    try {
      const res = await fetch(`/api/tickets/%23${encodeURIComponent(cleanId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
        setIsStatusDropdownOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handlePostReply = async () => {
    if (!canModifyTicket || !replyText.trim()) return;

    try {
      const res = await fetch(`/api/tickets/%23${encodeURIComponent(cleanId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newMessage: replyText,
          attachments: replyAttachments,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setReplyAttachments([]);
        if (replyFileInputRef.current) {
          replyFileInputRef.current.value = "";
        }
        router.refresh(); 
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    }
  };

  // --- UPDATED: Convert the selected files to Base64 objects ---
  const handleReplyFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newAttachments = await Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              data: reader.result, 
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setReplyAttachments((prev) => [...prev, ...newAttachments]);
    event.target.value = "";
  };

  const removeReplyAttachment = (indexToRemove) => {
    setReplyAttachments((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleDeleteReply = async (replyId) => {
    if (!canModifyTicket) return;

    try {
      const res = await fetch(`/api/tickets/%23${encodeURIComponent(cleanId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteReplyId: replyId }), 
      });

      if (res.ok) {
        setActiveMessageMenu(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete reply:", error);
    }
  };

  const handleEditReply = async (replyId) => {
    if (!canModifyTicket) return;

    const currentMessage = activeTicket.replies.find((r) => r.id === replyId)?.content;
    const newText = window.prompt("Edit your message:", currentMessage);

    if (newText && newText !== currentMessage) {
      try {
        const res = await fetch(`/api/tickets/%23${encodeURIComponent(cleanId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replyId: replyId, message: newText }),
        });

        if (res.ok) {
          setActiveMessageMenu(null);
          router.refresh(); 
        }
      } catch (error) {
        console.error("Failed to edit reply:", error);
      }
    }
  };

  const actionBoxBaseClass =
    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors min-h-[44px]";

  const assignedLabel =
    assignmentState === "me"
      ? "You"
      : assignmentState === "other"
        ? (activeTicket.assignedToName || normalizedAssignedTo) 
        : "None";

  // --- HELPER: Safely extract attachment properties ---
  const renderAttachment = (attachment) => {
    if (!attachment) return null;
    const isObj = typeof attachment === 'object';
    const name = isObj ? attachment.name : attachment;
    const dataUrl = isObj && attachment.data ? attachment.data : '#';

    return (
      <a
        href={dataUrl}
        download={name}
        className="inline-flex cursor-pointer items-center gap-2 rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        {name}
        <Download size={14} className="text-zinc-400" />
      </a>
    );
  };

  return (
    <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium text-zinc-500">Ticket #{cleanId}</p>
              <h1 className="mb-2 text-3xl font-bold text-zinc-800">
                &quot;{activeTicket.subject}&quot;
              </h1>
              <p className="text-lg text-zinc-600">Type of Inquiry: {activeTicket.type}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-4 py-1 text-sm font-medium ${getStatusColors(
                  status
                )}`}
              >
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-gray-200 p-4">
            <p className="leading-relaxed text-zinc-700">{activeTicket.description}</p>
          </div>

          {/* MAIN TICKET ATTACHMENT */}
          {renderAttachment(activeTicket.attachment)}

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
              {activeTicket.replies.map((reply) => (
                <div key={reply.id} className="space-y-3">
                  <div className="space-y-3 rounded-lg bg-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-zinc-800">{reply.author}</p>
                        <p className="text-sm text-zinc-600">{reply.date}</p>
                        {reply.isEdited && reply.editDate && (
                          <p className="mt-1 text-xs text-zinc-500">Edited: {reply.editDate}</p>
                        )}
                      </div>

                      {(canModifyTicket && reply.authorId === currentUserId) && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMessageMenu(
                                activeMessageMenu === reply.id ? null : reply.id
                              )
                            }
                            className="rounded p-2 transition hover:bg-gray-300"
                            aria-label="Manage reply"
                          >
                            <MoreHorizontal className="h-4 w-4 text-zinc-600" />
                          </button>

                          {activeMessageMenu === reply.id && (
                            <div className="absolute right-0 top-10 z-10 w-28 overflow-hidden rounded-sm border border-zinc-200 bg-white text-sm shadow-md">
                              <button
                                onClick={() => handleEditReply(reply.id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-zinc-600 hover:bg-zinc-100"
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="flex w-full items-center gap-2 border-t border-zinc-100 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="leading-relaxed text-zinc-700">{reply.content}</p>
                  </div>

                  {/* REPLY ATTACHMENTS */}
                  {renderAttachment(reply.attachment)}
                  
                </div>
              ))}
            </div>
          </div>
        </div>

        {canModifyTicket && (
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
                <div className="flex items-center gap-2">
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    multiple
                    onChange={handleReplyFilesSelected}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-600 transition hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    Click to upload file...
                  </button>

                  {/* DRAFT ATTACHMENTS */}
                  {replyAttachments.map((attachment, index) => (
                    <div
                      key={`${attachment.name}-${index}`}
                      className="flex items-center gap-2 rounded bg-gray-100 px-3 py-1 text-xs text-zinc-600"
                    >
                      {attachment.name}
                      <button
                        type="button"
                        onClick={() => removeReplyAttachment(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handlePostReply}
                  disabled={!replyText.trim() && replyAttachments.length === 0}
                  className="rounded-lg bg-tiggets-lightgreen px-6 py-2 font-medium text-white transition hover:bg-[#2b4a3c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className="w-full lg:w-72">
        <div className="sticky top-8 rounded-lg border border-zinc-300 bg-white shadow-sm">
          <div className="rounded-t-lg border-b border-zinc-300 bg-zinc-100 py-3 text-center">
            <h3 className="text-lg font-semibold text-zinc-800">
              {isAdmin ? "Ticket Details" : "Actions"}
            </h3>
          </div>

          <div className="flex flex-col gap-3 p-4">
            {canModifyTicket ? (
              <>
                <button
                  onClick={handleToggleAssignment}
                  className={`${actionBoxBaseClass} text-left ${assignmentState === "me"
                    ? "border-[#3b5949] bg-[#3b5949] text-white"
                    : assignmentState === "other"
                      ? "cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400"
                      : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"}`}
                >
                  {assignmentState === "me" ? (
                    <CheckCircle2 size={16} />
                  ) : assignmentState === "other" ? (
                    <XCircle size={16} />
                  ) : (
                    <CheckCircle2 size={16} className="opacity-50" />
                  )}
                  {assignmentState === "me"
                    ? "You are assigned."
                    : assignmentState === "other"
                      ? "Someone is already assigned."
                      : "Assign Yourself"}
                </button>

                <div
                  className={`${actionBoxBaseClass} ${assignmentState === "me"
                    ? "border-[#3b5949] bg-[#3b5949] text-white"
                    : "border-zinc-300 bg-white text-zinc-600"
                    }`}
                >
                  <User size={16} />
                  {assignedLabel}
                </div>

                <div className="relative z-20">
                  <button
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className={`${actionBoxBaseClass} justify-between ${getStatusColors(status)}`}
                  >
                    <div className="flex items-center gap-2">
                      <Info size={16} /> Status: {status}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-zinc-300 bg-white text-sm shadow-xl">
                      {["Open", "Pending", "Processing", "Resolved"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleStatusChange(opt)}
                          className={`w-full rounded-none border-none px-4 py-2.5 text-left font-medium transition-opacity hover:opacity-80 ${getStatusColors(
                            opt
                          )}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={`${actionBoxBaseClass} border-zinc-300 bg-white text-zinc-600`}>
                  <User size={16} />
                  {assignedLabel}
                </div>

                <div className={`${actionBoxBaseClass} justify-between ${getStatusColors(status)}`}>
                  <div className="flex items-center gap-2">
                    <Info size={16} /> Status: {status}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </main>
  );
}