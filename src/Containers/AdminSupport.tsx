import { useEffect, useState, useRef } from "react";

import {
  HelpCircle,
  Send,
  Paperclip,
  ChevronLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  X,
  RefreshCw,
  Search,
  SlidersHorizontal,
  User,
  MessageSquare,
} from "lucide-react";
import axios from "axios";

import { useSupportStore } from "../State/support";
import { useSupportSocket } from "../Hooks/useSupportSocket";
import { supportApi, type Attachment } from "../Services/supportApi";
import { Button } from "../Components/Atoms/button";
import { Badge } from "../Components/Atoms/badge";
import { Input } from "../Components/Atoms/input";
import { cn } from "../Helpers/utils";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "payment", label: "Payment / Wallet" },
  { value: "bot_error", label: "Bot Error" },
  { value: "account", label: "Account" },
  { value: "kyc", label: "KYC Verification" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "pending_admin", label: "Pending Admin" },
  { value: "pending_user", label: "Pending User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function AdminSupport() {
  // Store actions & state
  const {
    adminTickets,
    adminTicketsTotal,
    currentThread,
    isLoading,
    fetchAdminTickets,
    fetchAdminTicketThread,
    postAdminMessage,
    updateTicketStatus,
    markReadByAdmin,
  } = useSupportStore();

  // Local query states
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // Chat message states
  const [newMessageText, setNewMessageText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Socket
  const { joinTicket, leaveTicket } = useSupportSocket(activeTicketId || undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentThread?.messages) {
      scrollToBottom();
    }
  }, [currentThread?.messages]);

  // Fetch admin list
  const loadQueue = () => {
    fetchAdminTickets({
      status: status || undefined,
      priority: priority || undefined,
      category: category || undefined,
      search: search || undefined,
      page,
      limit: 20,
    });
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, category, page, fetchAdminTickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadQueue();
  };

  const handleSelectTicket = (ticketId: string) => {
    if (activeTicketId) {
      leaveTicket(activeTicketId);
    }
    setActiveTicketId(ticketId);
    fetchAdminTicketThread(ticketId);
    markReadByAdmin(ticketId);
    joinTicket(ticketId);
  };

  // Active thread polling fallback (5 seconds)
  useEffect(() => {
    if (!activeTicketId) return;

    const interval = setInterval(() => {
      fetchAdminTicketThread(activeTicketId);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTicketId, fetchAdminTicketThread]);

  // Pagination cursor load older
  const handleLoadOlder = async () => {
    if (!currentThread || !currentThread.pagination.hasMore || isPaginationLoading) return;
    setIsPaginationLoading(true);
    try {
      await fetchAdminTicketThread(currentThread.ticket._id || currentThread.ticket.id, currentThread.pagination.oldestCursor || undefined);
    } finally {
      setIsPaginationLoading(false);
    }
  };

  // S3 Presigned Attachment Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      alert("You can upload at most 5 attachments per message.");
      return;
    }

    setIsUploading(true);
    const newAttachments = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      try {
        const { uploadUrl, fields, objectUrl, key } = await supportApi.requestUploadUrl(
          file.type || "application/octet-stream",
          file.name
        );

        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          formData.append(k, v as string);
        });
        formData.append("file", file);

        await axios.post(uploadUrl, formData);

        newAttachments.push({
          url: objectUrl,
          key: key,
          contentType: file.type || "application/octet-stream",
          name: file.name,
        });
      } catch (err) {
        console.error("Attachment upload failed:", err);
        alert(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    setAttachments(newAttachments);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Send admin reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId) return;
    if (!newMessageText.trim() && attachments.length === 0) return;

    setSendError(null);
    const body = newMessageText;
    const currentAttachments = [...attachments];

    setNewMessageText("");
    setAttachments([]);

    try {
      await postAdminMessage(activeTicketId, {
        body,
        attachments: currentAttachments,
      });
      fetchAdminTicketThread(activeTicketId);
    } catch (err: unknown) {
      setSendError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to send message.");
      setNewMessageText(body);
      setAttachments(currentAttachments);
    }
  };

  // Update status/priority dropdowns
  const handleStatusChange = async (newStatus: string) => {
    if (!activeTicketId) return;
    try {
      await updateTicketStatus(activeTicketId, { status: newStatus });
      loadQueue();
    } catch {
      alert("Failed to update status");
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!activeTicketId) return;
    try {
      await updateTicketStatus(activeTicketId, { priority: newPriority });
      loadQueue();
    } catch {
      alert("Failed to update priority");
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const totalPages = Math.ceil(adminTicketsTotal / 20);

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Search and Filters Header */}
      <div className="bg-card border border-border/40 p-4 rounded-2xl shadow-md shrink-0 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Support Queue
              <HelpCircle className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">
              Review and respond to client-filed support tickets in real-time.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket # or subject..."
                className="pl-9 bg-muted/30 border-border/40 text-xs h-9 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold h-9 rounded-xl"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/20 pt-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1" />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border/40 bg-muted/20 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none"
          >
            {STATUSES.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-popover text-foreground">
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border/40 bg-muted/20 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none"
          >
            {PRIORITIES.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-popover text-foreground">
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-border/40 bg-muted/20 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none"
          >
            {CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-popover text-foreground">
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setStatus("");
              setPriority("");
              setCategory("");
              setSearch("");
              setPage(1);
            }}
            className="text-[11px] font-mono font-bold text-primary hover:underline ml-auto"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Support Workspace */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Left Side: Ticket queue list */}
        <div
          className={cn(
            "w-full md:w-80 bg-card border border-border/40 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0",
            activeTicketId ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-3 bg-muted/10 border-b border-border/20 flex items-center justify-between shrink-0 font-mono text-[10px] font-bold text-muted-foreground uppercase">
            <span>Ticket Queue ({adminTicketsTotal})</span>
            <button onClick={loadQueue} className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 select-none">
            {isLoading && adminTickets.length === 0 ? (
              <div className="space-y-2 p-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-muted/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : adminTickets.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-foreground font-semibold">No tickets found</p>
                <p className="text-[10px] text-muted-foreground max-w-[180px] mx-auto leading-normal">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              adminTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket.id)}
                  className={cn(
                    "p-3 rounded-xl border border-border/10 cursor-pointer transition-all hover:bg-muted/30 relative flex flex-col gap-1.5",
                    activeTicketId === ticket.id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/10 hover:border-border/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {ticket.ticketNumber}
                    </span>
                    <Badge
                      className={cn(
                        "font-mono text-[9px] px-1.5 py-0.2 border uppercase",
                        ticket.status === "open"
                          ? "text-emerald-400 border-emerald-400/20 bg-emerald-500/10"
                          : ticket.status === "pending_admin"
                            ? "text-sky-400 border-sky-400/20 bg-sky-500/10"
                            : ticket.status === "pending_user"
                              ? "text-amber-400 border-amber-400/20 bg-amber-500/10"
                              : "text-muted-foreground border-border/40 bg-muted/25"
                      )}
                    >
                      {ticket.status?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                    {ticket.subject}
                  </p>

                  {/* User info & unread indicator */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="truncate max-w-[120px]">{ticket.owner?.email}</span>
                    <div className="flex items-center gap-1.5">
                      <span>{formatDate(ticket.lastMessageAt)}</span>
                      {ticket.unreadFromUser > 0 && (
                        <span className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">
                          {ticket.unreadFromUser}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Simple pagination footer */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-border/20 flex items-center justify-between shrink-0 font-mono text-[10px]">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-6 px-2 text-[10px] rounded-lg"
              >
                Prev
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-6 px-2 text-[10px] rounded-lg"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Conversation view */}
        <div
          className={cn(
            "flex-1 bg-card border border-border/40 rounded-2xl flex flex-col overflow-hidden shadow-sm",
            !activeTicketId ? "hidden md:flex items-center justify-center" : "flex"
          )}
        >
          {activeTicketId ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-border/20 bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTicketId(null)}
                    className="md:hidden p-1.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {currentThread?.ticket?.ticketNumber}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">•</span>
                      <span className="text-xs font-semibold text-foreground">
                        {currentThread?.ticket?.subject}
                      </span>
                    </div>
                    {/* User Profile */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 font-mono">
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {currentThread?.ticket?.owner?.firstName} {currentThread?.ticket?.owner?.lastName} ({currentThread?.ticket?.owner?.email})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Priority select menus */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground">Status</span>
                    <select
                      value={currentThread?.ticket?.status || ""}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="rounded-xl border border-border/40 bg-muted/20 px-2 py-1 text-xs text-foreground focus-visible:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="pending_admin">Pending Admin</option>
                      <option value="pending_user">Pending User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground">Priority</span>
                    <select
                      value={currentThread?.ticket?.priority || ""}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className="rounded-xl border border-border/40 bg-muted/20 px-2 py-1 text-xs text-foreground focus-visible:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chat Thread Messages Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                {currentThread?.pagination?.hasMore && (
                  <div className="flex justify-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadOlder}
                      disabled={isPaginationLoading}
                      className="text-[10px] font-mono font-bold h-7 rounded-lg"
                    >
                      {isPaginationLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : null}
                      Load older messages
                    </Button>
                  </div>
                )}

                {/* Context panel if provided */}
                {currentThread?.ticket?.context && (currentThread?.ticket?.context?.errorCode || currentThread?.ticket?.context?.instanceId) && (
                  <div className="p-3 bg-muted/40 border border-border/20 rounded-xl space-y-1 font-mono text-[10px] text-muted-foreground">
                    <p className="font-bold text-foreground">TECHNICAL CONTEXT</p>
                    {currentThread.ticket.context.errorCode && (
                      <p>Error Code: <span className="text-rose-400 font-bold">{currentThread.ticket.context.errorCode}</span></p>
                    )}
                    {currentThread.ticket.context.instanceId && (
                      <p>Bot Instance: <span className="text-cyan-400">{currentThread.ticket.context.instanceId}</span></p>
                    )}
                    {currentThread.ticket.context.screen && (
                      <p>Screen Path: {currentThread.ticket.context.screen}</p>
                    )}
                    {currentThread.ticket.context.occurredAt && (
                      <p>Occurred: {new Date(currentThread.ticket.context.occurredAt).toLocaleString()}</p>
                    )}
                  </div>
                )}

                {currentThread?.messages?.map((msg, idx) => {
                  const isMe = msg.senderType === "admin";
                  return (
                    <div
                      key={msg._id || msg.id || idx}
                      className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      <span className="text-[9px] font-mono text-muted-foreground mb-1">
                        {isMe ? "You (Operator)" : `${currentThread?.ticket?.owner?.firstName || "Client"} (${msg.senderType})`} • {formatTime(msg.createdAt)}
                      </span>

                      <div
                        className={cn(
                          "px-3.5 py-2.5 rounded-2xl shadow-sm text-xs font-medium break-words whitespace-pre-wrap leading-relaxed",
                          isMe
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-card text-foreground border border-border/40 rounded-tl-none"
                        )}
                      >
                        <p>{msg.body}</p>

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2.5 space-y-1.5 border-t border-white/20 pt-2">
                            {msg.attachments.map((attach: Attachment & { name?: string }, aIdx: number) => {
                              const isImage = attach.contentType?.startsWith("image/");
                              return (
                                <a
                                  key={aIdx}
                                  href={attach.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "flex items-center gap-2 p-1.5 rounded-lg text-[10px] transition-colors",
                                    isMe
                                      ? "bg-white/10 hover:bg-white/20 text-white"
                                      : "bg-muted hover:bg-muted/80 text-foreground"
                                  )}
                                >
                                  {isImage ? (
                                    <div className="w-10 h-10 rounded overflow-hidden shrink-0 border border-white/10 bg-black/20">
                                      <img
                                        src={attach.url}
                                        alt={attach.name || "Attachment"}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <FileText className="w-4 h-4 shrink-0" />
                                  )}
                                  <span className="truncate max-w-[140px] font-mono">
                                    {attach.name || attach.key.split("/").pop()}
                                  </span>
                                  <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Thread Input Form */}
              <div className="p-3 bg-card border-t border-border/30 shrink-0">
                {sendError && (
                  <div className="mb-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/20 border border-border/10 rounded-xl">
                    {attachments.map((attach, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-card border border-border/40 px-2 py-1 rounded-lg text-[10px] font-mono text-foreground"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{attach.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="hover:text-destructive text-muted-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 w-9 rounded-xl border-border/40 shrink-0"
                    title="Attach files"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>

                  <Input
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 bg-muted/40 border-border/40 h-9 rounded-xl text-xs"
                  />

                  <Button
                    type="submit"
                    disabled={!newMessageText.trim() && attachments.length === 0}
                    className="bg-primary hover:bg-primary/95 text-white h-9 w-9 p-0 rounded-xl shrink-0 shadow-md flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="py-20 text-center space-y-3 font-sans">
              <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground text-sm font-semibold">No Ticket Selected</p>
              <p className="text-xs text-muted-foreground/60 max-w-[280px] mx-auto leading-normal">
                Choose a ticket from the queue on the left to read user details or write replies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
