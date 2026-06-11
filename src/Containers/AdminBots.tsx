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

const STATUS_COLORS: Record<BotStatus, string> = {
  [BotStatus.Running]: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  [BotStatus.Paused]:  "text-amber-400 border-amber-500/20 bg-amber-500/5",
  [BotStatus.Stalled]: "text-red-400 border-red-500/20 bg-red-500/5",
  [BotStatus.Stopped]: "text-slate-400 border-slate-500/20 bg-slate-500/5",
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
      // alert(data.message || "Bot force stopped");
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to stop bot")
  });

  const pauseMutation = useMutation({
    mutationFn: (userId: string) => adminBotsApi.forcePause(userId),
    onSuccess: () => {
      // alert(data.message || "Bot force paused");
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to pause bot")
  });

  const resumeMutation = useMutation({
    mutationFn: (userId: string) => adminBotsApi.forceResume(userId),
    onSuccess: () => {
      // alert(data.message || "Bot force resumed");
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to resume bot")
  });

  const personalityMutation = useMutation({
    mutationFn: ({ userId, p }: { userId: string, p: string }) => adminBotsApi.overridePersonality(userId, p),
    onSuccess: () => {
      // alert("Personality overridden");
      queryClient.invalidateQueries({ queryKey: ["admin-bots"] });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin-bots"] }), 2000);
    },
    onError: (err: any) => alert(err?.data?.message?.[0] || err.message || "Failed to override personality")
  });

  const broadcastPauseMutation = useMutation({
    mutationFn: () => adminBotsApi.broadcastPause(),
    onSuccess: () => {
      // alert(data.message || "Broadcast pause successful");
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bot Oversight</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Live-polling · Updated {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="destructive" size="sm" onClick={() => openModal('broadcast-pause')} className="gap-2 font-mono text-xs">
            <Megaphone className="w-3.5 h-3.5" /> Broadcast Pause
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/30 border-border/40">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Active Slots</p>
                <p className="text-2xl font-bold mt-1 text-emerald-400">{aggregate?.totalActiveSlots ?? 0}</p>
              </div>
              <Activity className="w-8 h-8 text-emerald-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/40">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Unrealised PnL</p>
                <p className={`text-2xl font-bold mt-1 ${(aggregate?.combinedUnrealisedPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  ${aggregate?.combinedUnrealisedPnl?.toFixed(2) ?? "0.00"}
                </p>
              </div>
              <Bot className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/40">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Stalled Bots</p>
                <p className="text-2xl font-bold mt-1 text-red-400">{aggregate?.stalledCount ?? 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-border/40">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground uppercase">Regime Split</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {aggregate?.regimeSplit?.scouting ?? 0} <span className="text-sm font-normal text-muted-foreground">Scout</span> / {aggregate?.regimeSplit?.farming ?? 0} <span className="text-sm font-normal text-muted-foreground">Farm</span>
                </p>
              </div>
              <Cpu className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
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
                  <th className="py-2.5 px-4">REGIME</th>
                  <th className="py-2.5 px-4">PERSONALITY</th>
                  <th className="py-2.5 px-4">SLOTS</th>
                  <th className="py-2.5 px-4">UNREAL. PNL</th>
                  <th className="py-2.5 px-4">HEARTBEAT</th>
                  <th className="py-2.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoading ? (
                  <tr><td colSpan={8} className="py-10 text-center text-slate-500 italic">Loading bot states…</td></tr>
                ) : (!bots || bots.length === 0) ? (
                  <tr><td colSpan={8} className="py-10 text-center text-slate-500">No active bots.</td></tr>
                ) : (
                  bots.map((bot: BotSummary, i: number) => {
                    return (
                      <tr key={bot.userId ?? i} className="hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 px-4 text-foreground truncate max-w-[150px]">{bot.email ?? bot.userId ?? "—"}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[bot.status] ?? ""}`}>
                            {bot.status ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {bot.regime === "SCOUTING" ? "Scanning" : bot.regime === "FARMING" ? "Active" : "Unknown"}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{bot.personality ?? "—"}</td>
                        <td className="py-2.5 px-4 text-slate-300">{bot.activeSlots} / {bot.maxSlots}</td>
                        <td className={`py-2.5 px-4 font-bold ${bot.unrealisedPnlUsdt >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {bot.unrealisedPnlUsdt >= 0 ? "+" : ""}{bot.unrealisedPnlUsdt.toFixed(2)} USDT
                        </td>
                        <td className={`py-2.5 px-4 ${bot.heartbeatAgeSeconds > 300 ? "text-red-400" : "text-slate-400"}`}>
                          {bot.heartbeatAgeSeconds < 60 
                            ? `${bot.heartbeatAgeSeconds}s ago` 
                            : `${Math.floor(bot.heartbeatAgeSeconds / 60)}m ago`}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-sky-400" onClick={() => openModal('edit-personality', bot.userId, bot.email, bot.personality)} title="Edit Personality">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            {bot.status === 'paused' ? (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" onClick={() => openModal('force-resume', bot.userId, bot.email)} title="Resume">
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400" onClick={() => openModal('force-pause', bot.userId, bot.email)} title="Pause">
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => openModal('force-stop', bot.userId, bot.email)} title="Force Stop">
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
          confirmLabel="Confirm"
          requireConfirmText={confirmModal.type === 'broadcast-pause' ? "PAUSE ALL" : undefined}
          danger={confirmModal.type === 'force-stop' || confirmModal.type === 'broadcast-pause'}
        >
          {confirmModal.type === 'edit-personality' && (
            <div className="mt-4 space-y-2 text-left">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Personality</label>
              <select
                value={confirmModal.selectedPersonality}
                onChange={(e) => setConfirmModal({ ...confirmModal, selectedPersonality: e.target.value })}
                className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
