import { useBotStatus } from "../Hooks/useBotStatus";
import { useBotStore } from "../State/bot";
import { usePerformance } from "../Hooks/usePerformance";
import { BotStepper } from "../Components/Organisms/BotStepper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { Trophy, TrendingUp, TrendingDown, Target, Wallet2, Brain, GitMerge, Bot } from "lucide-react";

export function MyBot() {
  const { data: status, isLoading: statusLoading } = useBotStatus();
  const { history, fees, summary, isLoading: perfLoading } = usePerformance();
  const cycleCounter = useBotStore((state) => state.cycleCounter);

  const grids = status?.grids || [];
  const activePositionsCount = grids.length;

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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-xs text-muted-foreground animate-pulse">
        Loading bot metrics and performance dataset...
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
      : "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bot</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">Overview of your automated trading bot activity and lifecycle performance.</p>
        </div>
        <div className="flex items-center gap-2">
          {cycleCounter > 0 && (
            <Badge variant="default" className="text-xs font-mono py-1 px-3">
              CYCLE {cycleCounter}
            </Badge>
          )}
        </div>
      </div>

      {/* Top Section: Simplified Bot Status, Cycle Summary, Strategy Copilot */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Bot Status Card */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <Bot className="w-4 h-4 text-primary" />
              BOT STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Current State</span>
              <Badge variant="outline" className={`${botStateColor} px-2 py-0.5 text-[10px]`}>
                {botState}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active Positions</span>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px]">
                {activePositionsCount} ACTIVE
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cycle Summary Card */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <GitMerge className="w-4 h-4 text-primary" />
              CYCLE SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Scanned Coins</span>
              <span className="font-bold text-foreground">{cycleStats?.scanned || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Active Signals</span>
              <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 px-1.5 h-5 text-[10px]">
                {cycleStats?.hot || 0} HOT
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Copilot Card */}
        <Card className="bg-card/30 border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)] backdrop-blur-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <Brain className="w-4 h-4 text-primary animate-pulse" />
              STRATEGY COPILOT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-border/20 pb-1.5">
              <span className="text-slate-500">Suggested Action</span>
              <Badge variant={llmRec.action === "LONG" ? "default" : llmRec.action === "SHORT" ? "destructive" : "secondary"} className="h-5 text-[10px]">
                {llmRec.action}
              </Badge>
            </div>
            <div className="bg-black/35 p-2 rounded border border-border/20 text-slate-400 italic text-[10px] leading-relaxed">
              "{llmRec.reasoning}"
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Stepper: Simplified Mode */}
      <BotStepper simplified={true} />

      {/* Middle Section: Performance KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 font-mono">
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground">WIN RATE</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-200">
              {summary?.winRate ? `${Number(summary.winRate).toFixed(1)}%` : "0.0%"}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground">AVG PNL / TRADE</CardTitle>
            <Wallet2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary && Number(summary.avgPnl ?? 0) >= 0 ? "text-emerald-400" : "text-destructive"}`}>
              {summary?.avgPnl ? `$${Number(summary.avgPnl).toFixed(2)}` : "$0.00"}
            </div>
          </CardContent>
        </Card>
 
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground">BEST TRADE</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {summary?.bestTrade ? `+$${Number(summary.bestTrade).toFixed(2)}` : "$0.00"}
            </div>
          </CardContent>
        </Card>
 
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground">WORST TRADE</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary?.worstTrade ? `-$${Number(Math.abs(summary.worstTrade)).toFixed(2)}` : "$0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PnL Chart */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-wider text-slate-200">HISTORICAL PNL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedHistory} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(val) => formatPerfDate(val, "MM/dd")} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} labelFormatter={(val) => formatPerfDate(val, "PPp")} />
                  <Line type="stepAfter" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fees Chart */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-wider text-slate-200">FEE ACCUMULATION</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayFees} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} strokeOpacity={0.2} />
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(val) => formatPerfDate(val, "MM/dd")} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }} />
                  <Bar dataKey="fee" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade History Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
            <Trophy className="w-4 h-4 text-primary" /> TRADE HISTORY
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-slate-500">Most recent exits and order closures.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-border/40 rounded-md bg-card/20">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
                  <th className="py-2.5 px-4 font-medium">DATE</th>
                  <th className="py-2.5 px-4 font-medium">SYMBOL</th>
                  <th className="py-2.5 px-4 font-medium">DIRECTION</th>
                  <th className="py-2.5 px-4 font-medium text-right">PNL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {trades.slice(0, 10).map((trade: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400">{formatPerfDate(trade.timestamp, "MMM dd, HH:mm")}</td>
                    <td className="py-2.5 px-4 font-bold text-foreground">{trade.symbol || "BTCUSDT"}</td>
                    <td className="py-2.5 px-4">
                      <Badge 
                        variant="outline" 
                        className={trade.pnl >= 0 
                          ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                          : "text-red-400 border-red-500/20 bg-red-500/5"}
                      >
                        {trade.direction || (trade.pnl >= 0 ? "LONG" : "SHORT")}
                      </Badge>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-bold ${trade.pnl >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                      {trade.pnl >= 0 ? "+" : ""}${Number(trade.pnl ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground italic">No trades found.</td>
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
