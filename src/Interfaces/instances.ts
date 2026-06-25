// FIX: F1 — Personality Enum Case (PascalCase)
// FIX: F9 — Make roi, unrealizedPnl, activeGrids Required
export type InstancePersonality = "Moderate" | "Balanced" | "Aggressive";
export type InstanceStatus = "running" | "stopped" | "paused" | "stalled";

export interface BotInstance {
  instanceId: string;
  personality: InstancePersonality;
  /** USDT allocated at start (zeroed after stop) */
  allocatedAmount: number;
  status: InstanceStatus;
  subAccountId: string;
  /** Live heartbeat presence from Redis */
  heartbeatAlive: boolean;
  /** Current sub-account USDT balance from Bybit */
  walletBalanceUsdt: number;
  createdAt?: string;
  updatedAt?: string;
  roi: number;
  unrealizedPnl: number;
  activeGrids: number;
}

export interface StartInstancePayload {
  personality: InstancePersonality;
  allocatedAmount: number;
}
