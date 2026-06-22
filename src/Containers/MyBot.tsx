/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useBotStatus } from "../Hooks/useBotStatus";
import { useBotStore } from "../State/bot";
import { usePerformance } from "../Hooks/usePerformance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { Trophy, TrendingUp, TrendingDown, Target, Wallet2, Brain, GitMerge, Bot, Calendar, Play, Pause, ChevronRight } from "lucide-react";
import { cn } from "../Helpers/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { Button } from "../Components/Atoms/button";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border/80 p-3 rounded-lg shadow-xl backdrop-blur-md font-sans text-popover-foreground">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Cumulative P&L</p>
        <p className={`text-sm font-mono font-bold mt-0.5 ${payload[0].value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {payload[0].value >= 0 ? "+" : ""}${Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const CustomFeeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border/80 p-3 rounded-lg shadow-xl backdrop-blur-md font-sans text-popover-foreground">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Platform Commission</p>
        <p className="text-sm font-mono font-bold mt-0.5 text-primary">
          ${Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};



// M-07: Skeleton card for loading states
function MetricCardSkeleton() {
  return (
    <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-muted/60 animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted/40 animate-pulse rounded" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-8 w-28 bg-muted/60 animate-pulse rounded" />
        <div className="h-2.5 w-32 bg-muted/40 animate-pulse rounded" />
      </div>
    </Card>
  );
}

export function MyBot() {
  const queryClient = useQueryClient();
  const { data: status, isLoading: statusLoading } = useBotStatus();
  const { history, fees, summary, isLoading: perfLoading } = usePerformance();
  const cycleCounter = useBotStore((state) => state.cycleCounter);

  const cycleStats = status?.cycleStats || { 
    scanned: 154, 
    hot: 12, 
    fundingChecked: true 
  };

  const llmRec = status?.llmRecommendation || { 
    action: "HOLD", 
    confidence: 0.89, 
    reasoning: "BTC volume profile suggests consolidation before breakout." 
  };

  const sortedHistory = history
    ? [...history].sort((a: any, b: any) => {
        const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      })
    : [];

  const formatPerfDate = (dateStr?: string, pattern = "MMM dd, HH:mm") => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, pattern);
    } catch {
      return "N/A";
    }
  };

  const trades = [...sortedHistory].reverse();
  const displayFees = fees && fees.length > 0
    ? fees
    : sortedHistory.slice(-20).map((h: any) => ({ ...h, fee: Math.abs((Number(h.pnl) || 0) * 0.05) }));

  const isLoading = statusLoading || perfLoading;

  // C-01: Real grid positions & Pause/Resume state
  const grids: any[] = status?.grids ?? [];
  const botRunningStatus = status?.status ?? "stalled";
  const isRunning = botRunningStatus === "running";

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    action: "pause" | "resume" | null;
  }>({ isOpen: false, action: null });

  const actionMutation = useMutation({
    mutationFn: (action: "pause" | "resume") => api.post(`/api/bot/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
      setConfirmState({ isOpen: false, action: null });
    },
  });

  useEffect(() => {
    if (window.location.hash === "#active-bots") {
      const el = document.getElementById("active-bots");
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Determine Bot Status Label and Color
  const botState = botRunningStatus.toUpperCase();
  const botStateColor = 
    botState === "RUNNING" 
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
      : botState === "PAUSED" 
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
      : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Review live performance parameters, metrics, and closed trade details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cycleCounter > 0 && (
            <Badge variant="outline" className="text-xs font-mono py-1 px-3 border-primary/20 bg-primary/5 text-primary font-bold uppercase">
              CYCLE {cycleCounter}
            </Badge>
          )}
        </div>
      </div>

      {/* Top Section: Portfolio Health, Market Analysis, AI Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Portfolio Health Card */}
            {(() => {
              const healthScore = Math.min(100, Math.round(
                (status?.status === "running" ? 40 : status?.status === "paused" ? 20 : 0) +
                (status?.live_roi && status.live_roi > 0 ? 30 : 0) +
                ((status?.bybitAccount?.balance ?? 0) > 100 ? 20 : 0) +
                (summary?.winRate && Number(summary.winRate) > 50 ? 10 : 0)
              ));
              const scoreColor = healthScore >= 70 ? "text-emerald-400" : healthScore >= 40 ? "text-amber-400" : "text-rose-400";
              return (
                <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-widest text-foreground uppercase font-extrabold">
                      <Bot className="w-4 h-4 text-primary" />
                      PORTFOLIO HEALTH
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-extrabold font-mono tracking-tight ${scoreColor}`}>{healthScore}</span>
                        <span className="text-muted-foreground/60">/100</span>
                      </div>
                      <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden mt-3 border border-border/20">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${healthScore >= 70 ? "bg-emerald-400" : healthScore >= 40 ? "bg-amber-400" : "bg-rose-400"}`}
                          style={{ width: `${healthScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2.5 border-t border-border/15">
                      <span className="text-muted-foreground font-medium">Session Status</span>
                      <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] uppercase font-bold", botStateColor)}>
                        {botState}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Market Analysis Card */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-widest text-foreground uppercase font-extrabold">
                  <GitMerge className="w-4 h-4 text-primary" />
                  MARKET ANALYSIS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">Scanned Symbols</span>
                  <span className="font-bold text-foreground font-sans text-sm">{cycleStats?.scanned || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Spikes</span>
                  <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px] uppercase font-bold font-mono tracking-wider">
                    {cycleStats?.hot || 0} HOT SIGNAL
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights Card */}
            <Card className="bg-gradient-to-br from-card to-card/65 border-primary/20 shadow-sm backdrop-blur-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-widest text-foreground uppercase font-extrabold">
                  <Brain className="w-4 h-4 text-primary animate-pulse" />
                  AI INSIGHTS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground/90 leading-relaxed">
                  {summary?.winRate
                    ? `Active win rate stands at ${Number(summary.winRate).toFixed(1)}%. ${Number(summary.winRate) > 60 ? "Strategy performance registers above benchmark." : "Grid matrix operates within standard tolerances."}`
                    : "Performance vectors will initialize after the first closed grid loop."}
                </p>
                <div className="border-t border-border/15 pt-2.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Dynamic Bias</span>
                    <Badge variant={llmRec.action === "LONG" ? "default" : llmRec.action === "SHORT" ? "destructive" : "secondary"} className="h-5 text-[10px] uppercase font-bold tracking-wider px-2">
                      {llmRec.action}
                    </Badge>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/30 text-muted-foreground italic text-[10px] leading-relaxed">
                    "{llmRec.reasoning}"
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>



      {/* Middle Section: Performance KPIs */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between animate-pulse">
              <div className="h-3 w-16 bg-muted/60 rounded" />
              <div className="mt-4 h-6 w-20 bg-muted/40 rounded" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">WIN RATE</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-sans tracking-tight text-foreground">
                {summary?.winRate ? `${Number(summary.winRate).toFixed(1)}%` : "0.0%"}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">AVG PNL / TRADE</CardTitle>
              <Wallet2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-sans tracking-tight ${summary && Number(summary.avgPnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {summary?.avgPnl ? `$${Number(summary.avgPnl).toFixed(2)}` : "$0.00"}
              </div>
            </CardContent>
          </Card>
   
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">BEST TRADE</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-sans tracking-tight text-emerald-400">
                {summary?.bestTrade ? `+$${Number(summary.bestTrade).toFixed(2)}` : "$0.00"}
              </div>
            </CardContent>
          </Card>
   
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">WORST TRADE</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-sans tracking-tight text-rose-400">
                {summary?.worstTrade ? `-$${Number(Math.abs(summary.worstTrade)).toFixed(2)}` : "$0.00"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical charts */}
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/30 border-border/40 p-5 rounded-xl min-h-[350px] animate-pulse flex flex-col justify-between">
            <div className="h-4 w-32 bg-muted/60 rounded" />
            <div className="h-[260px] bg-muted/20 rounded mt-4" />
          </Card>
          <Card className="bg-card/30 border-border/40 p-5 rounded-xl min-h-[350px] animate-pulse flex flex-col justify-between">
            <div className="h-4 w-32 bg-muted/60 rounded" />
            <div className="h-[260px] bg-muted/20 rounded mt-4" />
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* PnL Chart */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> PROFIT HISTORY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sortedHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.25)" vertical={false} />
                    <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => formatPerfDate(val, "MM/dd")} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary)/0.2)', strokeWidth: 1 }} />
                    <Line type="stepAfter" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Fees Chart */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> PLATFORM COMMISSION FEES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayFees} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.25)" vertical={false} />
                    <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => formatPerfDate(val, "MM/dd")} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip content={<CustomFeeTooltip />} cursor={{ fill: 'hsl(var(--primary)/0.05)' }} />
                    <Bar dataKey="fee" fill="hsl(var(--primary)/0.4)" stroke="hsl(var(--primary))" strokeWidth={1} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ACTIVE POSITIONS Card — C-01: Connect to real grid positions */}
      <div id="active-bots" className="rounded-[12px] border border-border bg-card p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h2 className="text-foreground text-xs font-bold tracking-[1px] uppercase font-sans">
                ACTIVE POSITIONS
              </h2>
            </div>
            <p className="text-muted-foreground text-xs mt-1 font-sans">
              Live deployed market maker grids.
            </p>
          </div>
          {grids.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold font-sans">
                {grids.length} ACTIVE
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          /* M-07: Table loading rows */
          <div className="divide-y divide-border/10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <div className="h-4 w-20 bg-muted/40 animate-pulse rounded" />
                <div className="h-4 w-12 bg-muted/30 animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted/30 animate-pulse rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : grids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
            <Bot className="w-12 h-12 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm font-sans font-medium">No active positions</p>
            <p className="text-muted-foreground/60 text-xs font-mono mt-1 max-w-[200px] leading-relaxed">
              {isRunning ? "Waiting for the engine to open positions." : "Start a strategy to deploy market makers."}
            </p>
            {!isRunning && (
              <Link to="/control" className="text-primary hover:text-primary/80 text-xs font-semibold mt-3 transition-colors flex items-center gap-1">
                Go to Investment Strategies
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono min-w-[500px]" role="grid">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs tracking-[1px] uppercase bg-muted/5">
                  <th scope="col" className="py-2.5 px-3 font-semibold">MARKET</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">SIDE</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">LEV</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">ENTRY PRICE</th>
                  <th scope="col" className="py-2.5 px-3 font-semibold text-right">COLLATERAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {grids.map((grid: any, idx: number) => (
                  <tr
                    key={idx}
                    className="hover:bg-muted/10 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
                  >
                    <td className="py-3 px-3 font-bold font-sans text-foreground">
                      <span className="text-xs">{grid.symbol}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        className={cn(
                          "font-mono text-xs px-2 py-0.5 border font-semibold",
                          grid.direction === "LONG"
                            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                            : "text-rose-400 border-rose-400/20 bg-rose-500/10"
                        )}
                      >
                        {grid.direction}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                      {grid.leverage}x
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-foreground">
                      ${grid.entryPrice?.toFixed(4) ?? "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-foreground font-bold text-right">
                      ${grid.margin?.toFixed(2) ?? "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Strategy-level controls in card footer */}
        {(isRunning || botRunningStatus === "paused") && (
          <div className="p-3.5 mt-4 border-t border-border/15 flex items-center justify-between bg-card/25 rounded-b-xl gap-2">
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "font-mono text-xs px-2 py-0.5 border font-semibold uppercase",
                  isRunning
                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                    : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                )}
              >
                {botRunningStatus}
              </Badge>
              <span className="text-muted-foreground text-xs font-mono">Strategy status</span>
            </div>
            <div className="flex gap-2">
              {isRunning && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-mono px-3 gap-1.5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
                  onClick={() => setConfirmState({ isOpen: true, action: "pause" })}
                  disabled={actionMutation.isPending}
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </Button>
              )}
              {botRunningStatus === "paused" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-mono px-3 gap-1.5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                  onClick={() => setConfirmState({ isOpen: true, action: "resume" })}
                  disabled={actionMutation.isPending}
                >
                  <Play className="w-3 h-3" />
                  Resume
                </Button>
              )}
              <Link
                to="/control"
                className="text-xs font-mono font-bold text-primary hover:text-primary/80 flex items-center gap-1 group transition-colors"
              >
                Full Control
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Trade History Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-foreground uppercase font-bold">
              <Trophy className="w-4 h-4 text-primary" /> TRADE HISTORY
            </CardTitle>
            <CardDescription className="text-xs font-mono text-muted-foreground/60">Recent position exits and order loop closures.</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-border/30">MAX 10 RECORDINGS</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="divide-y divide-border/10">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="h-4 w-24 bg-muted/40 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted/30 animate-pulse rounded" />
                  <div className="h-4 w-12 bg-muted/30 animate-pulse rounded" />
                  <div className="h-4 w-12 bg-muted/40 animate-pulse rounded ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/30 rounded-xl bg-muted/10">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground bg-muted/15 text-xs">
                    <th className="py-3 px-4 font-semibold">CLOSED DATE</th>
                    <th className="py-3 px-4 font-semibold">PAIR</th>
                    <th className="py-3 px-4 font-semibold">DIRECTION</th>
                    <th className="py-3 px-4 font-semibold text-right">NET RETURN (USDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/15">
                  {trades.slice(0, 10).map((trade: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/15 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">{formatPerfDate(trade.timestamp, "MMM dd, HH:mm")}</td>
                      <td className="py-3 px-4 font-bold font-sans text-foreground">{trade.symbol || "BTCUSDT"}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "font-mono text-xs px-2 py-0.5 border font-semibold",
                            trade.pnl >= 0 
                              ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" 
                              : "text-rose-400 border-rose-400/20 bg-rose-500/10"
                          )}
                        >
                          {trade.direction || (trade.pnl >= 0 ? "LONG" : "SHORT")}
                        </Badge>
                      </td>
                      <td className={cn(
                        "py-3 px-4 text-right font-bold font-sans",
                        trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {trade.pnl >= 0 ? "+" : ""}${Number(trade.pnl ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {trades.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground italic font-mono">No trades logged in this session history.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MyBot Pause/Resume confirm modal */}
      {confirmState.isOpen && confirmState.action && (
        <ConfirmModal
          title={confirmState.action === "pause" ? "Pause Strategy" : "Resume Strategy"}
          description={
            confirmState.action === "pause"
              ? "This will pause your AI strategy. Open positions will remain open and unmanaged until you resume."
              : "This will resume your active investment strategy and allow the AI engine to manage positions."
          }
          confirmLabel={confirmState.action === "pause" ? "Pause" : "Resume"}
          danger={confirmState.action === "pause"}
          onConfirm={async () => {
            await actionMutation.mutateAsync(confirmState.action!);
          }}
          onCancel={() => setConfirmState({ isOpen: false, action: null })}
        />
      )}
    </div>
  );
}

