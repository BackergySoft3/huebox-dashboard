import { api } from "./http.service";

export const botApi = {
  getStatus: async () => {
    const response = await api.get("/api/bot/status");
    return response.data;
  },

  configure: async (config: {
    allocatedAmountUsdt: number;
    stopCondition: {
      type: string | null;
      targetProfitUsdt?: number | null;
      durationDays?: number | null;
    };
  }) => {
    const response = await api.post("/api/bot/configure", config);
    return response.data;
  },

  start: async () => {
    const response = await api.post("/api/bot/start");
    return response.data;
  }
};
