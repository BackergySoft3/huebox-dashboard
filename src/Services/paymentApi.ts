import { api } from "./http.service";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  WithdrawRequest,
  WithdrawResponse,
  SendRequest,
  SendResponse,
  WalletBalance,
  TransactionHistory,
} from "../Interfaces/wallet";

export interface CreateOrderRequestExtended extends CreateOrderRequest {
  provider?: string;
  fiat?: string;
  coin?: string;
}

export interface WithdrawRequestExtended extends WithdrawRequest {
  provider?: string;
  coin?: string;
}

export const paymentApi = {
  createOrder: async (data: CreateOrderRequestExtended): Promise<CreateOrderResponse> => {
    const response = await api.post<CreateOrderResponse>("/api/payment/create-order", data);
    return response.data;
  },
};

export const walletApi = {
  getBalance: async (): Promise<WalletBalance> => {
    const response = await api.get<WalletBalance>("/api/wallet/balance");
    return response.data;
  },
  getHistory: async (page: number, limit: number): Promise<{ data: TransactionHistory }> => {
    const response = await api.get<TransactionHistory>(
      `/api/wallet/history?page=${page}&limit=${limit}`
    );
    return { data: response.data };
  },
  withdraw: async (data: WithdrawRequestExtended): Promise<WithdrawResponse> => {
    const response = await api.post<WithdrawResponse>("/api/wallet/withdraw", data);
    return response.data;
  },
  send: async (data: SendRequest): Promise<SendResponse> => {
    const response = await api.post<SendResponse>("/api/wallet/send", data);
    return response.data;
  },
};
