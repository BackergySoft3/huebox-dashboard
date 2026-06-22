import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminBotsApi } from "../Services/adminBotsApi";
import type { BotSummary } from "../Interfaces/bot";
import { BotStatus } from "../Enums/BotStatus.enum";
import { Personality } from "../Enums/Personality.enum";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Bot, Cpu, AlertTriangle, RefreshCw, Activity, Square, Pause, Play, Edit, Megaphone } from "lucide-react";
import { Button } from "../Components/Atoms/button";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { cn } from "../Helpers/utils";

const STATUS_COLORS: Record<BotStatus, string> = {
  [BotStatus.Running]: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  [BotStatus.Paused]:  "text-amber-400 border-amber-500/20 bg-amber-500/10",
  [BotStatus.Stalled]: "text-rose-455 border-rose-500/20 bg-rose-500/10",
  [BotStatus.Stopped]: "text-muted-foreground/60 border-border/30 bg-muted/5",
};

export function AdminBots() {
  const queryClient = useQueryClient();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'force-stop' | 'force-pause' | 'force-resume' | 'broadcast-pause' | 'edit-personality';
    userId?: string;
    email?: string;
    title: string;
    description: string;
    selectedPersonality?: string;
  }>({ isOpen: false, type: 'force-pause', title: '', description: '' });

  const { data: bots, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-bots"],
    queryFn: () => adminBotsApi.list(),
    refetchInterval: 8000,
  });

  const { data: aggregate } = useQuery({
    queryKey: ["admin-bots-aggregate"],
    queryFn: () => adminBotsApi.aggregate(),
    refetchInterval: 8000,
  });

  const stopMutation = useMutation({
    mutationFn: (userId: string) => adminBotsApi.forceStop(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to stop bot")
  });

  const pauseMutation = useMutation({
    mutationFn: (userId: string) => adminBotsApi.forcePause(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to pause bot")
  });

  const resumeMutation = useMutation({
    mutationFn: (userId: string) => adminBotsApi.forceResume(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to resume bot")
  });

  const personalityMutation = useMutation({
    mutationFn: ({ userId, p }: { userId: string, p: string }) => adminBotsApi.overridePersonality(userId, p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin-bots"] }), 2000);
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to override personality")
  });

  const broadcastPauseMutation = useMutation({
    mutationFn: () => adminBotsApi.broadcastPause(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: (err: any) => {
      if (err.status === 403) alert("Access Denied: Requires SUPERADMIN");
      else alert(err?.data?.message?.[0] || err.message || "Failed to broadcast pause");
    }
  });

  const handleAction = async () => {
    try {
      if (confirmModal.type === 'force-stop' && confirmModal.userId) {
        await stopMutation.mutateAsync(confirmModal.userId);
      } else if (confirmModal.type === 'force-pause' && confirmModal.userId) {
        await pauseMutation.mutateAsync(confirmModal.userId);
      } else if (confirmModal.type === 'force-resume' && confirmModal.userId) {
        await resumeMutation.mutateAsync(confirmModal.userId);
      } else if (confirmModal.type === 'edit-personality' && confirmModal.userId && confirmModal.selectedPersonality) {
        await personalityMutation.mutateAsync({ userId: confirmModal.userId, p: confirmModal.selectedPersonality });
      } else if (confirmModal.type === 'broadcast-pause') {
        await broadcastPauseMutation.mutateAsync();
      }
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const openModal = (type: any, userId?: string, email?: string, currentPersonality?: string) => {
    let title = '';
    let description = '';
    if (type === 'force-stop') {
      title = 'Force Stop Bot';
      description = `This will close ALL positions for ${email || userId}. Continue?`;
    } else if (type === 'force-pause') {
      title = 'Pause Bot';
      description = `Pause trading bot for ${email || userId}?`;
    } else if (type === 'force-resume') {
      title = 'Resume Bot';
      description = `Resume trading bot for ${email || userId}?`;
    } else if (type === 'broadcast-pause') {
      title = 'EMERGENCY BROADCAST PAUSE';
      description = `This will pause EVERY actively running bot simultaneously. Are you absolutely sure?`;
    } else if (type === 'edit-personality') {
      title = 'Edit Personality';
      description = `Change personality for ${email || userId}`;
    }

    setConfirmModal({ 
      isOpen: true, 
      type, 
      userId, 
      email, 
      title, 
      description, 
      selectedPersonality: currentPersonality || Personality.Balanced
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/20 border border-border/40 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Bot Oversight</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Live monitoring · Polled {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="destructive" size="sm" onClick={() => openModal('broadcast-pause')} className="gap-2 font-mono text-xs font-bold border border-rose-500/25 bg-rose-600 hover:bg-rose-500 shadow-md">
            <Megaphone className="w-3.5 h-3.5 animate-pulse" /> Emergency Pause
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 font-mono text-xs font-bold shadow-sm bg-card/40">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <Card className="bg-card/30 border-border/40 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground uppercase tracking-wider font-extrabold">Active Slots</p>
                <p className="text-2xl font-bold mt-1.5 text-emerald-450 font-sans tracking-tight">{aggregate?.totalActiveSlots ?? 0}</p>
              </div>
              <Activity className="w-8 h-8 text-emerald-450 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/40 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground uppercase tracking-wider font-extrabold">Aggregate P&L</p>
                <p className={cn("text-2xl font-bold mt-1.5 font-sans tracking-tight", (aggregate?.combinedUnrealisedPnl ?? 0) >= 0 ? "text-emerald-455" : "text-rose-455")}>
                  ${aggregate?.combinedUnrealisedPnl?.toFixed(2) ?? "0.00"}
                </p>
              </div>
              <Bot className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/40 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground uppercase tracking-wider font-extrabold">Stalled Bots</p>
                <p className="text-2xl font-bold mt-1.5 text-rose-500 font-sans tracking-tight">{aggregate?.stalledCount ?? 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-500 opacity-20 animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/40 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground uppercase tracking-wider font-extrabold">Active Regimes</p>
                <p className="text-sm font-bold mt-2.5 font-sans text-foreground">
                  {aggregate?.regimeSplit?.scouting ?? 0} <span className="text-[10px] font-mono font-normal text-muted-foreground/60">Scout</span> · {aggregate?.regimeSplit?.farming ?? 0} <span className="text-[10px] font-mono font-normal text-muted-foreground/60">Farm</span>
                </p>
              </div>
              <Cpu className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 border-b border-border/20">
          <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2 font-bold">
            <Cpu className="w-4 h-4 text-primary" /> USER BOT CORE MONITOR
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-mono">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground bg-muted/15 text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-4">OPERATOR</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">REGIME</th>
                  <th className="py-3 px-4">PERSONALITY</th>
                  <th className="py-3 px-4">SLOTS</th>
                  <th className="py-3 px-4">UNREAL. P&L</th>
                  <th className="py-3 px-4">HEARTBEAT</th>
                  <th className="py-3 px-4 text-right">CONTROLS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/15">
                {isLoading ? (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground italic font-mono animate-pulse">Querying active threads...</td></tr>
                ) : (!bots || bots.length === 0) ? (
                  <tr><td colSpan={8} className="py-10 text-center text-muted-foreground italic font-mono">No active bot threads running.</td></tr>
                ) : (
                  bots.map((bot: BotSummary, i: number) => {
                    return (
                      <tr key={bot.userId ?? i} className="hover:bg-muted/15 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-bold text-foreground truncate max-w-[155px]">
                          {bot.email ?? bot.userId ?? "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border px-2 py-0.5", STATUS_COLORS[bot.status] ?? "")}>
                            {bot.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border px-2 py-0.5", bot.regime === "SCOUTING" ? "text-sky-400 border-sky-500/20 bg-sky-500/5" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5")}>
                            {bot.regime === "SCOUTING" ? "Scouting" : bot.regime === "FARMING" ? "Farming" : "Unknown"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-bold uppercase text-[10px]">{bot.personality ?? "—"}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-bold">{bot.activeSlots} / {bot.maxSlots}</td>
                        <td className={cn("py-3.5 px-4 font-sans font-bold text-[13px]", bot.unrealisedPnlUsdt >= 0 ? "text-emerald-400" : "text-rose-455")}>
                          {bot.unrealisedPnlUsdt >= 0 ? "+" : ""}{bot.unrealisedPnlUsdt.toFixed(2)} <span className="text-[9px] font-mono text-muted-foreground font-normal">USDT</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            "font-bold text-[10px] px-1.5 py-0.5 rounded border inline-block",
                            bot.heartbeatAgeSeconds > 300 
                              ? "text-rose-455 border-rose-500/20 bg-rose-500/5 animate-pulse" 
                              : "text-muted-foreground border-border/30 bg-muted/5"
                          )}>
                            {bot.heartbeatAgeSeconds < 60 
                              ? `${bot.heartbeatAgeSeconds}s ago` 
                              : `${Math.floor(bot.heartbeatAgeSeconds / 60)}m ago`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-400 hover:bg-sky-500/10 rounded-md" onClick={() => openModal('edit-personality', bot.userId, bot.email, bot.personality)} title="Edit Personality">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            {bot.status === 'paused' ? (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10 rounded-md" onClick={() => openModal('force-resume', bot.userId, bot.email)} title="Resume">
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400 hover:bg-amber-500/10 rounded-md" onClick={() => openModal('force-pause', bot.userId, bot.email)} title="Pause">
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md" onClick={() => openModal('force-stop', bot.userId, bot.email)} title="Force Stop">
                              <Square className="w-3.5 h-3.5 fill-current" />
                            </Button>
                          </div>
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

      {confirmModal.isOpen && (
        <ConfirmModal
          title={confirmModal.title}
          description={confirmModal.description}
          onConfirm={handleAction}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          confirmLabel="Confirm Action"
          requireConfirmText={confirmModal.type === 'broadcast-pause' ? "PAUSE ALL" : undefined}
          danger={confirmModal.type === 'force-stop' || confirmModal.type === 'broadcast-pause'}
        >
          {confirmModal.type === 'edit-personality' && (
            <div className="mt-4 space-y-2 text-left font-mono text-xs">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Choose Target Strategy Personality</label>
              <select
                value={confirmModal.selectedPersonality}
                onChange={(e) => setConfirmModal({ ...confirmModal, selectedPersonality: e.target.value })}
                className="w-full bg-muted/30 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
              >
                {Object.values(Personality).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
        </ConfirmModal>
      )}
    </div>
  );
}
