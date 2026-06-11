import { BotStatus } from "../Enums/BotStatus.enum";
import { BotRegime } from "../Enums/BotRegime.enum";
import { DrawdownTier } from "../Enums/DrawdownTier.enum";
import { PositionSide } from "../Enums/PositionSide.enum";
import { PositionStrategy } from "../Enums/PositionStrategy.enum";
import { Personality } from "../Enums/Personality.enum";

export { BotStatus, BotRegime, DrawdownTier, PositionSide, PositionStrategy, Personality };

export interface BotSummary {
  userId: string;
  email: string;
  status: BotStatus;
  personality: string;
  activeSlots: number;
  maxSlots: number;
  totalPnlUsdt: number;
  unrealisedPnlUsdt: number;
  regime: BotRegime | null;
  drawdownTier: DrawdownTier | string;
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
  side: PositionSide;
  entryPrice: number;
  exitPrice: number | null;
  leverage: number;
  marginUsdt: number;
  pnlUsdt: number | null;
  roiPct: number | null;
  strategy: PositionStrategy;
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

export interface BotState {
  status: BotStatus | string;
  personality: string;
  heartbeat: string;
  activeGrids: number;
  cycleCounter: number;
  setBotStatus: (status: Partial<Omit<BotState, "setBotStatus">>) => void;
}
