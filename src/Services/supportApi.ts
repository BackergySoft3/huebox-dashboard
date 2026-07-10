import { api } from "./http.service";

export interface Attachment {
  url: string;
  key: string;
  contentType: string;
  name?: string;
}

export interface TicketContext {
  instanceId?: string | null;
  errorCode?: string | null;
  screen?: string | null;
  occurredAt?: string | null;
}

export interface CreateTicketPayload {
  subject: string;
  category: string;
  initialMessage: string;
  attachments?: Attachment[];
  context?: TicketContext;
}

export interface PostMessagePayload {
  body: string;
  attachments?: Attachment[];
}

export const supportApi = {
  requestUploadUrl: async (contentType: string, filename: string, size: number) => {
    const response = await api.post<{ uploadUrl: string; key: string; publicUrl: string }>(
      "/api/support/upload-url",
      { contentType, filename, size },
    );
    return response.data;
  },

  createTicket: async (payload: CreateTicketPayload) => {
    const response = await api.post("/api/support/tickets", payload);
    return response.data;
  },

  listUserTickets: async (page = 1, limit = 20) => {
    const response = await api.get("/api/support/tickets", {
      params: { page, limit },
    });
    return response.data;
  },

  getTicketThread: async (ticketId: string, before?: string, limit = 30) => {
    const response = await api.get(`/api/support/tickets/${ticketId}`, {
      params: { before, limit },
    });
    return response.data;
  },

  postUserMessage: async (ticketId: string, payload: PostMessagePayload) => {
    const response = await api.post(`/api/support/tickets/${ticketId}/messages`, payload);
    return response.data;
  },

  markReadByUser: async (ticketId: string) => {
    const response = await api.post(`/api/support/tickets/${ticketId}/read`);
    return response.data;
  },

  // ── Admin-facing APIs ────────────────────────────────────────────────────

  getAdminUnreadCount: async () => {
    const response = await api.get("/api/admin/support/tickets/unread-count");
    return response.data;
  },

  adminListTickets: async (params: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/api/admin/support/tickets", { params });
    return response.data;
  },

  adminGetThread: async (ticketId: string, before?: string, limit = 30) => {
    const response = await api.get(`/api/admin/support/tickets/${ticketId}`, {
      params: { before, limit },
    });
    return response.data;
  },

  postAdminMessage: async (ticketId: string, payload: PostMessagePayload) => {
    const response = await api.post(`/api/admin/support/tickets/${ticketId}/messages`, payload);
    return response.data;
  },

  updateTicketStatus: async (ticketId: string, payload: { status?: string; priority?: string }) => {
    const response = await api.patch(`/api/admin/support/tickets/${ticketId}/status`, payload);
    return response.data;
  },

  markReadByAdmin: async (ticketId: string) => {
    const response = await api.post(`/api/admin/support/tickets/${ticketId}/read`);
    return response.data;
  },
};
