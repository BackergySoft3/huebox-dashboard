// ─── Admin Bots API Service ──────────────────────────────────────────────────
// Endpoints: GET /admin/bots, /admin/bots/aggregate, /admin/bots/:userId,
//            POST force-stop | force-pause | force-resume | broadcast-pause
//            PATCH personality

const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "http://localhost:3000") + "/api";

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${localStorage.getItem("huebox_access_token") ?? ""}`,
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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BotSummary {
  userId: string;
  email: string;
  status: "running" | "stalled" | "stopped" | "paused";
  personality: string;
  activeSlots: number;
  maxSlots: number;
  totalPnlUsdt: number;
  unrealisedPnlUsdt: number;
  regime: "SCOUTING" | "FARMING" | null;
  drawdownTier: "HEALTHY" | "CAUTION" | "DANGER" | string;
  lastHeartbeatAt: string | null;
  heartbeatAgeSeconds: number;
  enginePid: number | null;
}

export interface BotAggregate {
  totalActiveSlots: number;
  combinedUnrealisedPnl: number;
  stalledCount: number;
  regimeSplit: {
    scouting: number;
    farming: number;
  };
}

export interface ClosedPosition {
  _id: string;
  userId: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number | null;
  leverage: number;
  marginUsdt: number;
  pnlUsdt: number | null;
  roiPct: number | null;
  strategy: "grid" | "outlier";
  regime: string | null;
  reason: string | null;
  openedAt: string;
  closedAt: string;
}

export interface BotDeepState {
  botState: Record<string, string>;
  config: {
    apiKey: string;
    apiSecret: string;
    [key: string]: string;
  } | null;
  activeGrids: Record<string, unknown>;
  logs: string[];
  tradeHistory: ClosedPosition[];
}

export interface ForceActionResult {
  success: boolean;
  message: string;
  closePositionsResult?: {
    success: boolean;
    results: Array<{ symbol: string; success: boolean; msg?: string; error?: string }>;
  };
}

export interface BroadcastResult {
  success: boolean;
  message: string;
  pausedUserIds: string[];
}

export const VALID_PERSONALITIES = [
  "safe", "moderate", "balanced", "aggressive", "insane", "hunter", "sentient", "brain",
] as const;

export type Personality = typeof VALID_PERSONALITIES[number];

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
