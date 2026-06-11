import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi, walletApi } from "../services/paymentApi";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  WithdrawRequest,
  WithdrawResponse,
  SendRequest,
  SendResponse,
  WalletBalance,
  TransactionHistory,
} from "../interfaces/wallet";

export function useWalletBalance() {
  const query = useQuery<WalletBalance>({
    queryKey: ["wallet", "balance"],
    queryFn: () => walletApi.getBalance(),
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
    queryKey: ["wallet", "history", page, limit],
    queryFn: () => walletApi.getHistory(page, limit).then((r) => r.data),
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
  return useMutation<CreateOrderResponse, Error, CreateOrderRequest>({
    mutationFn: (payload) => paymentApi.createOrder(payload),
    onSuccess: (data) => {
      window.open(data.checkoutUrl, "_blank");
      if (data.orderNo) {
        localStorage.setItem("pending_order_no", data.orderNo);
      }
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation<WithdrawResponse, Error, WithdrawRequest>({
    mutationFn: (payload) => walletApi.withdraw(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "history"] });
    },
  });
}

export function useSend() {
  const queryClient = useQueryClient();

  return useMutation<SendResponse, Error, SendRequest>({
    mutationFn: (payload) => walletApi.send(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "history"] });
    },
  });
}
