import axios from "axios";
import { getAuthCookie, AUTH_COOKIE_KEYS } from "../Helpers/cookieAuth";
import type {
  PlaceOrderRequest,
  PlaceOrderResponse,
  CancelOrderRequest,
  ClosePositionRequest,
  TradingDashboardResponse,
  Candle,
  Btc24hResponse,
} from "../Interfaces/trading";

export type {
  PlaceOrderRequest,
  PlaceOrderResponse,
  CancelOrderRequest,
  ClosePositionRequest,
  TradingDashboardResponse,
  Candle,
  Btc24hResponse,
};

// Axios Instance configuration
const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || "";
const baseURL = `${apiBase}/api`;

const tradingAxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach Authorization header
tradingAxiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// tradingApi export
export const tradingApi = {
  getTradingDashboard: async (): Promise<TradingDashboardResponse> => {
    const response = await tradingAxiosInstance.get<TradingDashboardResponse>("/trading/dashboard");
    return response.data;
  },

  placeOrder: async (data: PlaceOrderRequest): Promise<PlaceOrderResponse> => {
    const response = await tradingAxiosInstance.post<PlaceOrderResponse>("/trading/order", data);
    return response.data;
  },

  cancelOrder: async (data: CancelOrderRequest): Promise<{ success: boolean }> => {
    const response = await tradingAxiosInstance.post<{ success: boolean }>("/trading/order/cancel", data);
    return response.data;
  },

  closePosition: async (data: ClosePositionRequest): Promise<{ success: boolean }> => {
    const response = await tradingAxiosInstance.post<{ success: boolean }>("/trading/position/close", data);
    return response.data;
  },

  getBtcCandles: async (interval: string, limit = 96): Promise<Candle[]> => {
    const response = await tradingAxiosInstance.get<Candle[]>(
      `/market/btc/candles?interval=${interval}&limit=${limit}`
    );
    return response.data;
  },

  getBtc24h: async (): Promise<Btc24hResponse> => {
    const response = await tradingAxiosInstance.get<Btc24hResponse>("/market/btc/24h");
    return response.data;
  },
};
