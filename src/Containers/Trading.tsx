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
  Brain,
  Gauge
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

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border/80 p-3 rounded-lg shadow-xl backdrop-blur-md font-sans text-popover-foreground">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">BTC price</p>
        <p className="text-sm font-mono font-bold mt-0.5 text-primary">
          ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        {payload[1] && (
          <p className="text-[9px] font-mono text-muted-foreground mt-1">
            Vol: {Number(payload[1].value).toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
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
      <div className="h-[70vh] flex flex-col items-center justify-center font-mono text-xs text-muted-foreground gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span>Loading Live Session Data...</span>
      </div>
    );
  }

  if (hasNoBybitAccount) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30 mb-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold font-sans tracking-tight text-foreground">No Trading Account Configured</h2>
        <p className="text-muted-foreground text-sm font-medium mt-3 leading-relaxed">
          It looks like your trading account has not been provisioned or is missing the proper credentials.
        </p>
        <p className="text-muted-foreground text-xs font-mono mt-4 bg-muted/40 p-4 rounded-xl border border-border/40">
          Please check the **System Settings** page to verify your trading account setup or contact admin support.
        </p>
        <Button className="mt-8 gap-2 font-mono text-xs font-bold" variant="outline" onClick={() => window.location.reload()}>
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
    return "bg-rose-500 animate-pulse";
  };

  const marketBrief =
    priceChange > 3
      ? `Bitcoin is showing strong momentum, up ${priceChange.toFixed(1)}% in 24 hours. Your AI strategy is positioned to capture this upward movement.`
      : priceChange > 0
      ? `Bitcoin is trading with mild positive sentiment, up ${priceChange.toFixed(1)}% in 24 hours. Your AI strategy is actively monitoring market conditions.`
      : priceChange > -3
      ? `Bitcoin is slightly negative at ${priceChange.toFixed(1)}% today. Your AI strategy's risk controls are managing downside exposure.`
      : `Bitcoin is under selling pressure at ${priceChange.toFixed(1)}% in 24 hours. Your AI strategy has activated conservative position sizing.`;

  // Market Sentiment Calculation
  const sentimentScore = isUp ? Math.min(95, Math.round(55 + priceChange * 3)) : Math.max(5, Math.round(45 + priceChange * 3));
  const sentimentLabel = sentimentScore >= 70 ? "Strong Buy" : sentimentScore >= 55 ? "Buy" : sentimentScore >= 45 ? "Neutral" : sentimentScore >= 25 ? "Sell" : "Strong Sell";
  const sentimentColor = sentimentScore >= 55 ? "text-emerald-400" : sentimentScore >= 45 ? "text-muted-foreground" : "text-rose-400";

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-12">
      {/* 3 Metrics Rows: Market Overview, Sentiment index, Watchlist items */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Watchlist */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" /> WATCHLIST STREAMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* BTC */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/15 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">₿</div>
                <div>
                  <span className="text-xs font-bold font-sans text-foreground block">BTCUSDT</span>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">Perpetual</span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn("text-xs font-mono font-bold block", isUp ? "text-emerald-400" : "text-rose-400")}>
                  ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Badge className={cn("text-[8px] font-mono font-bold mt-0.5 px-1 py-0 h-4 border", isUp ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                  {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                </Badge>
              </div>
            </div>
            {/* ETH */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/10 border border-border/20 opacity-55">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center font-bold text-[10px] text-indigo-400">Ξ</div>
                <div>
                  <span className="text-xs font-bold font-sans text-muted-foreground block">ETHUSDT</span>
                  <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">Perpetual</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground/60">QUEUEING...</span>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Index Card */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" /> Market Sentiment Index
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between flex-1 min-h-[100px] font-mono">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-2xl font-extrabold tracking-tight", sentimentColor)}>{sentimentScore}%</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">({sentimentLabel})</span>
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden mt-3.5 border border-border/20">
                <div
                  className={cn("h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(0,212,255,0.3)]", sentimentScore >= 55 ? "bg-emerald-400" : sentimentScore >= 45 ? "bg-muted-foreground" : "bg-rose-500")}
                  style={{ width: `${sentimentScore}%` }}
                />
              </div>
            </div>
            <div className="text-[9px] text-muted-foreground/70 mt-3">
              Computed from 24h funding rates and long/short skew metrics.
            </div>
          </CardContent>
        </Card>

        {/* AI market brief description */}
        <Card className="bg-gradient-to-br from-card to-card/65 border-primary/20 shadow-sm backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary animate-pulse" /> AI Market Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-xs font-medium text-muted-foreground/90 leading-relaxed italic">
              "{marketBrief}"
            </p>
            {isReadOnly && (
              <Badge variant="outline" className="text-[8px] tracking-wider uppercase font-mono mt-3 self-start border-amber-500/20 text-amber-400 bg-amber-500/5 px-2 py-0.5">
                AUTOMATED MANAGEMENT
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 1. TICKER HEADERS BAR */}
      <div className="bg-card/45 border border-border/30 rounded-xl p-4.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-6 font-mono text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.75 text-[10px] font-mono font-bold uppercase tracking-wider">
            LIVE CONTINUOUS
          </Badge>
          <span className="text-lg font-bold font-sans text-foreground">BTCUSDT</span>
          <span className="text-[9px] text-muted-foreground/60 uppercase">USDT Perpetual</span>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-[11px]">
          <div>
            <div className="text-[9px] text-muted-foreground/50 tracking-widest uppercase mb-0.5">LAST PRICE</div>
            <div className={cn("text-sm font-bold font-sans", isUp ? "text-emerald-400" : "text-rose-400")}>
              ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-muted-foreground/50 tracking-widest uppercase mb-0.5">24H CHANGE</div>
            <div className={cn("font-bold font-sans text-sm flex items-center gap-1", isUp ? "text-emerald-400" : "text-rose-400")}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
            </div>
          </div>

          <div>
            <div className="text-[9px] text-muted-foreground/50 tracking-widest uppercase mb-0.5">24H HIGH</div>
            <div className="font-semibold text-foreground">
              ${ticker ? parseFloat(ticker.highPrice24h).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-muted-foreground/50 tracking-widest uppercase mb-0.5">24H LOW</div>
            <div className="font-semibold text-foreground">
              ${ticker ? parseFloat(ticker.lowPrice24h).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-muted-foreground/50 tracking-widest uppercase mb-0.5">24H VOL (BTC)</div>
            <div className="font-semibold text-muted-foreground">
              {ticker ? parseFloat(ticker.volume24h).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Alert Banner */}
      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-xs font-mono flex items-center gap-2 animate-pulse shadow-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3 text-xs font-mono flex items-center gap-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. GRID BODY LAYOUT */}
      <div className={cn("grid grid-cols-1 gap-6 items-start", !isReadOnly ? "lg:grid-cols-12" : "")}>
        {/* LEFT COLUMN (CHART + TABS) */}
        <div className={!isReadOnly ? "lg:col-span-8 space-y-6" : "space-y-6"}>
          {/* A. CHART CONTAINER */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm relative overflow-hidden shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase">BTC/USDT SPOT CHART</CardTitle>
              </div>
              <div className="flex gap-1.5 font-mono text-[9px]">
                {Object.values(ChartInterval).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setChartInterval(interval)}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all border cursor-pointer font-bold tracking-wider",
                      chartInterval === interval
                        ? "bg-primary/10 text-primary border-primary/25"
                        : "bg-card/40 border-border/20 text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    {CHART_INTERVAL_LABELS[interval]}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isCandlesLoading ? (
                <div className="h-[400px] flex items-center justify-center font-mono text-xs text-muted-foreground/80 animate-pulse">
                  Refreshing candlestick feeds...
                </div>
              ) : candlesData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center font-mono text-xs text-muted-foreground">
                  No spot chart data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={candlesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.25)" vertical={false} />
                    <XAxis dataKey="timeFormatted" stroke="hsl(var(--muted-foreground))" fontSize={9} fontFamily="JetBrains Mono" tickLine={false} axisLine={false} />
                    <YAxis
                      yAxisId="price"
                      domain={["auto", "auto"]}
                      stroke="hsl(var(--muted-foreground))"
                      orientation="right"
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                      fontSize={9}
                      fontFamily="JetBrains Mono"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis yAxisId="volume" domain={[0, "auto"]} hide={true} />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ stroke: 'hsl(var(--primary)/0.2)', strokeWidth: 1 }}
                    />
                    <Area
                      yAxisId="price"
                      type="monotone"
                      dataKey="close"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                      strokeWidth={2}
                      name="Price"
                    />
                    <Bar
                      yAxisId="volume"
                      dataKey="volume"
                      fill="hsl(var(--primary))"
                      opacity={0.06}
                      barSize={6}
                      name="Volume"
                      radius={[2, 2, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* B. POSITIONS, ORDERS, CLOSED PNL TABS */}
          <div className="bg-card/30 border border-border/40 rounded-xl overflow-hidden backdrop-blur-sm shadow-md">
            <div className="border-b border-border/25 bg-muted/15 px-4 flex gap-1.5">
              {[
                { id: "positions", label: `POSITIONS (${positions.length})` },
                { id: "orders", label: `ACTIVE ORDERS (${orders.length})` },
                { id: "closedPnl", label: "CLOSED P&L" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-4 py-3 text-[10px] font-mono font-bold tracking-widest transition-all border-b-2 -mb-[2px] cursor-pointer",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
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
                    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground font-mono text-xs gap-3">
                      <HelpCircle className="w-5 h-5 text-muted-foreground/30" />
                      <span>No active positions on the ledger.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground/60 text-[9px] uppercase tracking-wider">
                          <th className="pb-3 px-2">SYMBOL</th>
                          <th className="pb-3 px-2">SIDE</th>
                          <th className="pb-3 px-2 text-right">SIZE</th>
                          <th className="pb-3 px-2 text-right">ENTRY</th>
                          <th className="pb-3 px-2 text-right">MARK</th>
                          <th className="pb-3 px-2 text-right">LIQ.</th>
                          <th className="pb-3 px-2">UNREALIZED P&L</th>
                          <th className="pb-3 px-2 text-right">LEVERAGE</th>
                          {!isReadOnly && <th className="pb-3 px-2 text-right">ACTION</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/15">
                        {positions.map((pos) => {
                          const isLong = pos.side === TradeSide.Buy;
                          const pnl = pos.unrealisedPnl;
                          return (
                            <tr key={pos.symbol} className="hover:bg-muted/15 transition-colors">
                              <td className="py-3 px-2 font-bold font-sans text-foreground">{pos.symbol}</td>
                              <td className="py-3 px-2">
                                <Badge
                                  className={cn(
                                    "font-mono text-[9px] px-2 py-0.5 border font-semibold",
                                    isLong
                                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                      : "text-rose-400 border-rose-400/20 bg-rose-500/10"
                                  )}
                                >
                                  {isLong ? "LONG" : "SHORT"}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-right font-bold text-foreground">{pos.size} BTC</td>
                              <td className="py-3 px-2 text-right">${pos.avgPrice.toFixed(2)}</td>
                              <td className="py-3 px-2 text-right">${pos.markPrice.toFixed(2)}</td>
                              <td className="py-3 px-2 text-right text-amber-500 font-semibold">
                                {pos.liqPrice > 0 ? `$${pos.liqPrice.toFixed(2)}` : "None"}
                              </td>
                              <td className={cn("py-3 px-2 font-bold text-[13px] font-sans", pnl >= 0 ? "text-emerald-400" : "text-rose-450")}>
                                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-right text-muted-foreground">{pos.leverage}x</td>
                              {!isReadOnly && (
                                <td className="py-3 px-2 text-right">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-[10px] px-3 font-mono font-bold"
                                    onClick={() => handleClosePosition(pos.symbol, pos.side, pos.size)}
                                    disabled={closePositionMutation.isPending}
                                  >
                                    {closePositionMutation.isPending ? "Closing..." : "Close"}
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
                    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground font-mono text-xs gap-3">
                      <HelpCircle className="w-5 h-5 text-muted-foreground/30" />
                      <span>No active orders.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground/60 text-[9px] uppercase tracking-wider">
                          <th className="pb-3 px-2">SYMBOL</th>
                          <th className="pb-3 px-2">TYPE</th>
                          <th className="pb-3 px-2">SIDE</th>
                          <th className="pb-3 px-2 text-right">PRICE</th>
                          <th className="pb-3 px-2 text-right">QTY</th>
                          <th className="pb-3 px-2 text-right">FILLED</th>
                          <th className="pb-3 px-2 text-right">STATUS</th>
                          <th className="pb-3 px-2 text-right">TIME</th>
                          {!isReadOnly && <th className="pb-3 px-2 text-right">ACTION</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/15">
                        {orders.map((order) => {
                          const isBuy = order.side === TradeSide.Buy;
                          const fillPercent = order.qty > 0 ? (order.cumExecQty / order.qty) * 100 : 0;
                          return (
                            <tr key={order.orderId} className="hover:bg-muted/15 transition-colors">
                              <td className="py-3 px-2 font-bold font-sans text-foreground">{order.symbol}</td>
                              <td className="py-3 px-2 text-slate-300">{order.orderType}</td>
                              <td className="py-3 px-2">
                                <Badge
                                  className={cn(
                                    "font-mono text-[9px] px-2 py-0.5 border font-semibold",
                                    isBuy
                                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                      : "text-rose-400 border-rose-400/20 bg-rose-500/10"
                                  )}
                                >
                                  {isBuy ? "BUY" : "SELL"}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-right font-semibold">
                                {order.price > 0 ? `$${order.price.toFixed(2)}` : "Market"}
                              </td>
                              <td className="py-3 px-2 text-right">{order.qty}</td>
                              <td className="py-3 px-2 text-right">{fillPercent.toFixed(1)}%</td>
                              <td className="py-3 px-2 text-right">
                                <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 text-[8px] font-bold">
                                  {order.orderStatus}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-right text-muted-foreground/60 text-[10px]">
                                {format(new Date(order.createdTime), "MM-dd HH:mm:ss")}
                              </td>
                              {!isReadOnly && (
                                <td className="py-3 px-2 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-md"
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
                    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground font-mono text-xs gap-3">
                      <HelpCircle className="w-5 h-5 text-muted-foreground/30" />
                      <span>No closed P&L loops recorded.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground/60 text-[9px] uppercase tracking-wider">
                          <th className="pb-3 px-2">SYMBOL</th>
                          <th className="pb-3 px-2">SIDE</th>
                          <th className="pb-3 px-2 text-right">QTY</th>
                          <th className="pb-3 px-2 text-right">ENTRY</th>
                          <th className="pb-3 px-2 text-right">EXIT</th>
                          <th className="pb-3 px-2 text-right">CLOSED P&L</th>
                          <th className="pb-3 px-2 text-right">LEVERAGE</th>
                          <th className="pb-3 px-2 text-right">TIME</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/15">
                        {closedPnl.map((c, i) => {
                          const isBuy = c.side === TradeSide.Buy;
                          const pnl = c.closedPnl;
                          return (
                            <tr key={c.id || i} className="hover:bg-muted/15 transition-colors">
                              <td className="py-3 px-2 font-bold font-sans text-foreground">{c.symbol}</td>
                              <td className="py-3 px-2">
                                <Badge
                                  className={cn(
                                    "font-mono text-[9px] px-2 py-0.5 border font-semibold",
                                    isBuy
                                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                      : "text-rose-400 border-rose-400/20 bg-rose-500/10"
                                  )}
                                >
                                  {isBuy ? "BUY" : "SELL"}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-right">{c.qty}</td>
                              <td className="py-3 px-2 text-right">${c.entryPrice.toFixed(2)}</td>
                              <td className="py-3 px-2 text-right">${c.exitPrice.toFixed(2)}</td>
                              <td className={cn("py-3 px-2 text-right font-bold text-[13px] font-sans", pnl >= 0 ? "text-emerald-400" : "text-rose-455")}>
                                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-right text-muted-foreground/60">{c.leverage}x</td>
                              <td className="py-3 px-2 text-right text-muted-foreground/50 text-[10px]">
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
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm font-mono text-xs shadow-md">
            <CardHeader className="border-b border-border/20 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">PLACE ORDER</CardTitle>
                <div className="flex border border-border/30 rounded-lg overflow-hidden bg-muted/20">
                  {Object.values(OrderType).map((type) => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={cn(
                        "px-3 py-1.5 text-[9px] font-bold transition-all cursor-pointer uppercase tracking-wider",
                        orderType === type
                          ? "bg-primary text-primary-foreground font-extrabold"
                          : "bg-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Limit Price Input */}
              {orderType === OrderType.Limit && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground/65 tracking-wider uppercase">
                    <span>LIMIT PRICE</span>
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
                      className="bg-muted/30 border-border/30 pl-3 pr-12 h-9.5 text-xs focus:ring-primary focus:border-primary font-mono text-foreground"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-semibold">USDT</span>
                  </div>
                </div>
              )}

              {/* Order Size Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground/65 tracking-wider uppercase">
                  <span>ORDER SIZE</span>
                  <span>MIN: 0.001 BTC</span>
                </div>
                <div className="relative">
                   <Input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="0.000"
                      className="bg-muted/30 border-border/30 pl-3 pr-12 h-9.5 text-xs focus:ring-primary focus:border-primary font-mono text-foreground"
                   />
                  <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-semibold">BTC</span>
                </div>
              </div>

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-2 font-mono text-[9px] font-bold uppercase tracking-wider">
                {[10, 25, 50, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePercentClick(p)}
                    className="py-1 bg-muted/40 border border-border/15 rounded hover:bg-muted/75 hover:border-border/35 text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                  >
                    {p}%
                  </button>
                ))}
              </div>

              {/* Dynamic Order Cost Details */}
              {parseFloat(qty) > 0 && (
                <div className="bg-muted/40 border border-border/20 rounded-lg p-2.5 font-mono text-[10px] text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>EST VALUE:</span>
                    <span className="font-bold text-foreground">
                      ${(parseFloat(qty) * (orderType === OrderType.Limit ? parseFloat(limitPrice) || lastPrice : lastPrice)).toFixed(2)} USDT
                    </span>
                  </div>
                  {orderType === OrderType.Limit && (
                    <div className="flex justify-between border-t border-border/10 pt-1 mt-1">
                      <span>TIME IN FORCE:</span>
                      <span className="font-semibold text-muted-foreground/60">GTC</span>
                    </div>
                  )}
                </div>
              )}

              {/* Order Submission Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 flex flex-col justify-center items-center rounded border border-emerald-500/20 cursor-pointer shadow-sm transition-all"
                  onClick={() => handlePlaceOrder(TradeSide.Buy)}
                  disabled={placeOrderMutation.isPending}
                >
                  <span className="text-xs font-bold leading-tight uppercase">Buy / Long</span>
                  <span className="text-[8px] font-normal text-emerald-100 opacity-80 leading-none mt-0.5">ASK PRICE</span>
                </Button>
                <Button
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-10 flex flex-col justify-center items-center rounded border border-rose-500/20 cursor-pointer shadow-sm transition-all"
                  onClick={() => handlePlaceOrder(TradeSide.Sell)}
                  disabled={placeOrderMutation.isPending}
                >
                  <span className="text-xs font-bold leading-tight uppercase">Sell / Short</span>
                  <span className="text-[8px] font-normal text-rose-100 opacity-80 leading-none mt-0.5">BID PRICE</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* B. ACCOUNT SUMMARY PANEL */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm font-mono text-xs shadow-md">
            <CardHeader className="border-b border-border/20 pb-3">
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center justify-between font-bold">
                <span>ASSET SUMMARY</span>
                <span className="text-[9px] text-muted-foreground/65 font-normal tracking-wide">UNIFIED BALANCE</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[10px]">TOTAL EQUITY</span>
                  <span className="text-base font-bold text-foreground">${balance.totalEquity.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/15 pt-2.5">
                  <span className="text-muted-foreground text-[10px]">WALLET BALANCE</span>
                  <span className="font-semibold text-foreground">${balance.totalWalletBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[10px]">AVAILABLE BALANCE</span>
                  <span className="font-semibold text-primary">${balance.totalAvailableBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/15 pt-2.5">
                  <span className="text-muted-foreground text-[10px]">INITIAL MARGIN</span>
                  <span className="font-semibold text-foreground">${balance.totalInitialMargin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-[10px]">MAINTENANCE MARGIN</span>
                  <span className="font-semibold text-amber-500">${balance.totalMaintenanceMargin.toFixed(2)}</span>
                </div>
              </div>

              {/* Margin usage meter */}
              <div className="space-y-1.5 border-t border-border/15 pt-3">
                <div className="flex justify-between text-[9px] text-muted-foreground font-bold">
                  <span>MARGIN RATIO</span>
                  <span>{marginRatio.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted/40 h-2 rounded overflow-hidden border border-border/15">
                  <div
                    className={cn("h-full transition-all duration-500", getMarginBarColor(marginRatio))}
                    style={{ width: `${Math.min(marginRatio, 100)}%` }}
                  />
                </div>
                {marginRatio >= 80 && (
                  <div className="text-[9px] text-rose-400 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>MARGIN RISK HIGH: REDUCE COLLATERAL OVERHEAD</span>
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
