import { useQuery } from '@tanstack/react-query';
import { api } from '../Services/http.service';

export interface PortfolioInstance {
  instanceId: string;
  personality: 'moderate' | 'balanced' | 'aggressive';
  allocatedAmount: number;
  subAccountId: string;
  status: 'starting' | 'running' | 'paused' | 'stopped' | 'stalled';
  heartbeatAlive: boolean;
  walletBalanceUsdt: number;
  roi: number;
  unrealizedPnl: number;
  activeGrids: number;
  lastCycleAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioAggregate {
  totalDeployedCapital: number;
  totalWalletBalance: number;
  totalUnrealizedPnl: number;
  weightedRoi: number;
  runningCount: number;
  pausedCount: number;
  stalledCount: number;
  startingCount: number;
  totalActiveGrids: number;
}

export interface PortfolioPerformance {
  totalClosedTrades: number;
  winRate: number;
  totalRealizedPnlUsdt: number;
  totalFeesUsdt: number;
  netPnlUsdt: number;
  bestTrade: { symbol: string; pnlUsdt: number; closedAt: string } | null;
  worstTrade: { symbol: string; pnlUsdt: number; closedAt: string } | null;
  totalDeposited: number;
}

export interface PortfolioDelta24h {
  profit: number | null;
  profitPercent: number | null;
  hasHistory: boolean;
  currentEquity: number | null;
}

export interface PortfolioSummaryResponse {
  instances: PortfolioInstance[];
  aggregate: PortfolioAggregate;
  performance: PortfolioPerformance;
  delta24h: PortfolioDelta24h;
}

export function usePortfolioSummary() {
  return useQuery<PortfolioSummaryResponse>({
    queryKey: ['portfolio-summary'],
    queryFn: () => api.get('/api/portfolio/summary').then(r => r.data),
    refetchInterval: 10_000,
    retry: 2,
    retryDelay: 2000,
  });
}
