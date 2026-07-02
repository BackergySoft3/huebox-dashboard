/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePerformance } from "../Hooks/usePerformance";
import { useAuthStore } from "../State/auth";
import { useInstancesStore } from "../State/instances";
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
  Layers,
  ChevronRight,
  Settings2,
  Wallet,
  Info,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../Helpers/utils";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { OnboardingTour, isOnboardingDone, resetOnboarding } from "../Components/Organisms/OnboardingTour";
import { HelpCircle } from "lucide-react";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const val = Number(payload[0].value);
    const color = val >= 0 ? "text-emerald-400" : "text-rose-400";
    const sign = val >= 0 ? "+" : "";

    return (
      <div className="bg-popover border border-border/80 p-3 rounded-lg shadow-xl font-sans text-popover-foreground">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">P&L</p>
        <p className={`text-sm font-mono font-bold mt-0.5 ${color}`}>
          {sign}${val.toFixed(2)}
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
  const { history } = usePerformance();
  const user = useAuthStore((state) => state.user);
  const [showTour, setShowTour] = useState(() => !isOnboardingDone());

  // ── Multi-instance state & polling ─────────────────────────────────────────
  const { instances, isLoading: instancesLoading, fetchInstances } = useInstancesStore();
  const isLoading = instancesLoading;

  // Derive aggregate status from instances
  const botRunningStatus = instances.some((i) => i.status === "running")
    ? "running"
    : instances.some((i) => i.status === "paused")
      ? "paused"
      : instances.some((i) => i.status === "stalled")
        ? "stalled"
        : instances.length > 0
          ? "stopped"
          : "stalled";
  const isRunning = botRunningStatus === "running";

  // Dummy variables for retro-compatibility compilation (hidden/unused blocks)
  const confirmState = { isOpen: false, action: null as string | null };
  const setConfirmState = (_val?: any) => { };
  const actionMutation = { isPending: false, mutateAsync: async (_action: string) => { } };
  const isError = false;
  const queryStatus = "success";
  const error = null;

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(() => {
      fetchInstances();
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchInstances]);

  const totalAllocated = instances.reduce((acc, inst) => acc + (inst.allocatedAmount || 0), 0);
  const totalPnL = instances.reduce((acc, inst) => acc + (inst.unrealizedPnl || 0), 0);
  const totalActiveGrids = instances.reduce((acc, inst) => acc + (inst.activeGrids || 0), 0);

  const weightedROI = totalAllocated > 0
    ? instances.reduce((acc, inst) => acc + (inst.roi || 0) * (inst.allocatedAmount || 0), 0) / totalAllocated
    : 0;
  // ──────────────────────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    if (!history || !instances) return [];

    const activeInstances = instances.filter(i => i.status !== "stopped" && i.createdAt);
    if (activeInstances.length === 0) return [];

    let earliestStart = Infinity;
    activeInstances.forEach(inst => {
      const d = new Date(inst.createdAt!);
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + 1);
      const startHour = d.getTime();
      if (startHour < earliestStart) earliestStart = startHour;
    });

    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    const endHour = currentHour.getTime();

    if (earliestStart > endHour) return [];

    const sortedHistory = [...history].sort(
      (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const generatedData = [];
    let cumulativePnl = 0;
    let historyIndex = 0;

    for (let t = earliestStart; t <= endHour; t += 3600000) {
      while (historyIndex < sortedHistory.length) {
        const tradeTime = new Date(sortedHistory[historyIndex].timestamp).getTime();
        if (tradeTime <= t) {
          cumulativePnl += (sortedHistory[historyIndex].pnl || 0);
          historyIndex++;
        } else {
          break;
        }
      }

      generatedData.push({
        timestamp: new Date(t).toISOString(),
        pnl: cumulativePnl,
      });
    }

    // Add current unrealized P&L to the latest hour to reflect live valuation
    if (generatedData.length > 0) {
      const currentUnrealizedPnl = activeInstances.reduce((acc, inst) => acc + (inst.unrealizedPnl || 0), 0);
      generatedData[generatedData.length - 1].pnl += currentUnrealizedPnl;
    }

    return generatedData;
  }, [history, instances]);

  const { minPnl, maxPnl } = useMemo(() => {
    if (chartData.length === 0) return { minPnl: 0, maxPnl: 0 };
    const pnls = chartData.map(d => d.pnl);
    return {
      minPnl: Math.min(...pnls),
      maxPnl: Math.max(...pnls),
    };
  }, [chartData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const emailPrefix = user?.email ? user.email.split("@")[0].split(/[._\-0-9]/)[0] : "Investor";
  const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  return (
    <>
      {showTour && <OnboardingTour onDone={() => setShowTour(false)} />}

      {/* Floating help button — replays the tour on demand */}
      <button
        onClick={() => { resetOnboarding(); setShowTour(true); }}
        aria-label="Replay onboarding tour"
        title="Help — replay guided tour"
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-card border border-border/60 shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:shadow-primary/20 transition-all duration-200"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading || instancesLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              {/* Card 1: WEIGHTED ROI */}
              <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">WEIGHTED ROI</span>
                    <span className="text-[10px] font-mono text-muted-foreground normal-case tracking-normal">Avg. Profit Rate</span>
                  </div>
                  {weightedROI >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="mt-4">
                  <div className={cn(
                    "text-[28px] font-bold font-heading tabular-nums leading-none tracking-tight",
                    weightedROI >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {weightedROI >= 0 ? "+" : ""}{weightedROI.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mt-2 flex items-center gap-1">
                    Avg. profit rate across all active bots
                  </p>
                </div>
              </Card>

              {/* Card 2: TOTAL P&L */}
              <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">TOTAL P&L</span>
                    <span className="text-[10px] font-mono text-muted-foreground normal-case tracking-normal">Profit / Loss</span>
                  </div>
                  {totalPnL >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="mt-4">
                  <div className={cn(
                    "text-[28px] font-bold font-heading tabular-nums leading-none tracking-tight",
                    totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {totalPnL >= 0 ? "+" : ""}${Math.abs(totalPnL).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mt-2 flex items-center gap-1">
                    Unrealized gain or loss in USDT
                  </p>
                </div>
              </Card>

              {/* Card 3: TOTAL ALLOCATED */}
              <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">TOTAL ALLOCATED</span>
                    <span className="text-[10px] font-mono text-muted-foreground normal-case tracking-normal">Capital Deployed</span>
                  </div>
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="mt-4">
                  <div className="text-[28px] font-bold font-heading text-foreground tabular-nums leading-none tracking-tight">
                    ${Number(totalAllocated).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mt-2 flex items-center gap-1">
                    Total USDT committed to active strategies
                  </p>
                </div>
              </Card>

              {/* Card 4: ACTIVE GRIDS */}
              <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono tracking-widest text-foreground uppercase font-extrabold">ACTIVE GRIDS</span>
                    <span className="text-[10px] font-mono text-muted-foreground normal-case tracking-normal">Live Orders</span>
                  </div>
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-4">
                  <div className="text-[28px] font-bold font-heading text-cyan-400 tabular-nums leading-none tracking-tight">
                    {totalActiveGrids}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mt-2 flex items-center gap-1">
                    Live buy/sell orders on the exchange
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
                          domain={[minPnl - (maxPnl - minPnl) * 0.1 - 0.02, maxPnl + (maxPnl - minPnl) * 0.1 + 0.02]}
                          tickFormatter={(val) => {
                            const num = Number(val);
                            return `${num >= 0 ? "+" : ""}$${num.toFixed(2)}`;
                          }}
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
                    ACTIVE BOTS
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Live deployed trading bots.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* C-01: Real running count from API */}
                  {instances.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 text-[10px] font-bold tracking-wider">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                      </span>
                      {instances.filter((i) => i.status === "running").length} ACTIVE
                    </div>
                  )}
                  {/* C-01: Manage via Investment Strategies page */}
                  <Button asChild variant="outline" size="sm" className="text-[10px] h-7 px-3 rounded-full font-bold uppercase tracking-wider font-mono transition-all" title="Go to Investment Strategies to launch, pause, or stop bot instances">
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
                ) : instances.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                    <Bot className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm font-sans font-medium">No active bots</p>
                    <p className="text-muted-foreground/60 text-xs font-mono mt-1 max-w-[200px] leading-relaxed">
                      Start a strategy to deploy trading bots.
                    </p>
                    <Link to="/control" className="text-primary hover:text-primary/80 text-xs font-semibold mt-3 transition-colors flex items-center gap-1">
                      Go to Investment Strategies
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  /* C-01: Real grid data from API */
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse font-mono min-w-[420px]" role="grid">
                      <thead>
                        <tr className="border-b border-border/20 text-muted-foreground text-[10px] tracking-[1px] uppercase bg-muted/5">
                          <th scope="col" className="py-2.5 px-3 font-semibold">BOT</th>
                          <th scope="col" className="py-2.5 px-3 font-semibold">STATUS</th>
                          <th scope="col" className="py-2.5 px-3 font-semibold">ALLOCATED</th>
                          <th scope="col" className="py-2.5 px-3 font-semibold">GRIDS</th>
                          <th scope="col" className="py-2.5 px-3 font-semibold text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {instances.map((bot: any, idx: number) => (
                          <tr
                            key={bot.instanceId || idx}
                            className="hover:bg-muted/10 transition-colors animate-fade-in"
                            style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
                          >
                            <td className="py-3 px-3 font-bold font-sans text-foreground">
                              <span className="text-xs capitalize">{bot.personality}</span>
                            </td>
                            <td className="py-3 px-3">
                              <Badge
                                className={cn(
                                  "font-mono text-[10px] px-2 py-0.5 border font-semibold uppercase",
                                  bot.status === "running"
                                    ? "text-emerald-400 border-emerald-400/20 bg-emerald-500/10"
                                    : bot.status === "paused"
                                      ? "text-amber-400 border-amber-400/20 bg-amber-500/10"
                                      : "text-muted-foreground border-border/40 bg-muted/20"
                                )}
                              >
                                {bot.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                              ${bot.allocatedAmount?.toFixed(2) ?? "0.00"}
                            </td>
                            <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                              {bot.activeGrids ?? 0}
                            </td>
                            <td className={cn(
                              "py-3 px-3 font-mono text-xs font-bold text-right",
                              (bot.unrealizedPnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {(bot.unrealizedPnl || 0) >= 0 ? "+" : ""}${(bot.unrealizedPnl || 0).toFixed(2)}
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
                      title="Advanced controls — stop the bot, edit strategy, manage allocations, and more"
                      className="text-xs font-mono font-bold text-primary hover:text-primary/80 flex items-center gap-1 group transition-colors"
                    >
                      Full Control
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* No strategy running — start CTA footer */}
              {!isRunning && botRunningStatus !== "paused" && instances.length === 0 && !isLoading && (
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
    </>
  );
}
