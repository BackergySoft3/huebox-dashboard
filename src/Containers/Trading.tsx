import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Trash2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Coins,
  Eye
} from "lucide-react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import {
  useTradingDashboard,
  useBtcCandles,
  useBtc24h,
  usePlaceOrder,
  useCancelOrder,
  useClosePosition
} from "../Hooks/useTrading";
import { useAuthStore } from "../State/auth";
import { cn } from "../Helpers/utils";
import { OrderType } from "../Enums/OrderType.enum";
import { TradeSide } from "../Enums/TradeSide.enum";
import { ChartInterval } from "../Enums/ChartInterval.enum";

const DEVELOPER_ACCOUNT = "client@huebox.dev.com";


const CHART_INTERVAL_LABELS: Record<ChartInterval, string> = {
  [ChartInterval.Minutes15]:  "15M",
  [ChartInterval.Minutes60]:  "1H",
  [ChartInterval.Minutes240]: "4H",
  [ChartInterval.Daily]:      "1D",
};

export function Trading() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin)();
  const isDeveloperAccount = user?.email === DEVELOPER_ACCOUNT;
  // Clients (non-developer, non-admin users) get read-only Live Markets
  const isReadOnly = !isAdmin && !isDeveloperAccount;

  const [activeTab, setActiveTab] = useState<"positions" | "orders" | "closedPnl">("positions");
  const [chartInterval, setChartInterval] = useState<ChartInterval>(ChartInterval.Minutes15);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.Limit);
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  const { data: dashboard, isLoading: isDashboardLoading } = useTradingDashboard();
  const { data: candles, isLoading: isCandlesLoading } = useBtcCandles(chartInterval);
  const { data: ticker } = useBtc24h();

  const placeOrderMutation = usePlaceOrder();
  const cancelOrderMutation = useCancelOrder();
  const closePositionMutation = useClosePosition();

  useEffect(() => {
    if (ticker?.lastPrice && !limitPrice) {
      setLimitPrice(Number(ticker.lastPrice).toString());
    }
  }, [ticker, limitPrice]);

  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setActionError("");
    setTimeout(() => setActionSuccess(""), 4000);
  };

  const triggerError = (msg: string) => {
    setActionError(msg);
    setActionSuccess("");
    setTimeout(() => setActionError(""), 4000);
  };

  const hasNoBybitAccount =
    (!dashboard && !isDashboardLoading) ||
    (placeOrderMutation.error?.message?.includes("No Bybit account") || false);

  const lastPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
  const priceChange = ticker ? parseFloat(ticker.price24hPcnt) * 100 : 0;
  const isUp = priceChange >= 0;

  const handlePercentClick = (percent: number) => {
    const available = dashboard?.balance?.totalAvailableBalance || 0;
    const price = orderType === OrderType.Limit ? parseFloat(limitPrice) || lastPrice : lastPrice;
    if (price > 0 && available > 0) {
      const computedQty = (available * (percent / 100)) / price;
      setQty(computedQty.toFixed(3));
    }
  };

  const handlePlaceOrder = async (side: TradeSide) => {
    setActionError("");
    setActionSuccess("");
    const parsedQty = parseFloat(qty);
    const parsedPrice = parseFloat(limitPrice);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      triggerError("Please enter a valid order quantity.");
      return;
    }

    if (orderType === OrderType.Limit && (isNaN(parsedPrice) || parsedPrice <= 0)) {
      triggerError("Please enter a valid limit price.");
      return;
    }

    try {
      await placeOrderMutation.mutateAsync({
        symbol: "BTCUSDT",
        side,
        orderType,
        qty: parsedQty,
        price: orderType === OrderType.Limit ? parsedPrice : undefined,
      });
      triggerSuccess(`Successfully placed ${orderType} ${side.toUpperCase()} order!`);
      setQty("");
    } catch (err: any) {
      triggerError(err.message || "Failed to place order.");
    }
  };

  const handleCancelOrder = async (symbol: string, orderId: string) => {
    try {
      await cancelOrderMutation.mutateAsync({ symbol, orderId });
      triggerSuccess("Order cancelled successfully.");
    } catch (err: any) {
      triggerError(err.message || "Failed to cancel order.");
    }
  };

  const handleClosePosition = async (symbol: string, side: TradeSide, qty: number) => {
    try {
      await closePositionMutation.mutateAsync({ symbol, side, qty });
      triggerSuccess("Position close order submitted successfully.");
    } catch (err: any) {
      triggerError(err.message || "Failed to close position.");
    }
  };

  const candlesData = (candles || []).map((c) => {
    const fmt = chartInterval === ChartInterval.Daily ? "MMM dd" : "HH:mm";
    return {
      ...c,
      timeFormatted: format(new Date(c.timestamp), fmt),
    };
  });

  if (isDashboardLoading && !dashboard) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center font-mono text-xs text-muted-foreground gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span>Loading Bybit Live Session Data...</span>
      </div>
    );
  }

  if (hasNoBybitAccount) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-200">No Bybit Account Linked</h2>
        <p className="text-muted-foreground text-sm font-mono mt-3 leading-relaxed">
          It looks like your sub-account has not been provisioned or is missing the proper API credentials.
        </p>
        <p className="text-muted-foreground text-xs font-mono mt-2 bg-muted/40 p-3 rounded border border-border/55">
          Please check the **System Settings** page to provision/verify your Bybit Sub-Account settings or contact admin support.
        </p>
        <Button className="mt-8 gap-2" variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  const balance = dashboard?.balance || {
    totalEquity: 0,
    totalWalletBalance: 0,
    totalAvailableBalance: 0,
    totalUnrealisedPnl: 0,
    totalInitialMargin: 0,
    totalMaintenanceMargin: 0,
    accountLTV: 0,
    usdt: { walletBalance: 0, availableToWithdraw: 0, unrealisedPnl: 0, cumRealisedPnl: 0 }
  };

  const positions = dashboard?.positions || [];
  const orders = dashboard?.orders || [];
  const closedPnl = dashboard?.closedPnl || [];

  const marginRatio = balance.totalEquity > 0
    ? (balance.totalMaintenanceMargin / balance.totalEquity) * 100
    : 0;

  const getMarginBarColor = (ratio: number) => {
    if (ratio < 40) return "bg-emerald-500";
    if (ratio < 75) return "bg-amber-500";
    return "bg-red-500 animate-pulse";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-12">
      {/* Read-only badge for client mode */}
      {isReadOnly && (
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-md">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span>Live Markets — Read-Only View. Trading actions are managed automatically by your bot.</span>
        </div>
      )}
      {/* 1. TICKER HEADERS BAR */}
      <div className="bg-[#0e0f12]/80 border border-border/30 rounded-lg p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-6 font-mono">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 text-xs font-mono">
            LIVE SESSION
          </Badge>
          <span className="text-lg font-bold text-slate-100">BTCUSDT</span>
          <span className="text-[10px] text-muted-foreground">USDT PERPETUAL</span>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-xs">
          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider mb-0.5">LAST PRICE</div>
            <div className={cn("text-base font-bold", isUp ? "text-emerald-400" : "text-rose-500")}>
              ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider mb-0.5">24H CHANGE</div>
            <div className={cn("font-bold flex items-center gap-1", isUp ? "text-emerald-400" : "text-rose-500")}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider mb-0.5">24H HIGH</div>
            <div className="font-semibold text-slate-300">
              ${ticker ? parseFloat(ticker.highPrice24h).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider mb-0.5">24H LOW</div>
            <div className="font-semibold text-slate-300">
              ${ticker ? parseFloat(ticker.lowPrice24h).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider mb-0.5">24H VOLUME (BTC)</div>
            <div className="font-semibold text-slate-400">
              {ticker ? parseFloat(ticker.volume24h).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Alert Banner */}
      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg p-3 text-xs font-mono flex items-center gap-2">
          <Activity className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. GRID BODY LAYOUT */}
      <div className={cn("grid grid-cols-1 gap-6 items-start", !isReadOnly ? "lg:grid-cols-12" : "")}>
        {/* LEFT COLUMN (CHART + TABS) */}
        <div className={!isReadOnly ? "lg:col-span-8 space-y-6" : "space-y-6"}>
          {/* A. CANDLESTICK / PRICE TIMELINE CHART */}
          <Card className="bg-[#0c0d10]/60 border-border/30 backdrop-blur-sm relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-mono tracking-wider">PRICE PROGRESSION (USDT)</CardTitle>
              </div>
              <div className="flex gap-1.5 font-mono text-[10px]">
                {Object.values(ChartInterval).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setChartInterval(interval)}
                    className={cn(
                      "px-2.5 py-1 rounded transition-all border",
                      chartInterval === interval
                        ? "bg-primary/20 text-primary border-primary/40 font-bold"
                        : "bg-card/40 border-border/10 text-muted-foreground hover:text-slate-200"
                    )}
                  >
                    {CHART_INTERVAL_LABELS[interval]}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isCandlesLoading ? (
                <div className="h-[400px] flex items-center justify-center font-mono text-xs text-muted-foreground">
                  Refreshing candlestick feeds...
                </div>
              ) : candlesData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center font-mono text-xs text-muted-foreground">
                  No chart data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={candlesData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#181a20" />
                    <XAxis dataKey="timeFormatted" stroke="#444" tick={{ fill: "#777", fontSize: 9 }} />
                    <YAxis
                      yAxisId="price"
                      domain={["auto", "auto"]}
                      stroke="#444"
                      orientation="right"
                      tickFormatter={(val) => `$${val}`}
                      tick={{ fill: "#777", fontSize: 9 }}
                    />
                    <YAxis yAxisId="volume" domain={[0, "auto"]} hide={true} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1118", borderColor: "#222", color: "#eee" }}
                      labelStyle={{ color: "#888", fontSize: "10px", fontFamily: "monospace" }}
                      itemStyle={{ fontSize: "11px", fontFamily: "monospace" }}
                    />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="close"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                      strokeWidth={1.8}
                      name="Price"
                    />
                    <Bar
                      yAxisId="volume"
                      dataKey="volume"
                      fill="#3b82f6"
                      opacity={0.06}
                      barSize={5}
                      name="Volume"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* B. POSITIONS, ORDERS, CLOSED PNL TABS */}
          <div className="bg-[#0c0d10]/40 border border-border/30 rounded-lg overflow-hidden backdrop-blur-sm">
            <div className="border-b border-border/20 bg-card/25 px-4 flex gap-1.5">
              {[
                { id: "positions", label: `POSITIONS (${positions.length})` },
                { id: "orders", label: `ACTIVE ORDERS (${orders.length})` },
                { id: "closedPnl", label: "CLOSED PNL" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-4 py-3 text-xs font-mono font-semibold tracking-wider transition-all border-b-2 -mb-[1px]",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-slate-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-x-auto min-h-[220px]">
              {/* POSITIONS TAB */}
              {activeTab === "positions" && (
                <div>
                  {positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono text-xs gap-2">
                      <HelpCircle className="w-5 h-5 text-muted-foreground/50" />
                      <span>No active positions on Bybit.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground">
                          <th className="pb-2">SYMBOL</th>
                          <th className="pb-2">SIDE</th>
                          <th className="pb-2 text-right">SIZE</th>
                          <th className="pb-2 text-right">ENTRY</th>
                          <th className="pb-2 text-right">MARK</th>
                          <th className="pb-2 text-right">LIQUIDATION</th>
                          <th className="pb-2">UNREALIZED PNL</th>
                          <th className="pb-2 text-right">LEVERAGE</th>
                          {!isReadOnly && <th className="pb-2 text-right">ACTION</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos) => {
                          const isLong = pos.side === TradeSide.Buy;
                          const pnl = pos.unrealisedPnl;
                          return (
                            <tr key={pos.symbol} className="border-b border-border/10 hover:bg-muted/10">
                              <td className="py-2.5 font-bold">{pos.symbol}</td>
                              <td className="py-2.5">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    isLong
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  )}
                                >
                                  {isLong ? "LONG" : "SHORT"}
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-semibold">{pos.size} BTC</td>
                              <td className="py-2.5 text-right">${pos.avgPrice.toFixed(2)}</td>
                              <td className="py-2.5 text-right">${pos.markPrice.toFixed(2)}</td>
                              <td className="py-2.5 text-right text-amber-500">
                                {pos.liqPrice > 0 ? `$${pos.liqPrice.toFixed(2)}` : "None"}
                              </td>
                              <td className={cn("py-2.5 font-bold", pnl >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                              </td>
                              <td className="py-2.5 text-right text-slate-300">{pos.leverage}x</td>
                              {!isReadOnly && (
                                <td className="py-2.5 text-right">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-[10px] px-2.5 font-mono"
                                    onClick={() => handleClosePosition(pos.symbol, pos.side, pos.size)}
                                    disabled={closePositionMutation.isPending}
                                  >
                                    {closePositionMutation.isPending ? "Closing..." : "Market Close"}
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ACTIVE ORDERS TAB */}
              {activeTab === "orders" && (
                <div>
                  {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono text-xs gap-2">
                      <HelpCircle className="w-5 h-5 text-muted-foreground/50" />
                      <span>No open orders on Bybit.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground">
                          <th className="pb-2">SYMBOL</th>
                          <th className="pb-2">TYPE</th>
                          <th className="pb-2">SIDE</th>
                          <th className="pb-2 text-right">PRICE</th>
                          <th className="pb-2 text-right">QTY</th>
                          <th className="pb-2 text-right">FILLED</th>
                          <th className="pb-2 text-right">STATUS</th>
                          <th className="pb-2 text-right">TIME</th>
                          {!isReadOnly && <th className="pb-2 text-right">ACTION</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const isBuy = order.side === TradeSide.Buy;
                          const fillPercent = order.qty > 0 ? (order.cumExecQty / order.qty) * 100 : 0;
                          return (
                            <tr key={order.orderId} className="border-b border-border/10 hover:bg-muted/10">
                              <td className="py-2.5 font-bold">{order.symbol}</td>
                              <td className="py-2.5 text-slate-300">{order.orderType}</td>
                              <td className="py-2.5">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    isBuy
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  )}
                                >
                                  {isBuy ? "BUY" : "SELL"}
                                </span>
                              </td>
                              <td className="py-2.5 text-right font-semibold">
                                {order.price > 0 ? `$${order.price.toFixed(2)}` : "Market"}
                              </td>
                              <td className="py-2.5 text-right">{order.qty}</td>
                              <td className="py-2.5 text-right">{fillPercent.toFixed(1)}%</td>
                              <td className="py-2.5 text-right">
                                <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 text-[9px]">
                                  {order.orderStatus}
                                </Badge>
                              </td>
                              <td className="py-2.5 text-right text-muted-foreground text-[10px]">
                                {format(new Date(order.createdTime), "MM-dd HH:mm:ss")}
                              </td>
                              {!isReadOnly && (
                                <td className="py-2.5 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleCancelOrder(order.symbol, order.orderId)}
                                    disabled={cancelOrderMutation.isPending}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* CLOSED PNL TAB */}
              {activeTab === "closedPnl" && (
                <div>
                  {closedPnl.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-mono text-xs gap-2">
                      <HelpCircle className="w-5 h-5 text-muted-foreground/50" />
                      <span>No closed PnL history.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground">
                          <th className="pb-2">SYMBOL</th>
                          <th className="pb-2">SIDE</th>
                          <th className="pb-2 text-right">QTY</th>
                          <th className="pb-2 text-right">ENTRY</th>
                          <th className="pb-2 text-right">EXIT</th>
                          <th className="pb-2 text-right">CLOSED PNL</th>
                          <th className="pb-2 text-right">LEVERAGE</th>
                          <th className="pb-2 text-right">TIME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedPnl.map((c, i) => {
                          const isBuy = c.side === TradeSide.Buy;
                          const pnl = c.closedPnl;
                          return (
                            <tr key={c.id || i} className="border-b border-border/10 hover:bg-muted/10">
                              <td className="py-2.5 font-bold">{c.symbol}</td>
                              <td className="py-2.5">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    isBuy
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  )}
                                >
                                  {isBuy ? "BUY" : "SELL"}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">{c.qty}</td>
                              <td className="py-2.5 text-right">${c.entryPrice.toFixed(2)}</td>
                              <td className="py-2.5 text-right">${c.exitPrice.toFixed(2)}</td>
                              <td className={cn("py-2.5 text-right font-bold", pnl >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                              </td>
                              <td className="py-2.5 text-right text-slate-400">{c.leverage}x</td>
                              <td className="py-2.5 text-right text-muted-foreground text-[10px]">
                                {format(new Date(c.createdAt), "MM-dd HH:mm:ss")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (ORDER PANEL + ASSETS) — developer/admin only */}
        {!isReadOnly && (
        <div className="lg:col-span-4 space-y-6">
          {/* A. ORDER ENTRY FORM */}
          <Card className="bg-[#0c0d10]/60 border-border/30 backdrop-blur-sm font-mono text-xs">
            <CardHeader className="border-b border-border/20 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono tracking-wider">PLACE ORDER</CardTitle>
                <div className="flex border border-border/30 rounded overflow-hidden">
                  {Object.values(OrderType).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold transition-all",
                        orderType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent text-muted-foreground hover:text-slate-200"
                      )}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Limit Price Input */}
              {orderType === OrderType.Limit && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>PRICE</span>
                    <button
                      onClick={() => setLimitPrice(ticker?.lastPrice ? Number(ticker.lastPrice).toString() : "")}
                      className="text-primary hover:underline"
                    >
                      LAST PRICE
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder="0.00"
                      className="bg-card/40 border-border/30 pl-3 pr-12 h-9 text-xs focus:ring-primary focus:border-primary font-mono text-slate-100"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground">USDT</span>
                  </div>
                </div>
              )}

              {/* Order Size Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>QUANTITY</span>
                  <span>MIN: 0.001 BTC</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0.000"
                    className="bg-card/40 border-border/30 pl-3 pr-12 h-9 text-xs focus:ring-primary focus:border-primary font-mono text-slate-100"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground">BTC</span>
                </div>
              </div>

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px] font-bold">
                {[10, 25, 50, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePercentClick(p)}
                    className="py-1 bg-muted/40 border border-border/10 rounded hover:bg-muted/70 hover:border-border/35 text-slate-300 transition-all"
                  >
                    {p}%
                  </button>
                ))}
              </div>

              {/* Dynamic Order Cost Details */}
              {parseFloat(qty) > 0 && (
                <div className="bg-[#0e1014]/50 border border-border/10 rounded p-2.5 font-mono text-[10px] text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>ORDER VALUE:</span>
                    <span className="font-semibold text-slate-300">
                      ${(parseFloat(qty) * (orderType === OrderType.Limit ? parseFloat(limitPrice) || lastPrice : lastPrice)).toFixed(2)} USDT
                    </span>
                  </div>
                  {orderType === OrderType.Limit && (
                    <div className="flex justify-between">
                      <span>TIME IN FORCE:</span>
                      <span className="font-semibold text-slate-400">GTC</span>
                    </div>
                  )}
                </div>
              )}

              {/* Order Submission Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 flex flex-col justify-center items-center rounded border border-emerald-500/20"
                  onClick={() => handlePlaceOrder(TradeSide.Buy)}
                  disabled={placeOrderMutation.isPending}
                >
                  <span className="text-xs font-bold leading-tight">BUY / LONG</span>
                  <span className="text-[8px] font-normal text-emerald-100 opacity-80 leading-none">ASK PRICE</span>
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-10 flex flex-col justify-center items-center rounded border border-rose-500/20"
                  onClick={() => handlePlaceOrder(TradeSide.Sell)}
                  disabled={placeOrderMutation.isPending}
                >
                  <span className="text-xs font-bold leading-tight">SELL / SHORT</span>
                  <span className="text-[8px] font-normal text-rose-100 opacity-80 leading-none">BID PRICE</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* B. ACCOUNT SUMMARY PANEL */}
          <Card className="bg-[#0c0d10]/60 border-border/30 backdrop-blur-sm font-mono text-xs">
            <CardHeader className="border-b border-border/20 pb-3">
              <CardTitle className="text-sm font-mono tracking-wider flex items-center justify-between">
                <span>ASSET SUMMARY</span>
                <span className="text-[10px] text-muted-foreground font-normal">UNIFIED ACCOUNT</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[10px]">TOTAL EQUITY</span>
                  <span className="text-base font-bold text-slate-100">${balance.totalEquity.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/10 pt-2.5">
                  <span className="text-muted-foreground text-[10px]">WALLET BALANCE</span>
                  <span className="font-semibold text-slate-200">${balance.totalWalletBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[10px]">AVAILABLE BALANCE</span>
                  <span className="font-semibold text-primary">${balance.totalAvailableBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/10 pt-2.5">
                  <span className="text-muted-foreground text-[10px]">INITIAL MARGIN</span>
                  <span className="font-semibold text-slate-300">${balance.totalInitialMargin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[10px]">MAINTENANCE MARGIN</span>
                  <span className="font-semibold text-amber-500">${balance.totalMaintenanceMargin.toFixed(2)}</span>
                </div>
              </div>

              {/* Margin usage meter */}
              <div className="space-y-1.5 border-t border-border/10 pt-3">
                <div className="flex justify-between text-[9px] text-muted-foreground font-bold">
                  <span>MARGIN RATIO</span>
                  <span>{marginRatio.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#18191e] h-2 rounded overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500", getMarginBarColor(marginRatio))}
                    style={{ width: `${Math.min(marginRatio, 100)}%` }}
                  />
                </div>
                {marginRatio >= 80 && (
                  <div className="text-[9px] text-rose-400 font-bold flex items-center gap-1 mt-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>RISK HIGH: CLOSE POSITIONS OR DEPOSIT USDT</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}
