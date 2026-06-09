import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Bot, Cpu, AlertTriangle, RefreshCw, Activity } from "lucide-react";
import { Button } from "../components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  running: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  paused: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  stalled: "text-red-400 border-red-500/20 bg-red-500/5",
  stopped: "text-slate-400 border-slate-500/20 bg-slate-500/5",
};

export function AdminBots() {
  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-bots"],
    queryFn: () => api.get("/api/bot/admin/all").then((r) => r.data).catch(() => ({
      bots: [], stats: { running: 0, stalled: 0, totalPnl: 0 }
    })),
    refetchInterval: 10000,
  });

  const bots: any[] = data?.bots ?? data ?? [];
  const running = bots.filter((b: any) => b.status === "running").length;
  const stalled = bots.filter((b: any) => b.status === "stalled").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bot Oversight</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Live-polling · Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Running", value: running, icon: Activity, color: "text-emerald-400" },
          { label: "Stalled", value: stalled, icon: AlertTriangle, color: "text-red-400" },
          { label: "Total Bots", value: bots.length, icon: Bot, color: "text-primary" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card/30 border-border/40">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bot Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
            <Cpu className="w-4 h-4 text-primary" /> ACTIVE BOT STATES
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
                  <th className="py-2.5 px-4">USER</th>
                  <th className="py-2.5 px-4">STATUS</th>
                  <th className="py-2.5 px-4">PERSONALITY</th>
                  <th className="py-2.5 px-4">PNL</th>
                  <th className="py-2.5 px-4">LAST HEARTBEAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-500 italic">Loading bot states…</td></tr>
                ) : bots.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-500">No active bots.</td></tr>
                ) : (
                  bots.map((bot: any, i: number) => {
                    const hbAge = bot.lastHeartbeat ? (Date.now() - new Date(bot.lastHeartbeat).getTime()) / 1000 / 60 : null;
                    return (
                      <tr key={bot.userId ?? i} className="hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 px-4 text-foreground">{bot.email ?? bot.userId ?? "—"}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[bot.status] ?? ""}`}>
                            {bot.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{bot.personality ?? "—"}</td>
                        <td className={`py-2.5 px-4 font-bold ${(bot.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {bot.pnl != null ? `${bot.pnl >= 0 ? "+" : ""}${bot.pnl.toFixed(2)} USDT` : "—"}
                        </td>
                        <td className={`py-2.5 px-4 ${hbAge != null && hbAge > 5 ? "text-red-400" : "text-slate-400"}`}>
                          {hbAge != null ? `${hbAge.toFixed(1)}m ago` : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
