import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Send,
  Paperclip,
  ChevronLeft,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  X,
  RefreshCw,
  MessageSquare,
  Lock,
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
  { value: "payment", label: "Payment / Wallet" },
  { value: "bot_error", label: "Bot Error" },
  { value: "account", label: "Account" },
  { value: "kyc", label: "KYC Verification" },
  { value: "other", label: "Other" },
];

export function Support() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Store actions & state
  const {
    userTickets,
    currentThread,
    isLoading,
    fetchUserTickets,
    fetchTicketThread,
    createTicket,
    postUserMessage,
    markReadByUser,
    clearCurrentThread,
  } = useSupportStore();

  // Local state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(() => {
    return !!(searchParams.get("instanceId") || searchParams.get("errorCode") || searchParams.get("screen"));
  });
  const [subject, setSubject] = useState(() => {
    const errorCode = searchParams.get("errorCode");
    const screen = searchParams.get("screen");
    if (searchParams.get("instanceId") || errorCode || screen) {
      return `Issue Report: ${errorCode || "Error"} on ${screen || "App"}`;
    }
    return "";
  });
  const [category, setCategory] = useState(() => {
    if (searchParams.get("instanceId") || searchParams.get("errorCode") || searchParams.get("screen")) {
      return "bot_error";
    }
    return "other";
  });
  const [initialMessage, setInitialMessage] = useState(() => {
    const instanceId = searchParams.get("instanceId");
    const errorCode = searchParams.get("errorCode");
    const screen = searchParams.get("screen");
    if (instanceId || errorCode || screen) {
      return (
        `I encountered an issue on screen: ${screen || "N/A"}.\n` +
        `Instance ID: ${instanceId || "N/A"}\n` +
        `Error Code: ${errorCode || "N/A"}\n` +
        `Occurred at: ${new Date().toLocaleString()}`
      );
    }
    return "";
  });
  const [newMessageText, setNewMessageText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [ticketContext, setTicketContext] = useState<{
    instanceId?: string;
    errorCode?: string;
    screen?: string;
    occurredAt?: string;
  } | null>(() => {
    const instanceId = searchParams.get("instanceId");
    const errorCode = searchParams.get("errorCode");
    const screen = searchParams.get("screen");
    if (instanceId || errorCode || screen) {
      return {
        instanceId: instanceId || undefined,
        errorCode: errorCode || undefined,
        screen: screen || undefined,
        occurredAt: new Date().toISOString(),
      };
    }
    return null;
  });
  const [now] = useState(() => Date.now());

  // Pagination cursor local state
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  // References for scroll lock
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connect socket sync
  const { joinTicket, leaveTicket } = useSupportSocket(activeTicketId || undefined);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentThread?.messages) {
      scrollToBottom();
    }
  }, [currentThread?.messages]);

  // Initial load
  useEffect(() => {
    fetchUserTickets(1, 20);
    return () => {
      clearCurrentThread();
    };
  }, [fetchUserTickets, clearCurrentThread]);

  // Contextual reporting trigger check
  useEffect(() => {
    const instanceId = searchParams.get("instanceId");
    const errorCode = searchParams.get("errorCode");
    const screen = searchParams.get("screen");

    if (instanceId || errorCode || screen) {
      // Clear parameters after consuming
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Ticket thread selection change
  const handleSelectTicket = (ticketId: string) => {
    if (activeTicketId) {
      leaveTicket(activeTicketId);
    }
    setActiveTicketId(ticketId);
    fetchTicketThread(ticketId);
    markReadByUser(ticketId);
    joinTicket(ticketId);
  };

  // Active thread polling fallback (5 seconds)
  useEffect(() => {
    if (!activeTicketId) return;

    const interval = setInterval(() => {
      fetchTicketThread(activeTicketId);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTicketId, fetchTicketThread]);

  // Load older messages (cursor-based pagination)
  const handleLoadOlder = async () => {
    if (!currentThread || !currentThread.pagination.hasMore || isPaginationLoading) return;
    setIsPaginationLoading(true);
    try {
      await fetchTicketThread(currentThread.ticket.id, currentThread.pagination.oldestCursor || undefined);
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
      // Limit to 10MB
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

  // Submit new ticket
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;

    setCreateError(null);
    try {
      const result = await createTicket({
        subject,
        category,
        initialMessage,
        attachments,
        ...(ticketContext ? { context: ticketContext } : {}),
      });
      setIsCreateOpen(false);
      setSubject("");
      setCategory("other");
      setInitialMessage("");
      setAttachments([]);
      setTicketContext(null);
      // Auto-open newly created ticket
      if (result?._id || result?.id) {
        handleSelectTicket(result?._id || result?.id);
      }
    } catch (err: unknown) {
      setCreateError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create support ticket.");
    }
  };

  // Send message inside active thread
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId) return;
    if (!newMessageText.trim() && attachments.length === 0) return;

    setSendError(null);
    const body = newMessageText;
    const currentAttachments = [...attachments];

    // Optimistic clear to make UI snappy
    setNewMessageText("");
    setAttachments([]);

    try {
      await postUserMessage(activeTicketId, {
        body,
        attachments: currentAttachments,
      });
      // Fetch latest thread immediately to ensure database sync
      fetchTicketThread(activeTicketId);
    } catch (err: unknown) {
      setSendError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to send message.");
      // Rollback text
      setNewMessageText(body);
      setAttachments(currentAttachments);
    }
  };

  // Helper to format timestamps nicely
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Helpers to inspect resolved/closed reopen window
  const isTicketClosedOrResolved =
    currentThread?.ticket?.status === "resolved" || currentThread?.ticket?.status === "closed";

  const getReopenStatus = () => {
    if (!currentThread?.ticket) return { canReopen: false, daysLeft: 0 };
    if (!isTicketClosedOrResolved) return { canReopen: true, daysLeft: 0 };

    const resolvedTime = new Date(currentThread.ticket.updatedAt || currentThread.ticket.createdAt).getTime();
    const elapsed = now - resolvedTime;
    const reopenLimit = 7 * 24 * 60 * 60 * 1000;
    const timeLeft = reopenLimit - elapsed;

    return {
      canReopen: timeLeft > 0,
      daysLeft: Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000))),
    };
  };

  const reopenStatus = getReopenStatus();

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Title Header */}
      <div className="flex items-center justify-between bg-card border border-border/40 p-4 rounded-2xl shadow-md shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Help & Support
            <HelpCircle className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-muted-foreground text-xs font-medium mt-0.5">
            Connect directly with HueBox operators to resolve bot errors or technical inquiries.
          </p>
        </div>
        <Button
          onClick={() => {
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="bg-primary hover:bg-primary/95 text-white shadow-lg text-xs font-semibold rounded-xl flex items-center gap-1.5 py-2 px-4 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </Button>
      </div>

      {/* Main Support Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Left Side: Ticket Queue (Always visible on desktop, hides on mobile if ticket is active) */}
        <div
          className={cn(
            "w-full md:w-80 bg-card border border-border/40 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0",
            activeTicketId ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-4 border-b border-border/20 flex items-center justify-between shrink-0">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              My Support Tickets
            </span>
            <button
              onClick={() => fetchUserTickets(1, 20)}
              title="Refresh tickets queue"
              className="p-1 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 select-none">
            {isLoading && userTickets.length === 0 ? (
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-muted/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : userTickets.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-foreground font-semibold">No tickets opened yet</p>
                <p className="text-[10px] text-muted-foreground max-w-[180px] mx-auto leading-normal">
                  If you run into issues launching your bot, file a ticket to get developer feedback.
                </p>
              </div>
            ) : (
              userTickets.map((ticket) => (
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
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>{formatDate(ticket.lastMessageAt)}</span>
                    {ticket.unreadCount > 0 && (
                      <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">
                        {ticket.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread View */}
        <div
          className={cn(
            "flex-1 bg-card border border-border/40 rounded-2xl flex flex-col overflow-hidden shadow-sm",
            !activeTicketId ? "hidden md:flex items-center justify-center" : "flex"
          )}
        >
          {activeTicketId ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-4 border-b border-border/20 bg-muted/5 flex items-center justify-between shrink-0">
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
                      <Badge
                        className={cn(
                          "font-mono text-[9px] px-1.5 py-0.2 border uppercase",
                          currentThread?.ticket?.priority === "high"
                            ? "text-rose-400 border-rose-400/20 bg-rose-500/10"
                            : "text-muted-foreground border-border/30"
                        )}
                      >
                        {currentThread?.ticket?.priority}
                      </Badge>
                      <Badge
                        className={cn(
                          "font-mono text-[9px] px-1.5 py-0.2 border uppercase",
                          currentThread?.ticket?.status === "open"
                            ? "text-emerald-400 border-emerald-400/20 bg-emerald-500/10"
                            : currentThread?.ticket?.status === "pending_admin"
                            ? "text-sky-400 border-sky-400/20 bg-sky-500/10"
                            : currentThread?.ticket?.status === "pending_user"
                            ? "text-amber-400 border-amber-400/20 bg-amber-500/10"
                            : "text-muted-foreground border-border/40 bg-muted/25"
                        )}
                      >
                        {currentThread?.ticket?.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {currentThread?.ticket?.subject}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-muted-foreground flex flex-col items-end">
                  <span>Category: {CATEGORIES.find((c) => c.value === currentThread?.ticket?.category)?.label || currentThread?.ticket?.category}</span>
                  <span>Created: {formatDate(currentThread?.ticket?.createdAt)}</span>
                </div>
              </div>

              {/* Chat Thread Messages Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                {/* Pagination load older button */}
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

                {currentThread?.messages?.map((msg, idx) => {
                  const isMe = msg.senderType === "user";
                  return (
                    <div
                      key={msg._id || msg.id || idx}
                      className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      {/* Message Sender Info */}
                      <span className="text-[9px] font-mono text-muted-foreground mb-1">
                        {isMe ? "You" : "Operator (Admin)"} • {formatTime(msg.createdAt)}
                      </span>

                      {/* Message Body Bubble */}
                      <div
                        className={cn(
                          "px-3.5 py-2.5 rounded-2xl shadow-sm text-xs font-medium break-words whitespace-pre-wrap leading-relaxed",
                          isMe
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-card text-foreground border border-border/40 rounded-tl-none"
                        )}
                      >
                        <p>{msg.body}</p>

                        {/* Message Attachments */}
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
                {isTicketClosedOrResolved && (
                  <div className="mb-2 p-2 rounded-xl bg-muted/40 border border-border/20 text-[10px] text-muted-foreground flex items-center gap-1.5 font-semibold">
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {reopenStatus.canReopen
                        ? `This ticket is resolved. Sending a message within ${reopenStatus.daysLeft} days will reopen the ticket.`
                        : "This ticket has been resolved for more than 7 days and is permanently locked."}
                    </span>
                  </div>
                )}

                {sendError && (
                  <div className="mb-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}

                {/* Attachments Pending Upload List */}
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
                    disabled={isTicketClosedOrResolved && !reopenStatus.canReopen}
                    className="h-9 w-9 rounded-xl border-border/40 shrink-0"
                    title="Attach files (PDF, images — Max 10MB)"
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
                    disabled={isTicketClosedOrResolved && !reopenStatus.canReopen}
                    className="flex-1 bg-muted/40 border-border/40 h-9 rounded-xl text-xs"
                  />

                  <Button
                    type="submit"
                    disabled={(isTicketClosedOrResolved && !reopenStatus.canReopen) || (!newMessageText.trim() && attachments.length === 0)}
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
                Choose a ticket from the queue on the left to read conversation or post a message.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW SUPPORT TICKET MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border/20 flex items-center justify-between shrink-0 bg-muted/10">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">Open Support Ticket</span>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                {createError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Subject
                  </label>
                  <Input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your query"
                    maxLength={150}
                    className="bg-muted/30 border-border/40 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} className="bg-popover text-foreground">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Detailed Message
                  </label>
                  <textarea
                    required
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Describe your issue or question in detail. Mention any error codes if applicable."
                    rows={4}
                    className="flex w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                  />
                </div>

                {/* Attachments section */}
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                    Attachments (Optional — Max 5)
                  </label>
                  <input
                    type="file"
                    id="modal-attachments"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("modal-attachments")?.click()}
                    disabled={isUploading || attachments.length >= 5}
                    className="h-8 text-[11px] rounded-xl border-border/40 font-mono font-semibold"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-muted-foreground" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                    )}
                    Upload Files
                  </Button>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 p-2 bg-muted/20 border border-border/10 rounded-xl">
                      {attachments.map((attach, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-card border border-border/40 px-2 py-1 rounded-lg text-[9px] font-mono text-foreground"
                        >
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{attach.name}</span>
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
                </div>

                <div className="pt-2 flex justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs font-semibold rounded-xl h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl h-9 px-4 shadow-md"
                  >
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
