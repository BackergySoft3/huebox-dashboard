/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useBotStatus } from "../Hooks/useBotStatus";
import { usePerformance } from "../Hooks/usePerformance";
import { useAuthStore } from "../State/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Bot,
  Play,
  Pause,
  Square,
  CircleDollarSign,
  Layers,
  ChevronRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../Helpers/utils";

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

function CountUp({ value, duration = 600, className }: { value: number; duration?: number; className?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCurrent(progress * value);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  const isPositive = value >= 0;
  const formatted = `${isPositive ? "+" : "-"}$${Math.abs(current).toFixed(2)}`;

  return <span className={className}>{formatted}</span>;
}

export function Overview() {
  const { data: botStatus, error, status: queryStatus, isError } = useBotStatus();
  const { history } = usePerformance();
  const user = useAuthStore((state) => state.user);

  const chartData = history
    ? [...history]
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-24)
    : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const emailPrefix = user?.email ? user.email.split("@")[0].split(/[._\-0-9]/)[0] : "Investor";
  const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  // Portfolio allocation from open grids
  const allocationBySymbol = (botStatus?.grids || []).reduce((acc: Record<string, number>, g: any) => {
    acc[g.symbol] = (acc[g.symbol] || 0) + (Number(g.margin) || 0);
    return acc;
  }, {});
  const totalMargin = Object.values(allocationBySymbol).reduce((s: number, v) => s + (v as number), 0);

  // Visual metrics calculation
  const liveRoi = botStatus?.live_roi ?? 0;

  // Active Bots local state
  const [activeBots, setActiveBots] = useState([
    {
      id: "bot-1",
      name: "Apex Grid",
      pair: "BTC/USDT",
      color: "#00D4AA",
      profit: 125.50,
      roi: 3.20,
      target: 150.00,
      status: "RUNNING",
    },
    {
      id: "bot-2",
      name: "Pulse Maker",
      pair: "ETH/USDT",
      color: "#EAB308",
      profit: 18.40,
      roi: 1.85,
      target: 40.00,
      status: "RUNNING",
    },
    {
      id: "bot-3",
      name: "Trend Follower",
      pair: "SOL/USDT",
      color: "#a855f7",
      profit: 3.10,
      roi: 0.45,
      target: 20.00,
      status: "RUNNING",
    },
    {
      id: "bot-4",
      name: "Range Bound",
      pair: "ADA/USDT",
      color: "#3b82f6",
      profit: 12.80,
      roi: 1.15,
      target: 35.00,
      status: "RUNNING",
    },
    {
      id: "bot-5",
      name: "Momentum Rider",
      pair: "XRP/USDT",
      color: "#f43f5e",
      profit: -2.40,
      roi: -0.60,
      target: 15.00,
      status: "RUNNING",
    },
    {
      id: "bot-6",
      name: "Scalper Pro",
      pair: "AVAX/USDT",
      color: "#10b981",
      profit: 42.10,
      roi: 2.75,
      target: 80.00,
      status: "RUNNING",
    }
  ]);

  const [animateProgress, setAnimateProgress] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimateProgress(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleTogglePause = (id: string) => {
    setActiveBots(prev =>
      prev.map(bot =>
        bot.id === id
          ? { ...bot, status: bot.status === "RUNNING" ? "PAUSED" : "RUNNING" }
          : bot
      )
    );
  };

  const handleStopBot = (id: string) => {
    setActiveBots(prev => prev.filter(bot => bot.id !== id));
  };

  const runningCount = activeBots.filter(b => b.status === "RUNNING").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CSS styling for customized scrollbar */}
      <style>{`
        .terminal-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .terminal-scroll::-webkit-scrollbar-track {
          background: hsl(var(--muted));
        }
        .terminal-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 4px;
        }
        .terminal-scroll::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.6);
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/40 p-6 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-bold tracking-tight text-foreground flex items-center gap-2">
              {greeting}, {displayName || "User"}
              <Shield className="w-5 h-5 text-sky-400 fill-sky-400/10" />
            </h1>
          </div>
          <p className="text-[#64748B] mt-1 text-xs md:text-sm font-medium">
            Welcome back. Your automated trading workspace is fully synced and monitored.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AI ENGINE ONLINE</span>
          </div>
          <div className="text-xs font-mono text-[#64748B]">
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

      {/* Cards Row (3 Cards) */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: LIVE ROI */}
        <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#64748B] uppercase font-bold">LIVE ROI</span>
            {liveRoi >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="mt-4">
            <div className={cn(
              "text-[28px] font-bold tabular-nums leading-none tracking-tight",
              liveRoi >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {liveRoi >= 0 ? "+" : ""}{liveRoi.toFixed(2)}%
            </div>
            <p className="text-[10px] text-[#64748B] font-sans mt-2">
              Current active cycle ROI
            </p>
          </div>
        </Card>

        {/* Card 2: MARGIN USED */}
        <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#64748B] uppercase font-bold">MARGIN USED</span>
            <CircleDollarSign className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="mt-4">
            <div className="text-[28px] font-bold text-foreground tabular-nums leading-none tracking-tight">
              ${Number(totalMargin).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-[#64748B] font-sans mt-2">
              Total margin allocated
            </p>
          </div>
        </Card>

        {/* Card 3: OPEN GRIDS */}
        <Card className="bg-card border border-border/40 p-5 rounded-xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#64748B] uppercase font-bold">OPEN GRIDS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4">
            <div className="text-[28px] font-bold text-cyan-400 tabular-nums leading-none tracking-tight">
              {botStatus?.active_grids ?? 0}
            </div>
            <p className="text-[10px] text-[#64748B] font-sans mt-2">
              Currently active placements
            </p>
          </div>
        </Card>
      </div>

      {/* Main Two-column Grid (55% / 45% Split) */}
      <div className="grid gap-6 lg:grid-cols-[55%_45%] items-stretch">
        
        {/* Left Column (55% width) */}
        <div className="flex flex-col h-full">
          {/* Card 2 — Portfolio Growth Chart (Expanded Height) */}
          <Card className="bg-card border-border/40 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out flex-1 flex flex-col justify-between h-full">
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase">Portfolio Growth (24H)</CardTitle>
                <CardDescription className="text-[10px] text-[#64748B]">Real-time P&L changes across strategy closures</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center py-6 min-h-[340px]">
              {chartData.length > 0 ? (
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
                            return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary)/0.2)', strokeWidth: 1 }} />
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
                <div className="flex-1 flex flex-col items-center justify-center text-xs text-[#64748B] font-mono gap-3 text-center py-8">
                  <span className="relative flex h-10 w-10 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-500/20 opacity-75"></span>
                    <Activity className="relative w-8 h-8 text-slate-500/50" />
                  </span>
                  <span className="max-w-[280px]">Your portfolio chart will appear once closed strategies log returns.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (45% width) */}
        <div className="flex flex-col h-full">
          {/* Card 3 — Active Bots (Full Height) */}
          <Card className="bg-card border-border/40 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-primary/30 transition-all duration-200 ease-in-out flex flex-col h-full overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/20 py-4 flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle className="text-xs font-mono tracking-widest flex items-center gap-2 text-foreground uppercase font-bold">
                  <Bot className="w-4 h-4 text-[#00D4AA]" />
                  ACTIVE BOTS
                </CardTitle>
                <CardDescription className="text-[10px] text-[#64748B] mt-0.5">Live automated trading strategies currently deployed.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {runningCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#00C853]/10 border border-[#00C853]/20 px-2 py-0.5 rounded-full text-[#00C853] text-[9px] font-bold tracking-wider">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00C853]"></span>
                    </span>
                    {runningCount} RUNNING
                  </div>
                )}
                <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] h-7 px-3.5 rounded-full font-bold uppercase tracking-wider font-mono shadow-[0_0_8px_rgba(0,212,255,0.3)] transition-all">
                  <Link to="/control" className="flex items-center gap-1">
                    Start New Bot
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto terminal-scroll min-h-[350px]">
              {activeBots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                  <Bot className="w-12 h-12 text-[#374151] mb-2" />
                  <p className="text-muted-foreground text-sm font-sans font-medium">No active bots running</p>
                  <Link to="/control" className="text-[#00D4AA] hover:text-[#00D4AA]/80 text-xs font-semibold underline mt-2 transition-colors">
                    Go to Investment Strategies
                  </Link>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-mono min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border/20 text-[#64748B] text-[9px] tracking-[1px] uppercase bg-muted/5">
                        <th className="py-2.5 px-3 font-semibold">BOT NAME</th>
                        <th className="py-2.5 px-3 font-semibold">PROFIT (24H)</th>
                        <th className="py-2.5 px-3 font-semibold">ROI</th>
                        <th className="py-2.5 px-3 font-semibold">TARGET</th>
                        <th className="py-2.5 px-3 font-semibold">PROGRESS</th>
                        <th className="py-2.5 px-3 font-semibold text-right">CONTROLS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {(activeBots.length >= 5 ? activeBots.slice(0, 5) : activeBots).map((bot, idx) => {
                        const progressPercentage = Math.min(100, Math.max(0, (bot.profit / bot.target) * 100));
                        let progressColor = "#22C55E";
                        if (progressPercentage < 30) {
                          progressColor = "#00D4AA";
                        } else if (progressPercentage <= 70) {
                          progressColor = "#EAB308";
                        }

                        return (
                          <tr
                            key={bot.id}
                            className="hover:bg-white/[0.01] transition-colors animate-fade-in"
                            style={{
                              animationDelay: `${idx * 300}ms`,
                              animationFillMode: "both",
                            }}
                          >
                            {/* BOT NAME */}
                            <td className="py-3 px-3 font-bold font-sans text-foreground relative pl-5">
                              <div
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-[24px] rounded-full"
                                style={{ backgroundColor: bot.color }}
                              />
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px]">{bot.name}</span>
                                {bot.status === "PAUSED" && (
                                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/5 font-bold uppercase font-mono">
                                    PAUSED
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[#64748B] text-[9px] font-mono font-medium mt-0.5">
                                {bot.pair}
                              </div>
                            </td>

                            {/* PROFIT (24H) */}
                            <td className="py-3 px-3">
                              <CountUp
                                value={bot.profit}
                                className={cn(
                                  "font-mono font-bold text-xs tracking-tight",
                                  bot.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}
                              />
                            </td>

                            {/* ROI */}
                            <td className="py-3 px-3 font-bold font-mono text-xs tracking-tight">
                              <span className={bot.roi >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                {bot.roi >= 0 ? "+" : ""}{bot.roi.toFixed(2)}%
                              </span>
                            </td>

                            {/* TARGET */}
                            <td className="py-3 px-3 font-bold font-mono text-foreground text-xs tracking-tight">
                              ${bot.target.toFixed(2)}
                            </td>

                            {/* PROGRESS */}
                            <td className="py-3 px-3 font-sans">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-muted h-[3px] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-[800ms] ease-out"
                                    style={{
                                      width: animateProgress ? `${progressPercentage}%` : "0%",
                                      backgroundColor: progressColor,
                                    }}
                                  />
                                </div>
                                <span className="text-foreground font-mono text-[9px] font-bold">
                                  {progressPercentage.toFixed(0)}%
                                </span>
                              </div>
                            </td>

                            {/* CONTROLS */}
                            <td className="py-3 px-3 text-right font-sans">
                              <div className="flex gap-1.5 justify-end items-center">
                                <button
                                  onClick={() => handleTogglePause(bot.id)}
                                  className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110",
                                    bot.status === "PAUSED"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                      : "bg-amber-500/10 text-[#F59E0B] border border-[#F59E0B]/20 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                  )}
                                  title={bot.status === "PAUSED" ? "Resume Bot" : "Pause Bot"}
                                >
                                  {bot.status === "PAUSED" ? (
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                  ) : (
                                    <Pause className="w-2.5 h-2.5 fill-current" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleStopBot(bot.id)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/10 text-[#EF4444] border border-[#EF4444]/20 hover:scale-110 hover:shadow-[0_0_8px_rgba(239,68,68,0.4)] transition-all duration-200"
                                  title="Stop Bot"
                                >
                                  <Square className="w-2.5 h-2.5 fill-current" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            {activeBots.length >= 5 && (
              <div className="p-3.5 border-t border-border/15 flex justify-end bg-card/25 rounded-b-2xl">
                <Link
                  to="/my-bot#active-bots"
                  className="text-xs font-mono font-bold text-primary hover:text-primary/80 flex items-center gap-1 group transition-colors mr-1.5"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

