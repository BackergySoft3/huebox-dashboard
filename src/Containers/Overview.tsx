/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useBotStatus } from "../Hooks/useBotStatus";
import { usePerformance } from "../Hooks/usePerformance";
import { useAuthStore } from "../State/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Bot,
  Pause,
  Play,
  CircleDollarSign,
  Layers,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../Helpers/utils";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border/80 p-3 rounded-lg shadow-xl font-sans text-popover-foreground">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">P&L Value</p>
        <p className={`text-sm font-mono font-bold mt-0.5 ${payload[0].value >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {payload[0].value >= 0 ? "+" : ""}${Number(payload[0].value).toFixed(2)}
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

export function Overview() {
  const { data: botStatus, error, status: queryStatus, isError, isLoading } = useBotStatus();
  const { history } = usePerformance();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // C-01: Real data from API
  const grids: any[] = botStatus?.grids ?? [];
  const liveRoi = botStatus?.live_roi ?? 0;
  const botRunningStatus: string = botStatus?.status ?? "stalled";
  const isRunning = botRunningStatus === "running";

  // C-01: Pause/resume mutations for strategy-level control
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

  const chartData = history
    ? [...history]
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-24)
    : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const emailPrefix = user?.email ? user.email.split("@")[0].split(/[._\-0-9]/)[0] : "Investor";
  const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  const allocationBySymbol = grids.reduce((acc: Record<string, number>, g: any) => {
    acc[g.symbol] = (acc[g.symbol] || 0) + (Number(g.margin) || 0);
    return acc;
  }, {});
  const totalMargin = Object.values(allocationBySymbol).reduce((s: number, v) => s + (v as number), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CSS for custom scrollbar */}
      <style>{`
        .terminal-scroll::-webkit-scrollbar { width: 5px; }
        .terminal-scroll::-webkit-scrollbar-track { background: hsl(var(--muted)); }
        .terminal-scroll::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.3); border-radius: 4px; }
        .terminal-scroll::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary) / 0.6); }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {greeting}, {displayName || "Investor"}
              <Shield className="w-5 h-5 text-sky-400 fill-sky-400/10" />
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm font-medium">
            Welcome back. Your automated trading workspace is fully synced and monitored.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* L-03: Tooltip explaining AI ENGINE ONLINE */}
          <div
            className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-semibold"
            title="AI Engine: Real-time market analysis and order execution is active and connected."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AI ENGINE ONLINE</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground" aria-label={`Current UTC time: ${new Date().toISOString().slice(11, 16)}`}>
            UTC: {new Date().toISOString().slice(11, 16)}
          </div>
        </div>
      </div>

      {isError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono flex items-center gap-3 shadow-sm">
          <span className="p-1 rounded-md bg-rose-500/15 text-rose-400 font-bold shrink-0">⚠ ERROR</span>
          <div className="flex-1">
            Status API Error ({queryStatus}): {(error as any)?.response?.status || "network"} — {(error as any)?.response?.data?.message || (error as any)?.message || "Unknown error"}
          </div>
        </div>
      )}

      {/* Metric Cards — M-07: Skeleton while loading */}
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Card 1: LIVE ROI */}
            <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">LIVE ROI</span>
                {liveRoi >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="mt-4">
                <div className={cn(
                  "text-[28px] font-bold font-heading tabular-nums leading-none tracking-tight",
                  liveRoi >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {liveRoi >= 0 ? "+" : ""}{liveRoi.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-2">
                  Current active cycle return on investment
                </p>
              </div>
            </Card>

            {/* Card 2: MARGIN USED */}
            <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">MARGIN USED</span>
                <CircleDollarSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <div className="text-[28px] font-bold font-heading text-foreground tabular-nums leading-none tracking-tight">
                  ${Number(totalMargin).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-2">
                  Total collateral deployed across positions
                </p>
              </div>
            </Card>

            {/* Card 3: OPEN GRIDS */}
            <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">OPEN GRIDS</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-4">
                <div className="text-[28px] font-bold font-heading text-cyan-400 tabular-nums leading-none tracking-tight">
                  {botStatus?.active_grids ?? 0}
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-2">
                  Currently active market maker placements
                </p>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Two-column Grid (55% / 45% Split) */}
      <div className="grid gap-6 lg:grid-cols-[55%_45%] items-stretch">

        {/* Left Column — Portfolio Growth Chart */}
        <div className="flex flex-col h-full">
          <Card className="bg-card border-border/40 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out flex-1 flex flex-col justify-between h-full">
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">Portfolio Growth (24H)</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Real-time P&L changes across strategy closures</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center py-6 min-h-[340px]">
              {isLoading ? (
                <div className="h-[280px] w-full bg-muted/20 animate-pulse rounded-lg" />
              ) : chartData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPnlMini" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.25)" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(val) => {
                          try {
                            return new Date(val).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                          } catch {
                            return "";
                          }
                        }}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        fontFamily="JetBrains Mono"
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        fontFamily="JetBrains Mono"
                        tickLine={false}
                        axisLine={false}
                        dx={-5}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary)/0.2)", strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPnlMini)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                // M-04: Actionable empty state
                <div className="flex-1 flex flex-col items-center justify-center text-xs text-muted-foreground font-mono gap-4 text-center py-8">
                  <span className="relative flex h-10 w-10 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground/20 opacity-75"></span>
                    <Activity className="relative w-8 h-8 text-muted-foreground/50" />
                  </span>
                  <div className="space-y-2">
                    <p className="text-foreground font-semibold text-sm font-sans">No portfolio data yet</p>
                    <p className="max-w-[260px] text-muted-foreground leading-relaxed">
                      Portfolio data appears after your first completed trading cycle (usually 24–72 hours).
                    </p>
                    <Link
                      to="/control"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold mt-2 transition-colors"
                    >
                      Start your first strategy
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Active Positions (C-01: real API data) */}
        <div className="flex flex-col h-full">
          <Card className="bg-card border-border/40 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out flex flex-col h-full overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/20 py-4 flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle className="text-xs font-mono tracking-widest flex items-center gap-2 text-foreground uppercase font-bold">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  ACTIVE POSITIONS
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Live deployed market maker grids.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* C-01: Real running count from API */}
                {grids.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 text-[10px] font-bold tracking-wider">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                    </span>
                    {grids.length} ACTIVE
                  </div>
                )}
                {/* C-01: Manage via Investment Strategies page */}
                <Button asChild variant="outline" size="sm" className="text-[10px] h-7 px-3 rounded-full font-bold uppercase tracking-wider font-mono transition-all">
                  <Link to="/control" className="flex items-center gap-1">
                    <Settings2 className="w-3 h-3" />
                    Manage
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto terminal-scroll min-h-[350px]">
              {isLoading ? (
                /* M-07: Skeleton rows while loading */
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
                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                  <Bot className="w-12 h-12 text-muted-foreground/30 mb-3" />
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
                /* C-01: Real grid data from API */
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-mono min-w-[420px]" role="grid">
                    <thead>
                      <tr className="border-b border-border/20 text-muted-foreground text-[10px] tracking-[1px] uppercase bg-muted/5">
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
                                "font-mono text-[10px] px-2 py-0.5 border font-semibold",
                                grid.direction === "LONG"
                                  ? "text-emerald-400 border-emerald-400/20 bg-emerald-500/10"
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
            </CardContent>

            {/* Strategy-level controls in card footer */}
            {(isRunning || botRunningStatus === "paused") && (
              <div className="p-3.5 border-t border-border/15 flex items-center justify-between bg-card/25 rounded-b-2xl gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "font-mono text-[10px] px-2 py-0.5 border font-semibold uppercase",
                      isRunning
                        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                        : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                    )}
                  >
                    {botRunningStatus}
                  </Badge>
                  <span className="text-muted-foreground text-[10px] font-mono">Strategy status</span>
                </div>
                <div className="flex gap-2">
                  {isRunning && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-mono px-3 gap-1.5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
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
                      className="h-7 text-[10px] font-mono px-3 gap-1.5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
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

            {/* No strategy running — start CTA footer */}
            {!isRunning && botRunningStatus !== "paused" && grids.length === 0 && !isLoading && (
              <div className="p-3.5 border-t border-border/15 flex justify-end bg-card/25 rounded-b-2xl">
                <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] h-7 px-3.5 rounded-full font-bold uppercase tracking-wider font-mono shadow-[0_0_8px_rgba(0,212,255,0.3)] transition-all">
                  <Link to="/control" className="flex items-center gap-1">
                    Start Strategy
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* C-01: Pause/Resume confirm modal */}
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
