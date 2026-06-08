import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function usePerformance() {
  const historyQuery = useQuery({
    queryKey: ["performance-history"],
    queryFn: () => api.get("/api/performance/history?limit=100").then((r) => r.data),
  });

  const feesQuery = useQuery({
    queryKey: ["performance-fees"],
    queryFn: () => api.get("/api/performance/fees").then((r) => r.data).catch(() => null),
  });

  const summaryQuery = useQuery({
    queryKey: ["performance-summary"],
    queryFn: () => api.get("/api/performance/summary").then((r) => r.data).catch(() => null),
  });

  // Map history data: closed positions to the formats expected by Recharts/table
  const rawHistory = historyQuery.data || [];
  const history = rawHistory.map((p: any) => ({
    ...p,
    timestamp: p.closedAt,
    pnl: p.pnlUsdt,
    direction: p.side?.toUpperCase() || (p.pnlUsdt >= 0 ? "LONG" : "SHORT"),
  }));

  // Map fees data: from the backend object format { totalFeesUsdt, count, fees: [...] }
  const feesData = feesQuery.data;
  const fees = Array.isArray(feesData?.fees)
    ? feesData.fees.map((f: any) => ({
        ...f,
        timestamp: f.createdAt,
        fee: f.amountUsdt,
      }))
    : [];

  // Map summary data matching backend structures
  const summaryData = summaryQuery.data;
  const summary = summaryData
    ? {
        winRate: summaryData.winRate ?? 0,
        avgPnl: summaryData.totalTrades > 0
          ? summaryData.totalPnlUsdt / summaryData.totalTrades
          : 0,
        bestTrade: summaryData.bestTrade?.pnlUsdt ?? 0,
        worstTrade: summaryData.worstTrade?.pnlUsdt ?? 0,
      }
    : {
        winRate: 0,
        avgPnl: 0,
        bestTrade: 0,
        worstTrade: 0,
      };

  return {
    history,
    fees,
    summary,
    isLoading: historyQuery.isLoading || feesQuery.isLoading || summaryQuery.isLoading,
    refetch: () => {
      historyQuery.refetch();
      feesQuery.refetch();
      summaryQuery.refetch();
    },
  };
}
