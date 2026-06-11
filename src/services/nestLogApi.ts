import { api } from "../lib/api";
import type { NestjsLogsResponse } from "../interfaces/logs";

export type { NestjsLogsResponse };

export const nestLogApi = {
  getNestjsLogs: async (lines = 250): Promise<NestjsLogsResponse> => {
    const response = await api.get<NestjsLogsResponse>(`/api/bot/system/nestjs-logs?lines=${lines}`);
    return response.data;
  },
};
