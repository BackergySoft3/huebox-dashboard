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
import { Trophy, TrendingUp, TrendingDown, Target, Wallet2, Brain, GitMerge, Bot, Calendar, Activity, Play, Pause, Square } from "lucide-react";
import { cn } from "../Helpers/utils";

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

export function MyBot() {
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

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center font-mono text-xs text-muted-foreground/80 gap-3 py-20">
        <Activity className="w-6 h-6 text-primary animate-spin" />
        <span>Syncing portfolio data...</span>
      </div>
    );
  }

  // Determine Bot Status Label and Color
  const botState = status?.status?.toUpperCase() || "STOPPED";
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
                  <Badge variant="outline" className={cn("px-2 py-0.5 text-[9px] uppercase font-bold", botStateColor)}>
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
              <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[9px] uppercase font-bold font-mono tracking-wider">
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
            <p className="text-[10px] text-muted-foreground/90 leading-relaxed">
              {summary?.winRate
                ? `Active win rate stands at ${Number(summary.winRate).toFixed(1)}%. ${Number(summary.winRate) > 60 ? "Strategy performance registers above benchmark." : "Grid matrix operates within standard tolerances."}`
                : "Performance vectors will initialize after the first closed grid loop."}
            </p>
            <div className="border-t border-border/15 pt-2.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dynamic Bias</span>
                <Badge variant={llmRec.action === "LONG" ? "default" : llmRec.action === "SHORT" ? "destructive" : "secondary"} className="h-5 text-[9px] uppercase font-bold tracking-wider px-2">
                  {llmRec.action}
                </Badge>
              </div>
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/30 text-muted-foreground italic text-[9px] leading-relaxed">
                "{llmRec.reasoning}"
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Middle Section: Performance KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">WIN RATE</CardTitle>
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
            <CardTitle className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">AVG PNL / TRADE</CardTitle>
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
            <CardTitle className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">BEST TRADE</CardTitle>
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
            <CardTitle className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">WORST TRADE</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-sans tracking-tight text-rose-400">
              {summary?.worstTrade ? `-$${Number(Math.abs(summary.worstTrade)).toFixed(2)}` : "$0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PnL Chart */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> PROFIT HISTORY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full font-mono text-[10px]">
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
            <div className="h-[300px] w-full font-mono text-[10px]">
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

      {/* ACTIVE BOTS Card */}
      <div id="active-bots" className="rounded-[12px] border border-border bg-card p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#00D4AA]" />
              <h2 className="text-foreground text-xs font-bold tracking-[1px] uppercase font-sans">
                ACTIVE BOTS
              </h2>
            </div>
            <p className="text-[#64748B] text-[11px] mt-1 font-sans">
              Live automated trading strategies currently deployed.
            </p>
          </div>
          {runningCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C853]/10 border border-[#00C853]/20">
              <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
              <span className="text-[#00C853] text-xs font-bold font-sans">
                {runningCount} RUNNING
              </span>
            </div>
          )}
        </div>

        {activeBots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bot className="w-12 h-12 text-[#374151] mb-2" />
            <p className="text-muted-foreground text-sm font-sans font-medium">No active bots running</p>
            <Link to="/control" className="text-[#00D4AA] hover:text-[#00D4AA]/80 text-xs font-semibold underline mt-2 transition-colors">
              Go to Investment Strategies
            </Link>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono min-w-[900px]">
              <thead>
                <tr className="border-b border-border text-[#64748B] text-[10px] tracking-[1px] uppercase">
                  <th className="py-3 px-4 font-semibold">BOT NAME</th>
                  <th className="py-3 px-4 font-semibold">PROFIT (24H)</th>
                  <th className="py-3 px-4 font-semibold">ROI</th>
                  <th className="py-3 px-4 font-semibold">TARGET</th>
                  <th className="py-3 px-4 font-semibold">PROGRESS</th>
                  <th className="py-3 px-4 font-semibold text-right">CONTROLS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activeBots.map((bot, idx) => {
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
                      className="hover:bg-muted/5 transition-colors animate-fade-in"
                      style={{
                        animationDelay: `${idx * 300}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      {/* BOT NAME */}
                      <td className="py-4 px-4 font-bold font-sans text-foreground relative pl-6">
                        <div
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-[4px] h-[32px] rounded-full"
                          style={{ backgroundColor: bot.color }}
                        />
                        <div className="flex items-center gap-2">
                          <span>{bot.name}</span>
                          {bot.status === "PAUSED" && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/5 font-bold uppercase font-mono">
                              PAUSED
                            </Badge>
                          )}
                        </div>
                        <div className="text-[#64748B] text-[10px] font-mono font-medium mt-0.5">
                          {bot.pair}
                        </div>
                      </td>

                      {/* PROFIT (24H) */}
                      <td className="py-4 px-4">
                        <CountUp
                          value={bot.profit}
                          className={cn(
                            "font-mono font-bold text-sm tracking-tight",
                            bot.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}
                        />
                      </td>

                      {/* ROI */}
                      <td className="py-4 px-4 font-bold font-mono text-sm tracking-tight">
                        <span className={bot.roi >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {bot.roi >= 0 ? "+" : ""}{bot.roi.toFixed(2)}%
                        </span>
                      </td>

                      {/* TARGET */}
                      <td className="py-4 px-4 font-bold font-mono text-foreground text-sm tracking-tight">
                        ${bot.target.toFixed(2)}
                      </td>

                      {/* PROGRESS */}
                      <td className="py-4 px-4 font-sans">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-muted h-[4px] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-[800ms] ease-out"
                              style={{
                                width: animateProgress ? `${progressPercentage}%` : "0%",
                                backgroundColor: progressColor,
                              }}
                            />
                          </div>
                          <span className="text-foreground font-mono text-[11px] font-bold">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* CONTROLS */}
                      <td className="py-4 px-4 text-right font-sans">
                        <div className="flex flex-col sm:flex-row gap-2 justify-end items-center">
                          <button
                            onClick={() => handleTogglePause(bot.id)}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110",
                              bot.status === "PAUSED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                                : "bg-amber-500/10 text-[#F59E0B] border border-[#F59E0B]/20 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                            )}
                            title={bot.status === "PAUSED" ? "Resume Bot" : "Pause Bot"}
                          >
                            {bot.status === "PAUSED" ? (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Pause className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>
                          <button
                            onClick={() => handleStopBot(bot.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-[#EF4444] border border-[#EF4444]/20 hover:scale-110 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all duration-200"
                            title="Stop Bot"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
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
      </div>

      {/* Trade History Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-foreground uppercase font-bold">
              <Trophy className="w-4 h-4 text-primary" /> TRADE HISTORY
            </CardTitle>
            <CardDescription className="text-[10px] font-mono text-muted-foreground/60">Recent position exits and order loop closures.</CardDescription>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono border-border/30">MAX 10 RECORDINGS</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-border/30 rounded-xl bg-muted/10">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground bg-muted/15 text-[10px]">
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
                          "font-mono text-[9px] px-2 py-0.5 border font-semibold",
                          trade.pnl >= 0 
                            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" 
                            : "text-rose-400 border-rose-500/20 bg-rose-500/10"
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
        </CardContent>
      </Card>
    </div>
  );
}

