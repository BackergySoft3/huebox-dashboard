import { create } from "zustand";
import { supportApi, type CreateTicketPayload, type PostMessagePayload } from "../Services/supportApi";

interface SupportState {
  userTickets: any[];
  userTicketsTotal: number;
  userTicketsPage: number;
  userTicketsLimit: number;
  adminTickets: any[];
  adminTicketsTotal: number;
  adminTicketsPage: number;
  adminTicketsLimit: number;
  adminUnreadCount: number;

  currentThread: {
    ticket: any;
    messages: any[];
    pagination: {
      hasMore: boolean;
      oldestCursor: string | null;
      limit: number;
    };
  } | null;

  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUserTickets: (page?: number, limit?: number) => Promise<void>;
  fetchTicketThread: (ticketId: string, before?: string, limit?: number) => Promise<void>;
  createTicket: (payload: CreateTicketPayload) => Promise<any>;
  postUserMessage: (ticketId: string, payload: PostMessagePayload) => Promise<any>;
  markReadByUser: (ticketId: string) => Promise<void>;

  // Admin Actions
  fetchAdminTickets: (params: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchAdminTicketThread: (ticketId: string, before?: string, limit?: number) => Promise<void>;
  postAdminMessage: (ticketId: string, payload: PostMessagePayload) => Promise<any>;
  updateTicketStatus: (ticketId: string, payload: { status?: string; priority?: string }) => Promise<void>;
  fetchAdminUnreadCount: () => Promise<void>;
  markReadByAdmin: (ticketId: string) => Promise<void>;

  // Live WebSocket sync actions
  receiveNewMessage: (payload: { messageId: string; senderType: string; ticketId: string }) => void;
  receiveStatusChanged: (payload: { ticketId: string; status: string }) => void;
  setAdminUnreadCount: (count: number) => void;
  clearCurrentThread: () => void;
}

export const useSupportStore = create<SupportState>((set, get) => ({
  userTickets: [],
  userTicketsTotal: 0,
  userTicketsPage: 1,
  userTicketsLimit: 20,
  adminTickets: [],
  adminTicketsTotal: 0,
  adminTicketsPage: 1,
  adminTicketsLimit: 20,
  adminUnreadCount: 0,
  currentThread: null,
  isLoading: false,
  error: null,

  fetchUserTickets: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const res = await supportApi.listUserTickets(page, limit);
      set({
        userTickets: res.data || [],
        userTicketsTotal: res.total || 0,
        userTicketsPage: res.page || 1,
        userTicketsLimit: res.limit || 20,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || "Failed to fetch user support tickets.",
      });
    }
  },

  fetchTicketThread: async (ticketId, before, limit = 30) => {
    set({ isLoading: true, error: null });
    try {
      const res = await supportApi.getTicketThread(ticketId, before, limit);
      if (before && get().currentThread && get().currentThread?.ticket?.id === ticketId) {
        // Prepend older messages for pagination
        set((state) => ({
          currentThread: {
            ticket: res.ticket,
            messages: [...res.messages, ...(state.currentThread?.messages || [])],
            pagination: res.pagination,
          },
          isLoading: false,
        }));
      } else {
        set({
          currentThread: res,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || "Failed to fetch ticket conversation thread.",
      });
    }
  },

  createTicket: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await supportApi.createTicket(payload);
      set({ isLoading: false });
      await get().fetchUserTickets(1, get().userTicketsLimit);
      return res;
    } catch (err: any) {
      set({ isLoading: false });
      throw err;
    }
  },

  postUserMessage: async (ticketId, payload) => {
    try {
      const res = await supportApi.postUserMessage(ticketId, payload);
      // Append the message to current thread locally
      const current = get().currentThread;
      if (current && current.ticket.id === ticketId) {
        set({
          currentThread: {
            ...current,
            messages: [...current.messages, res],
          },
        });
      }
      return res;
    } catch (err: any) {
      throw err;
    }
  },

  markReadByUser: async (ticketId) => {
    try {
      await supportApi.markReadByUser(ticketId);
      // Update local unread count in userTickets list
      set((state) => ({
        userTickets: state.userTickets.map((t) =>
          t.id === ticketId ? { ...t, unreadCount: 0 } : t
        ),
      }));
    } catch (err: any) {
      console.error("Failed to mark ticket read:", err);
    }
  },

  // ── Admin Actions ────────────────────────────────────────────────────────

  fetchAdminTickets: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await supportApi.adminListTickets(params);
      set({
        adminTickets: res.data || [],
        adminTicketsTotal: res.total || 0,
        adminTicketsPage: res.page || 1,
        adminTicketsLimit: res.limit || 20,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || "Failed to fetch admin ticket queue.",
      });
    }
  },

  fetchAdminTicketThread: async (ticketId, before, limit = 30) => {
    set({ isLoading: true, error: null });
    try {
      const res = await supportApi.adminGetThread(ticketId, before, limit);
      if (before && get().currentThread && get().currentThread?.ticket?._id === ticketId) {
        set((state) => ({
          currentThread: {
            ticket: res.ticket,
            messages: [...res.messages, ...(state.currentThread?.messages || [])],
            pagination: res.pagination,
          },
          isLoading: false,
        }));
      } else {
        set({
          currentThread: res,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || "Failed to fetch admin conversation thread.",
      });
    }
  },

  postAdminMessage: async (ticketId, payload) => {
    try {
      const res = await supportApi.postAdminMessage(ticketId, payload);
      const current = get().currentThread;
      if (current && (current.ticket._id === ticketId || current.ticket.id === ticketId)) {
        set({
          currentThread: {
            ...current,
            messages: [...current.messages, res],
          },
        });
      }
      return res;
    } catch (err: any) {
      throw err;
    }
  },

  updateTicketStatus: async (ticketId, payload) => {
    try {
      const res = await supportApi.updateTicketStatus(ticketId, payload);
      // Update local ticket status in active thread
      const current = get().currentThread;
      if (current && (current.ticket._id === ticketId || current.ticket.id === ticketId)) {
        set({
          currentThread: {
            ...current,
            ticket: { ...current.ticket, status: res.status, priority: res.priority },
          },
        });
      }
      // Update in adminTickets list
      set((state) => ({
        adminTickets: state.adminTickets.map((t) =>
          t.id === ticketId ? { ...t, status: res.status, priority: res.priority } : t
        ),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  fetchAdminUnreadCount: async () => {
    try {
      const res = await supportApi.getAdminUnreadCount();
      set({ adminUnreadCount: res.unreadFromUsers || 0 });
    } catch (err: any) {
      console.error("Failed to fetch admin unread count:", err);
    }
  },

  markReadByAdmin: async (ticketId) => {
    try {
      await supportApi.markReadByAdmin(ticketId);
      set((state) => ({
        adminTickets: state.adminTickets.map((t) =>
          t.id === ticketId ? { ...t, unreadFromUser: 0 } : t
        ),
      }));
      await get().fetchAdminUnreadCount();
    } catch (err: any) {
      console.error("Failed to mark ticket read by admin:", err);
    }
  },

  // ── WebSocket Live Sync ──────────────────────────────────────────────────

  receiveNewMessage: (payload) => {
    const current = get().currentThread;
    const ticketId = current?.ticket?._id || current?.ticket?.id;

    if (current && ticketId === payload.ticketId) {
      // Check if message is already in list to avoid duplicates
      const alreadyExists = current.messages.some((m) => m._id === payload.messageId || m.id === payload.messageId);
      if (!alreadyExists) {
        // Fetch/refresh thread to ensure details & attachments are fully synced
        if (payload.senderType === "admin" && current.ticket.owner) {
          get().fetchTicketThread(payload.ticketId);
        } else {
          get().fetchAdminTicketThread(payload.ticketId);
        }
      }
    }

    // Also trigger list updates
    if (payload.senderType === "user") {
      get().fetchAdminUnreadCount();
    }
  },

  receiveStatusChanged: (payload) => {
    const current = get().currentThread;
    const ticketId = current?.ticket?._id || current?.ticket?.id;

    if (current && ticketId === payload.ticketId) {
      set({
        currentThread: {
          ...current,
          ticket: { ...current.ticket, status: payload.status },
        },
      });
    }

    // Refresh tickets list
    get().fetchUserTickets(get().userTicketsPage, get().userTicketsLimit);
    get().fetchAdminTickets({
      page: get().adminTicketsPage,
      limit: get().adminTicketsLimit,
    });
  },

  setAdminUnreadCount: (count) => set({ adminUnreadCount: count }),

  clearCurrentThread: () => set({ currentThread: null }),
}));
