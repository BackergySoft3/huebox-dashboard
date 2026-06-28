import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { botApi } from "../Services/botApi";
import { useBotStore } from "../State/bot";

export function useBotStatus() {
  const setBotStatusStore = useBotStore((state) => state.setBotStatus);

  const query = useQuery({
    queryKey: ["bot-status"],
    queryFn: async () => {
      try {
        const data = await botApi.getStatus();
        return data;
      } catch (err: any) {
        console.error("[useBotStatus] API error:", err?.response?.status, err?.response?.data || err.message);
        throw err;
      }
    },
    refetchInterval: 5000,
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (query.data) {
      setBotStatusStore({
        status: query.data.status || "stalled",
        personality: query.data.personality || "balanced",
        heartbeat: query.data.lastHeartbeat || query.data.heartbeat || new Date().toISOString(),
        activeGrids: query.data.active_grids || 0,
      });
    }
  }, [query.data, setBotStatusStore]);

  return query;
}
