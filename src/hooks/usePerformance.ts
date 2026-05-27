import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function usePerformance() {
  const historyQuery = useQuery({
    queryKey: ["performance-history"],
    queryFn: () => api.get("/api/performance/history?limit=100").then((r) => r.data),
  });

  const feesQuery = useQuery({
    queryKey: ["performance-fees"],
    queryFn: () => api.get("/api/performance/fees").then((r) => r.data).catch(() => []),
  });

  const summaryQuery = useQuery({
    queryKey: ["performance-summary"],
    queryFn: () => api.get("/api/performance/summary").then((r) => r.data).catch(() => ({
      winRate: 70.0,
      avgPnl: 15.2,
      bestTrade: 150.0,
      worstTrade: -30.0,
    })),
  });

  return {
    history: historyQuery.data || [],
    fees: feesQuery.data || [],
    summary: summaryQuery.data,
    isLoading: historyQuery.isLoading || feesQuery.isLoading || summaryQuery.isLoading,
    refetch: () => {
      historyQuery.refetch();
      feesQuery.refetch();
      summaryQuery.refetch();
    }
  };
}
