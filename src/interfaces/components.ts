import type { ElementType, ReactNode } from "react";
import type { LogLine } from "./logs";
import { BotStatus } from "../Enums/BotStatus.enum";

export { BotStatus };

export interface StatusBadgeProps {
  status?: BotStatus | string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: ElementType;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

export interface Action {
  label: string;
  action: string;
  danger?: boolean;
  superAdminOnly?: boolean;
}

export interface UserDrawerProps {
  userId: string;
  onClose: () => void;
}

export interface Grid {
  symbol: string;
  direction: "LONG" | "SHORT" | string;
  entryPrice: number;
  leverage: number;
  margin: number;
  deployedAt?: string;
}

export interface ActiveGridsTableProps {
  grids?: Grid[];
}

export interface ConfirmModalProps {
  title: string;
  description: string;
  requireReason?: boolean;
  requireConfirmText?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: (reason?: string) => Promise<void>;
  onCancel: () => void;
  children?: ReactNode;
}

export interface LogPanelProps {
  logs: LogLine[];
  searchQuery?: string;
  autoScroll: boolean;
  setAutoScroll: (val: boolean) => void;
}

export type FilterResult = {
  key: string;
  label: string;
  matchScore: number;
  stats: {
    leverage: string;
    takeProfit: string;
    stopLoss: string;
    holdLimit: string;
    riskTier: string;
  };
  tag: "Best match" | "Good match" | null;
};
