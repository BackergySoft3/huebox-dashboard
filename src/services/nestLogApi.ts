import { api } from "../lib/api";

export interface NestjsLogsResponse {
  success: boolean;
  logPath: string;
  lines: number;
  output: string;
}

export const nestLogApi = {
  getNestjsLogs: async (lines = 250): Promise<NestjsLogsResponse> => {
    const response = await api.get<NestjsLogsResponse>(`/api/bot/system/nestjs-logs?lines=${lines}`);
    return response.data;
  },
};