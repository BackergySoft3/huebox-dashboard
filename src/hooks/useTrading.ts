import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingApi } from "../services/tradingApi";
import type {
  PlaceOrderRequest,
  PlaceOrderResponse,
  CancelOrderRequest,
  ClosePositionRequest,
  TradingDashboardResponse,
  Candle,
  Btc24hResponse,
} from "../interfaces/trading";

export function useTradingDashboard() {
  return useQuery<TradingDashboardResponse>({
    queryKey: ["trading", "dashboard"],
    queryFn: () => tradingApi.getTradingDashboard(),
    refetchInterval: 5000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

export function useBtcCandles(interval: string, limit = 96) {
  return useQuery<Candle[]>({
    queryKey: ["market", "btc", "candles", interval, limit],
    queryFn: () => tradingApi.getBtcCandles(interval, limit),
    refetchInterval: 15000,
    retry: 2,
  });
}

export function useBtc24h() {
  return useQuery<Btc24hResponse>({
    queryKey: ["market", "btc", "24h"],
    queryFn: () => tradingApi.getBtc24h(),
    refetchInterval: 5000,
    retry: 2,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation<PlaceOrderResponse, Error, PlaceOrderRequest>({
    mutationFn: (payload) => tradingApi.placeOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "dashboard"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, CancelOrderRequest>({
    mutationFn: (payload) => tradingApi.cancelOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "dashboard"] });
    },
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, ClosePositionRequest>({
    mutationFn: (payload) => tradingApi.closePosition(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading", "dashboard"] });
    },
  });
}
