import { api } from "./http.service";

export interface NewsPostPayload {
  title: string;
  subject: string;
  details: string;
  imageKey?: string;
  imageUrl?: string;
}

export interface UpdateNewsPostPayload {
  title?: string;
  subject?: string;
  details?: string;
  imageKey?: string | null;
  imageUrl?: string | null;
}

export interface NewsListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const newsApi = {
  requestUploadUrl: async (contentType: string, filename: string) => {
    const response = await api.post("/api/admin/news/upload-url", { contentType, filename });
    return response.data;
  },

  create: async (payload: NewsPostPayload) => {
    const response = await api.post("/api/admin/news", payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateNewsPostPayload) => {
    const response = await api.patch(`/api/admin/news/${id}`, payload);
    return response.data;
  },

  publish: async (id: string) => {
    const response = await api.post(`/api/admin/news/${id}/publish`);
    return response.data;
  },

  archive: async (id: string) => {
    const response = await api.post(`/api/admin/news/${id}/archive`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/admin/news/${id}`);
    return response.data;
  },

  findOne: async (id: string) => {
    const response = await api.get(`/api/admin/news/${id}`);
    return response.data;
  },

  listAll: async (params: NewsListParams) => {
    const response = await api.get("/api/admin/news", { params });
    return response.data;
  },

  listPublished: async (params: { page?: number; limit?: number }) => {
    const response = await api.get("/api/news", { params });
    return response.data;
  },
};
