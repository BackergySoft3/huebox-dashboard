// FIX Critical-1: Replaced isolated tradingAxiosInstance with the shared api
// client from http.service.ts. The shared client carries the 401 refresh
// interceptor queue, preventing silent failures when the JWT expires.
import { api } from "./http.service";
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

// tradingApi export — all calls go through the shared Axios instance
export const tradingApi = {
  getTradingDashboard: async (): Promise<TradingDashboardResponse> => {
    const response = await api.get<TradingDashboardResponse>("/api/trading/dashboard");
    return response.data;
  },

  placeOrder: async (data: PlaceOrderRequest): Promise<PlaceOrderResponse> => {
    const response = await api.post<PlaceOrderResponse>("/api/trading/order", data);
    return response.data;
  },

  cancelOrder: async (data: CancelOrderRequest): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>("/api/trading/order/cancel", data);
    return response.data;
  },

  closePosition: async (data: ClosePositionRequest): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>("/api/trading/position/close", data);
    return response.data;
  },

  getBtcCandles: async (interval: string, limit = 96): Promise<Candle[]> => {
    const response = await api.get<Candle[]>(
      `/api/market/btc/candles?interval=${interval}&limit=${limit}`
    );
    return response.data;
  },

  getBtc24h: async (): Promise<Btc24hResponse> => {
    const response = await api.get<Btc24hResponse>("/api/market/btc/24h");
    return response.data;
  },
};
