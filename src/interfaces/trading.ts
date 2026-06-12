import { TradeSide } from "../Enums/TradeSide.enum";
import { OrderType } from "../Enums/OrderType.enum";

export { TradeSide, OrderType };

export interface TradingBalance {
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
}

export interface TradingPosition {
  symbol: string;
  side: TradeSide;
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
}

export interface TradingOrder {
  orderId: string;
  symbol: string;
  side: TradeSide;
  orderType: OrderType;
  price: number;
  qty: number;
  cumExecQty: number;
  leavesQty: number;
  orderStatus: string;
  createdTime: number;
  updatedTime: number;
}

export interface ClosedPnlEntry {
  id: string;
  symbol: string;
  side: TradeSide;
  qty: number;
  orderId: string;
  closedPnl: number;
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  createdAt: number;
}

export interface TradingDashboardResponse {
  balance: TradingBalance;
  positions: TradingPosition[];
  orders: TradingOrder[];
  closedPnl: ClosedPnlEntry[];
}

export interface PlaceOrderRequest {
  symbol: string;
  side: TradeSide;
  orderType: OrderType;
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
  side: TradeSide;
  qty: number;
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
