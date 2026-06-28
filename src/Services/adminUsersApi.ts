import { api } from "./http.service";

export const adminUsersApi = {
  getUser: async (userId: string) => {
    const response = await api.get(`/api/auth/user/${userId}`);
    return response.data;
  },

  getSessions: async (userId: string) => {
    const response = await api.get(`/api/admin/users/${userId}/sessions`);
    return response.data;
  },

  getHistory: async (userId: string) => {
    const response = await api.get(`/api/admin/users/${userId}/status-history`);
    return response.data;
  },

  updateStatus: async (userId: string, action: string, body: any) => {
    if (action === "soft" || action === "hard") {
      const response = await api.delete(`/api/admin/users/${userId}/${action}`, { data: body });
      return response.data;
    }
    if (action === "restore") {
      const response = await api.post(`/api/admin/users/${userId}/restore`, body);
      return response.data;
    }
    const response = await api.patch(`/api/admin/users/${userId}/${action}`, body);
    return response.data;
  }
};
