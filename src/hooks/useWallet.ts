import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type {
  WalletBalance,
  TransactionHistory,
  CreateOrderPayload,
  CreateOrderResponse,
  WithdrawPayload,
  SendPayload,
  Transaction,
} from "../types/wallet";

export function useWalletBalance() {
  const query = useQuery<WalletBalance>({
    queryKey: ["wallet", "balance"],
    queryFn: () => api.get("/api/wallet/balance").then((r) => r.data),
    refetchInterval: 15000,
    retry: 3,
    retryDelay: 1000,
  });

  return {
    balance: query.data?.balance ?? 0,
    coin: query.data?.coin ?? "USDT",
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useTransactionHistory(page: number, limit = 20) {
  const query = useQuery<TransactionHistory>({
    queryKey: ["wallet", "history", page],
    queryFn: () =>
      api
        .get(`/api/wallet/history?page=${page}&limit=${limit}`)
        .then((r) => r.data),
    retry: 2,
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    pages: query.data?.pages ?? 1,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateOrder() {
  return useMutation<CreateOrderResponse, Error, CreateOrderPayload>({
    mutationFn: (payload) =>
      api.post("/api/payment/create-order", payload).then((r) => r.data),
    onSuccess: (data) => {
      window.open(data.checkoutUrl, "_blank");
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, WithdrawPayload>({
    mutationFn: (payload) =>
      api.post("/api/wallet/withdraw", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "history", 1] });
    },
  });
}

export function useSend() {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, SendPayload>({
    mutationFn: (payload) =>
      api.post("/api/wallet/send", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "history", 1] });
    },
  });
}
