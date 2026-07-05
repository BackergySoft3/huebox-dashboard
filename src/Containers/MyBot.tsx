import { useState } from "react";
import { usePortfolioSummary } from "../Hooks/usePortfolioSummary";
import { usePerformance } from "../Hooks/usePerformance";
import { useInstancesStore } from "../State/instances";
import { AddInstanceModal } from "../Components/Organisms/AddInstanceModal";
import { GoalProgressCard } from "../Components/Organisms/GoalProgressCard";
import { FundingModal } from "../Components/Organisms/FundingModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReChartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import {
  Trophy,
  TrendingUp,
  Target,
  Wallet2,
  Bot,
  Calendar,
  ArrowDownLeft,
  Loader2,
  Play,
  Pause,
  Square,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  Plus
} from "lucide-react";
import { cn } from "../Helpers/utils";

// Glossary for tooltips
const GLOSSARY = {
  roi: "Return on Investment: how much profit you've made relative to the amount you put in, as a percentage.",
  unrealizedPnl: "Profit or loss on trades still open — this number changes as prices move.",
  totalPnl: "Total realized profit/loss from completed trades plus current unrealized profit/loss.",
  activeGrids: "Active buy and sell grids deployed by the bot's grid-trading system.",
  drawdown: "The peak-to-trough decline during a specific record period, showing historical capital risk.",
  leverage: "Multiplier that increases your trading power (e.g. 5x leverage means a $100 margin opens a $500 position). Adds risk.",
  stalled: "Your bot stopped checking in. This can happen if it crashed or lost connection. Try restarting it.",
  personalities: {
    moderate: "Moderate: smaller trades, focuses on protecting your capital with safe multipliers.",
    balanced: "Balanced: standard balanced risk-reward profile across diversified coins.",
    aggressive: "Aggressive: high-frequency grids for maximum return potential. Higher risk."
  }
};

interface InfoTooltipProps {
  text: string;
}

function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-block ml-1 align-middle group cursor-help">
      <HelpCircle
        className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground transition-colors"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
      />
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-popover text-popover-foreground border border-border text-[10px] rounded-lg shadow-xl backdrop-blur-md leading-relaxed z-50 font-normal normal-case select-none">
          {text}
        </span>
      )}
    </span>
  );
}

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

export function MyBot() {
  const { data: summary, isLoading, refetch: refetchSummary } = usePortfolioSummary();
  const { history, fees, isLoading: perfLoading } = usePerformance();
  const { pauseInstance, resumeInstance, stopInstance } = useInstancesStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const isFullLoading = isLoading || perfLoading;

  const handleAction = async (instanceId: string, actionType: "pause" | "resume" | "stop") => {
    const key = `${instanceId}-${actionType}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      if (actionType === "pause") {
        await pauseInstance(instanceId);
      } else if (actionType === "resume") {
        await resumeInstance(instanceId);
      } else if (actionType === "stop") {
        await stopInstance(instanceId);
      }
      await refetchSummary();
    } catch (err) {
      console.error(`Failed execution of ${actionType} on instance ${instanceId}`, err);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

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

  const sortedHistory = history
    ? [...history].sort((a: any, b: any) => {
        const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      })
    : [];

  const trades = [...sortedHistory].reverse();

  // If there are no instances at all, we show a clean onboarding screen
  const instances = summary?.instances ?? [];
  const aggregate = summary?.aggregate;
  const delta24h = summary?.delta24h;

  const hasInstances = instances.length > 0;

  // Derive traffic light statuses
  const anyStalled = instances.some(i => i.status === "stalled");
  const activeInstanceCount = instances.filter(i => i.status !== "stopped").length;

  const getStatusLight = (type: "heartbeat" | "performance" | "deployment") => {
    if (type === "heartbeat") {
      if (instances.length === 0) return { color: "bg-muted", label: "No Deployed Bots" };
      if (anyStalled) return { color: "bg-rose-500", label: "Warning: Bot Stalled" };
      return { color: "bg-emerald-500", label: "All Bots Active" };
    }
    if (type === "performance") {
      const livePnl = aggregate?.totalUnrealizedPnl ?? 0;
      if (livePnl > 0) return { color: "bg-emerald-500", label: "Profit Positive" };
      if (livePnl < 0) return { color: "bg-rose-500", label: "Drawdown Range" };
      return { color: "bg-amber-400", label: "Break-even" };
    }
    if (type === "deployment") {
      if (activeInstanceCount > 0) return { color: "bg-emerald-500", label: `${activeInstanceCount} Active` };
      return { color: "bg-amber-400", label: "No Active Deploys" };
    }
    return { color: "bg-muted", label: "Unknown" };
  };

  const heartbeatLight = getStatusLight("heartbeat");
  const performanceLight = getStatusLight("performance");
  const deploymentLight = getStatusLight("deployment");

  // Format Status String for General Audience
  const getStatusHumanText = (status: string) => {
    switch (status) {
      case "starting":
        return "Initializing Bot...";
      case "running":
        return "Actively Trading";
      case "paused":
        return "Paused (Not placing new trades)";
      case "stopped":
        return "Stopped (Funds swept back)";
      case "stalled":
        return "Not responding — we're checking on it";
      default:
        return "Unknown Status";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Review aggregated parameters, live metrics, and strategy outputs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFundingModal(true)}
            className="font-mono text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Deposit Funds
          </Button>
          {hasInstances && instances.length < 5 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="font-mono text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5" />
              Launch Bot
            </Button>
          )}
        </div>
      </div>

      {isFullLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 font-mono text-sm text-muted-foreground">Loading portfolio details...</span>
        </div>
      ) : !hasInstances ? (
        /* Zero Instances Onboarding State */
        <Card className="bg-card/40 border-border/60 backdrop-blur-sm max-w-2xl mx-auto py-10 px-8 text-center space-y-6 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Deploy Your First Strategy</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              HueBox bots automatically trade on your behalf using your deposited USDT.
              Choose a personality style (Moderate, Balanced, or Aggressive) and let the engine handle the execution.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto font-mono text-xs font-bold px-6 h-10 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Launch Bot Instance
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFundingModal(true)}
              className="w-full sm:w-auto font-mono text-xs font-bold px-6 h-10 cursor-pointer"
            >
              Deposit USDT first
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* 24h performance banner */}
          {delta24h && delta24h.hasHistory && delta24h.profit !== null && (
            <div className={cn(
              "p-4 border rounded-xl flex items-center justify-between font-mono text-xs shadow-sm backdrop-blur-sm",
              delta24h.profit >= 0
                ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/5 border-rose-500/20 text-rose-400"
            )}>
              <div className="flex items-center gap-2">
                {delta24h.profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>
                  Your portfolio is <strong>{delta24h.profit >= 0 ? "up" : "down"} ${Math.abs(delta24h.profit).toFixed(2)}</strong> today ({delta24h.profitPercent !== null ? (delta24h.profitPercent >= 0 ? "+" : "") + delta24h.profitPercent.toFixed(2) : "0"}%)
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase">24H PERFORMANCE DELTA</span>
            </div>
          )}

          {/* Stalled Warn Banner */}
          {anyStalled && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/25 rounded-xl text-amber-400 font-mono text-xs flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[13px]">System Warning: Connection issue detected</strong>
                <p className="text-[11px] text-muted-foreground/90 mt-0.5 leading-relaxed">
                  One of your bot instances has stopped responding (stalled heartbeat). We are checking the server connection.
                  Try resuming/restarting the bot below. If the warning persists, please contact support.
                </p>
              </div>
            </div>
          )}

          {/* Aggregate metrics block */}
          <div className="grid gap-6 md:grid-cols-4 font-mono text-xs">
            {/* Total Allocated Capital */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                  DEPLOYED CAPITAL
                  <InfoTooltip text="Total USDT currently allocated to all running or paused bot instances combined." />
                </CardTitle>
                <Wallet2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-sans tracking-tight text-foreground">
                  ${aggregate?.totalDeployedCapital.toFixed(2) ?? "0.00"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Sum across active instances</p>
              </CardContent>
            </Card>

            {/* Total Wallet Balance */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                  WALLETS BALANCE
                  <InfoTooltip text="Total USDT balance in all your connected Bybit accounts and sub-accounts combined." />
                </CardTitle>
                <Wallet2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-sans tracking-tight text-foreground">
                  ${aggregate?.totalWalletBalance.toFixed(2) ?? "0.00"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Includes unrealized P&L</p>
              </CardContent>
            </Card>

            {/* Total Unrealized PnL */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                  UNREALIZED PNL
                  <InfoTooltip text={GLOSSARY.unrealizedPnl} />
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold font-sans tracking-tight",
                  (aggregate?.totalUnrealizedPnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {(aggregate?.totalUnrealizedPnl ?? 0) >= 0 ? "+" : ""}${aggregate?.totalUnrealizedPnl.toFixed(2) ?? "0.00"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">From all live positions</p>
              </CardContent>
            </Card>

            {/* Weighted ROI */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
                  WEIGHTED ROI
                  <InfoTooltip text={GLOSSARY.roi} />
                </CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold font-sans tracking-tight",
                  (aggregate?.weightedRoi ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {(aggregate?.weightedRoi ?? 0) >= 0 ? "+" : ""}{aggregate?.weightedRoi.toFixed(2) ?? "0.00"}%
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Weighted by allocated capital</p>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Light Status Dashboard */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-sm font-mono text-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                SYSTEM HEALTH INDICATORS
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-muted/15 border border-border/30 rounded-lg p-3">
                <span className={cn("w-3 h-3 rounded-full shrink-0 animate-pulse", heartbeatLight.color)} />
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Bot Heartbeats</span>
                  <span className="text-foreground text-xs font-sans font-bold">{heartbeatLight.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-muted/15 border border-border/30 rounded-lg p-3">
                <span className={cn("w-3 h-3 rounded-full shrink-0", performanceLight.color)} />
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Drawdown Status</span>
                  <span className="text-foreground text-xs font-sans font-bold">{performanceLight.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-muted/15 border border-border/30 rounded-lg p-3">
                <span className={cn("w-3 h-3 rounded-full shrink-0", deploymentLight.color)} />
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Active Deployments</span>
                  <span className="text-foreground text-xs font-sans font-bold">{deploymentLight.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instance list breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wider font-sans text-foreground uppercase flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Deployed Instances ({instances.length} of 5)
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {instances.map((inst) => {
                const isRunning = inst.status === "running";
                const isPaused = inst.status === "paused";
                const isStopped = inst.status === "stopped";
                const isStalled = inst.status === "stalled";

                const isPauseLoading = actionLoading[`${inst.instanceId}-pause`];
                const isResumeLoading = actionLoading[`${inst.instanceId}-resume`];
                const isStopLoading = actionLoading[`${inst.instanceId}-stop`];

                return (
                  <Card key={inst.instanceId} className={cn(
                    "bg-card/25 border backdrop-blur-sm shadow-md flex flex-col justify-between transition-all duration-200",
                    isStalled ? "border-rose-500/40 bg-rose-500/[0.02]" : "border-border/40"
                  )}>
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground capitalize">
                            Bot — {inst.personality}
                          </h3>
                          <Badge variant="outline" className={cn(
                            "px-2 py-0.5 text-[9px] uppercase font-bold border",
                            isRunning
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isPaused
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : isStalled
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                              : "bg-muted/30 text-muted-foreground border-border/30"
                          )}>
                            {getStatusHumanText(inst.status)}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1">ID: {inst.instanceId} • SubUid: {inst.subAccountId}</p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground/60 leading-none">
                        Last Active: {inst.lastCycleAt ? formatPerfDate(inst.lastCycleAt) : "N/A"}
                      </span>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                      {/* Metric lines */}
                      <div className="grid grid-cols-2 gap-4 font-mono text-xs border-y border-border/15 py-3">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">Allocated Capital</span>
                          <span className="text-foreground font-bold font-sans text-sm">${inst.allocatedAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">Wallet Balance</span>
                          <span className="text-foreground font-bold font-sans text-sm">${inst.walletBalanceUsdt.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">Unrealized P&L</span>
                          <span className={cn("font-bold font-sans text-sm", inst.unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {inst.unrealizedPnl >= 0 ? "+" : ""}${inst.unrealizedPnl.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">Return (ROI)</span>
                          <span className={cn("font-bold font-sans text-sm", inst.roi >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {inst.roi >= 0 ? "+" : ""}{inst.roi.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {/* Info & explanations block */}
                      <div className="space-y-2 text-[10px] leading-relaxed text-muted-foreground/80 font-mono">
                        <div className="flex items-center justify-between">
                          <span>Active Trading Grids:</span>
                          <span className="text-foreground font-bold">{inst.activeGrids} deployed</span>
                        </div>
                        <p className="bg-muted/20 border border-border/10 p-2.5 rounded-lg italic">
                          {GLOSSARY.personalities[inst.personality]}
                        </p>
                      </div>

                      {/* Goal Progress */}
                      <div className="border-t border-border/15 pt-3">
                        <GoalProgressCard instanceId={inst.instanceId} />
                      </div>

                      {/* Operations buttons */}
                      <div className="pt-2 flex gap-2">
                        {isPaused && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isResumeLoading}
                            onClick={() => handleAction(inst.instanceId, "resume")}
                            className="flex-1 font-mono text-[10px] font-bold h-8.5 cursor-pointer hover:bg-muted/40 gap-1.5"
                          >
                            {isResumeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 text-emerald-400" />}
                            Resume
                          </Button>
                        )}
                        {isRunning && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPauseLoading}
                            onClick={() => handleAction(inst.instanceId, "pause")}
                            className="flex-1 font-mono text-[10px] font-bold h-8.5 cursor-pointer hover:bg-muted/40 gap-1.5"
                          >
                            {isPauseLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3 text-amber-400" />}
                            Pause
                          </Button>
                        )}
                        {!isStopped && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isStopLoading}
                            onClick={() => handleAction(inst.instanceId, "stop")}
                            className="flex-1 font-mono text-[10px] font-bold h-8.5 cursor-pointer hover:bg-rose-500/10 hover:text-rose-400 gap-1.5"
                          >
                            {isStopLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3 text-rose-400" />}
                            Stop Bot
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                {sortedHistory.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground/60 italic font-mono text-xs">
                    Your profit history will update here after your bots close their first grid trade.
                  </div>
                ) : (
                  <div className="h-[300px] w-full font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sortedHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.25)" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => formatPerfDate(val, "MM/dd")} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                        <ReChartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary)/0.2)', strokeWidth: 1 }} />
                        <Line type="stepAfter" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
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
                {fees.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground/60 italic font-mono text-xs text-center px-6">
                    Commission fee records are not available.
                    <br />Fees will be graphed here as you close profitable positions.
                  </div>
                ) : (
                  <div className="h-[300px] w-full font-mono text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fees} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.25)" vertical={false} />
                        <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => formatPerfDate(val, "MM/dd")} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                        <ReChartsTooltip content={<CustomFeeTooltip />} cursor={{ fill: 'hsl(var(--primary)/0.05)' }} />
                        <Bar dataKey="fee" fill="hsl(var(--primary)/0.4)" stroke="hsl(var(--primary))" strokeWidth={1} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trade History Table */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-widest text-muted-foreground uppercase font-bold">
                  <Trophy className="w-4 h-4 text-primary" /> TRADE HISTORY
                </CardTitle>
                <CardDescription className="text-xs font-mono text-muted-foreground/60">
                  Recent closed position loops from your deployed trading engines.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-border/30">MAX 10 RECORDS</Badge>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground italic font-mono text-xs">
                  No trades logged in this session history.
                </div>
              ) : (
                <div className="overflow-x-auto border border-border/30 rounded-xl bg-muted/10">
                  <table className="w-full text-xs text-left border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-border/30 text-muted-foreground bg-muted/15 text-xs">
                        <th className="py-3 px-4 font-semibold">CLOSED DATE</th>
                        <th className="py-3 px-4 font-semibold">PAIR</th>
                        <th className="py-3 px-4 font-semibold">BOT INSTANCE</th>
                        <th className="py-3 px-4 font-semibold">DIRECTION</th>
                        <th className="py-3 px-4 font-semibold text-right">NET RETURN (USDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/15">
                      {trades.slice(0, 10).map((trade: any, idx: number) => {
                        const botInstanceObj = instances.find(i => i.instanceId === trade.instanceId);
                        const botName = botInstanceObj ? `${botInstanceObj.personality.toUpperCase()} (${trade.instanceId.slice(0, 6)})` : (trade.instanceId ? `Instance ${trade.instanceId.slice(0, 6)}` : "—");

                        return (
                          <tr key={idx} className="hover:bg-muted/15 transition-colors">
                            <td className="py-3 px-4 text-muted-foreground">{formatPerfDate(trade.timestamp, "MMM dd, HH:mm")}</td>
                            <td className="py-3 px-4 font-bold font-sans text-foreground">{trade.symbol || "—"}</td>
                            <td className="py-3 px-4 font-semibold text-muted-foreground">{botName}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono text-xs px-2 py-0.5 border font-semibold",
                                  trade.side === "long" || trade.pnlUsdt >= 0
                                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                    : "text-rose-400 border-rose-400/20 bg-rose-500/10"
                                )}
                              >
                                {trade.side ? trade.side.toUpperCase() : (trade.pnlUsdt >= 0 ? "LONG" : "SHORT")}
                              </Badge>
                            </td>
                            <td className={cn(
                              "py-3 px-4 text-right font-bold font-sans",
                              trade.pnlUsdt >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {trade.pnlUsdt >= 0 ? "+" : ""}${Number(trade.pnlUsdt ?? 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modals */}
      <AddInstanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        availableBalance={aggregate?.totalWalletBalance ?? 0}
        onLaunched={() => refetchSummary()}
      />
      <FundingModal
        isOpen={showFundingModal}
        onClose={() => setShowFundingModal(false)}
      />
    </div>
  );
}
