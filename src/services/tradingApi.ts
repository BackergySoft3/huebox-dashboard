import axios from "axios";

// TypeScript interfaces
export interface PlaceOrderRequest {
  symbol: string;
  side: "Buy" | "Sell";
  orderType: "Market" | "Limit";
  qty: number;
  price?: number;
}

export interface PlaceOrderResponse {
  success: boolean;
  orderId: string;
  orderLinkId?: string;
}

export interface CancelOrderRequest {
  symbol: string;
  orderId: string;
}

export interface ClosePositionRequest {
  symbol: string;
  side: "Buy" | "Sell";
  qty: number;
}

export interface TradingDashboardResponse {
  balance: {
    totalEquity: number;
    totalWalletBalance: number;
    totalAvailableBalance: number;
    totalUnrealisedPnl: number;
    totalInitialMargin: number;
    totalMaintenanceMargin: number;
    accountLTV: number;
    usdt: {
      walletBalance: number;
      availableToWithdraw: number;
      unrealisedPnl: number;
      cumRealisedPnl: number;
    };
  };
  positions: Array<{
    symbol: string;
    side: "Buy" | "Sell";
    size: number;
    positionValue: number;
    avgPrice: number;
    markPrice: number;
    liqPrice: number;
    unrealisedPnl: number;
    cumRealisedPnl: number;
    leverage: number;
    tpslMode: string;
    createdTime: number;
    updatedTime: number;
  }>;
  orders: Array<{
    orderId: string;
    symbol: string;
    side: "Buy" | "Sell";
    orderType: "Market" | "Limit";
    price: number;
    qty: number;
    cumExecQty: number;
    leavesQty: number;
    orderStatus: string;
    createdTime: number;
    updatedTime: number;
  }>;
  closedPnl: Array<{
    id: string;
    symbol: string;
    side: "Buy" | "Sell";
    qty: number;
    orderId: string;
    closedPnl: number;
    entryPrice: number;
    exitPrice: number;
    leverage: number;
    createdAt: number;
  }>;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export interface Btc24hResponse {
  symbol: string;
  lastPrice: string;
  prevPrice24h: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  volume24h: string;
  turnover24h: string;
}

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
    const token = localStorage.getItem("access_token") || localStorage.getItem("huebox_access_token");
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
