// ─── Admin Bots API Service ──────────────────────────────────────────────────
// Endpoints: GET /admin/bots, /admin/bots/aggregate, /admin/bots/:userId,
//            POST force-stop | force-pause | force-resume | broadcast-pause
//            PATCH personality

import { Personality } from "../Enums/Personality.enum";
import { getAuthCookie, AUTH_COOKIE_KEYS } from "../Helpers/cookieAuth";
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

const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "http://localhost:3000") + "/api";

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN) ?? ""}`,
    "Content-Type": "application/json",
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error((err as any).message ?? res.statusText),
      { status: res.status, data: err }
    );
  }
  return res.json() as Promise<T>;
}

// Derived from Personality enum — single source of truth
export const VALID_PERSONALITIES = Object.values(Personality);

// ─── API Client ──────────────────────────────────────────────────────────────

export const adminBotsApi = {
  list: (params?: { status?: string; personality?: string }): Promise<BotSummary[]> => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : "";
    return fetch(`${BASE}/admin/bots${qs ? `?${qs}` : ""}`, { headers: authHeaders() })
      .then((r) => handle<BotSummary[]>(r));
  },

  aggregate: (): Promise<BotAggregate> =>
    fetch(`${BASE}/admin/bots/aggregate`, { headers: authHeaders() })
      .then((r) => handle<BotAggregate>(r)),

  deepState: (userId: string): Promise<BotDeepState> =>
    fetch(`${BASE}/admin/bots/${userId}`, { headers: authHeaders() })
      .then((r) => handle<BotDeepState>(r)),

  forceStop: (userId: string): Promise<ForceActionResult> =>
    fetch(`${BASE}/admin/bots/${userId}/force-stop`, { method: "POST", headers: authHeaders() })
      .then((r) => handle<ForceActionResult>(r)),

  forcePause: (userId: string): Promise<{ success: boolean; message: string }> =>
    fetch(`${BASE}/admin/bots/${userId}/force-pause`, { method: "POST", headers: authHeaders() })
      .then((r) => handle<{ success: boolean; message: string }>(r)),

  forceResume: (userId: string): Promise<{ success: boolean; message: string }> =>
    fetch(`${BASE}/admin/bots/${userId}/force-resume`, { method: "POST", headers: authHeaders() })
      .then((r) => handle<{ success: boolean; message: string }>(r)),

  overridePersonality: (
    userId: string,
    personality: string
  ): Promise<{ success: boolean; userId: string; personality: string }> =>
    fetch(`${BASE}/admin/bots/${userId}/personality`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ personality }),
    }).then((r) => handle<{ success: boolean; userId: string; personality: string }>(r)),

  broadcastPause: (): Promise<BroadcastResult> =>
    fetch(`${BASE}/admin/bots/broadcast-pause`, { method: "POST", headers: authHeaders() })
      .then((r) => handle<BroadcastResult>(r)),
};
