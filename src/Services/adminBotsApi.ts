// FIX Critical-2: Replaced all raw fetch() calls with the shared Axios api
// client from http.service.ts, which carries the 401 refresh interceptor
// queue. Token expiry during admin actions no longer causes silent failures.

import { Personality } from "../Enums/Personality.enum";
import { api } from "./http.service";
import type {
  BotSummary,
  BotAggregate,
  ClosedPosition,
  BotDeepState,
  ForceActionResult,
  BroadcastResult,
} from "../Interfaces/bot";

export { Personality };
export type {
  BotSummary,
  BotAggregate,
  ClosedPosition,
  BotDeepState,
  ForceActionResult,
  BroadcastResult,
};

// Derived from Personality enum — single source of truth
export const VALID_PERSONALITIES = Object.values(Personality);

// ─── API Client ──────────────────────────────────────────────────────────────

export const adminBotsApi = {
  list: async (params?: { status?: string; personality?: string }): Promise<BotSummary[]> => {
    const response = await api.get<BotSummary[]>("/api/admin/bots", { params });
    return response.data;
  },

  aggregate: async (): Promise<BotAggregate> => {
    const response = await api.get<BotAggregate>("/api/admin/bots/aggregate");
    return response.data;
  },

  deepState: async (userId: string): Promise<BotDeepState> => {
    const response = await api.get<BotDeepState>(`/api/admin/bots/${userId}`);
    return response.data;
  },

  forceStop: async (userId: string): Promise<ForceActionResult> => {
    const response = await api.post<ForceActionResult>(`/api/admin/bots/${userId}/force-stop`);
    return response.data;
  },

  forcePause: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      `/api/admin/bots/${userId}/force-pause`
    );
    return response.data;
  },

  forceResume: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      `/api/admin/bots/${userId}/force-resume`
    );
    return response.data;
  },

  overridePersonality: async (
    userId: string,
    personality: string
  ): Promise<{ success: boolean; userId: string; personality: string }> => {
    const response = await api.patch<{ success: boolean; userId: string; personality: string }>(
      `/api/admin/bots/${userId}/personality`,
      { personality }
    );
    return response.data;
  },

  broadcastPause: async (): Promise<BroadcastResult> => {
    const response = await api.post<BroadcastResult>("/api/admin/bots/broadcast-pause");
    return response.data;
  },
};
