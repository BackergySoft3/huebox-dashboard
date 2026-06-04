import axios from "axios";

// TypeScript interfaces
export interface CreateOrderRequest {
  amountUsd: number;
  fiat?: string;
  coin?: string;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
  network: string;
  coin?: string;
}

export interface SendRequest {
  toBybitUid: string;
  amount: number;
  coin?: string;
}

export interface CreateOrderResponse {
  checkoutUrl: string;
  orderId: string;
  orderNo: string;
}

export interface BalanceResponse {
  balance: number;
  coin: string;
}

export interface TransactionHistoryResponse {
  items: Transaction[];
  total: number;
  page: number;
  pages: number;
}

export interface WithdrawResponse {
  transferId: string;
  withdrawalId: string;
}

export interface SendResponse {
  transferId: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "transfer" | "send" | "receive" | "withdraw" | "fee" | "pnl";
  amountUsdt: number;
  status: "pending" | "confirmed" | "completed" | "failed";
  coin: string;
  txId: string | null;
  bybitTransferId: string | null;
  externalAddress: string | null;
  network: string | null;
  metadata: Record<string, any>;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// Axios Instance configuration
const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "";
const baseURL = `${apiBase}/api`;

const paymentAxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach Authorization header
paymentAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("huebox_access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// paymentApi export
export const paymentApi = {
  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await paymentAxiosInstance.post<CreateOrderResponse>("/payment/create-order", data);
    return response.data;
  },
};

// walletApi export
export const walletApi = {
  getBalance: async (): Promise<BalanceResponse> => {
    const response = await paymentAxiosInstance.get<BalanceResponse>("/wallet/balance");
    return response.data;
  },
  getHistory: async (page: number, limit: number): Promise<{ data: TransactionHistoryResponse }> => {
    const response = await paymentAxiosInstance.get<TransactionHistoryResponse>(
      `/wallet/history?page=${page}&limit=${limit}`
    );
    return { data: response.data };
  },
  withdraw: async (data: WithdrawRequest): Promise<WithdrawResponse> => {
    const response = await paymentAxiosInstance.post<WithdrawResponse>("/wallet/withdraw", data);
    return response.data;
  },
  send: async (data: SendRequest): Promise<SendResponse> => {
    const response = await paymentAxiosInstance.post<SendResponse>("/wallet/send", data);
    return response.data;
  },
};
