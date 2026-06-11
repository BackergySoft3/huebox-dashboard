import axios from "axios";
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

export type {
  CreateOrderRequest,
  CreateOrderResponse,
  WithdrawRequest,
  WithdrawResponse,
  SendRequest,
  SendResponse,
  WalletBalance,
  TransactionHistory,
};

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
  getBalance: async (): Promise<WalletBalance> => {
    const response = await paymentAxiosInstance.get<WalletBalance>("/wallet/balance");
    return response.data;
  },
  getHistory: async (page: number, limit: number): Promise<{ data: TransactionHistory }> => {
    const response = await paymentAxiosInstance.get<TransactionHistory>(
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
