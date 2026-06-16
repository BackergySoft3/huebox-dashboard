import { useBotStatus } from "../Hooks/useBotStatus";
import { useLogStream } from "../Hooks/useLogStream";
import { usePerformance } from "../Hooks/usePerformance";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { TrendingUp, Layers, CircleDollarSign, Terminal } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Badge } from "../Components/Atoms/badge";

export function Overview() {
  const { data: botStatus, error, status: queryStatus, isError } = useBotStatus();
  const { logBuffer } = useLogStream();
  const { history } = usePerformance();

  // Shorten history to last 24 items
  const chartData = history
    ? [...history]
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-24)
    : [];

  // Recent 5 logs compiled from python/nestjs
  const recentLogs = [...logBuffer.python, ...logBuffer.nestjs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time status metrics and execution feed.</p>
        {isError && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-mono">
            ⚠ Status API Error ({queryStatus}): {(error as any)?.response?.status || "network"} — {(error as any)?.response?.data?.message || (error as any)?.message || "Unknown error"}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground">LIVE ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {botStatus?.live_roi ? `+${botStatus.live_roi.toFixed(2)}%` : "0.00%"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Current active cycle ROI</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground">MARGIN USED</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground">
              ${botStatus?.margin_used?.toFixed(2) || "0.00"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">Total margin allocated</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono tracking-wider text-muted-foreground">OPEN GRIDS</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              {botStatus?.active_grids || 0}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono font-medium">Currently active placements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Equity curve */}
        <Card className="md:col-span-2 bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-mono tracking-wider text-foreground">EQUITY CURVE (24H)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPnlMini" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="pnl" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={1.5} 
                      fillOpacity={1} 
                      fill="url(#colorPnlMini)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                  Awaiting performance history updates...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/20 py-3">
            <CardTitle className="text-xs font-mono tracking-wider flex items-center gap-2 text-foreground">
              <Terminal className="w-3.5 h-3.5" /> RECENT ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto min-h-0">
            {recentLogs.length > 0 ? (
              <div className="divide-y divide-border/20 font-mono text-[11px] leading-relaxed">
                {recentLogs.map((log) => {
                  let colorClass = "text-foreground";
                  if (log.level === "error") colorClass = "text-red-400";
                  if (log.level === "warn") colorClass = "text-amber-400";
                  if (log.level === "debug") colorClass = "text-muted-foreground";

                  return (
                    <div key={log.id} className="p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1 text-[10px]">
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase px-1 h-4">
                          {log.level}
                        </Badge>
                      </div>
                      <div className={`break-words line-clamp-2 ${colorClass}`}>{log.message}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground font-mono h-full flex items-center justify-center">
                Waiting for engine logs...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
