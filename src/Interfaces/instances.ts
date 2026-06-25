// Backend @IsEnum validator enforces lowercase: moderate | balanced | aggressive
export type InstancePersonality = "moderate" | "balanced" | "aggressive";
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
