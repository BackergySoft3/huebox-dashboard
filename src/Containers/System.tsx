import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Badge } from "../Components/Atoms/badge";
import { Server, RotateCcw, AlertTriangle, Users, Wallet } from "lucide-react";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { cn } from "../Helpers/utils";

interface AxiosErrorLike {
  response?: {
    status?: number;
  };
}

interface BybitTransfer {
  username?: string;
  status?: string;
  uid?: string | number;
  balance?: number;
}

export function System() {
  const queryClient = useQueryClient();
  const [showRestartModal, setShowRestartModal] = useState(false);

  // Poll System Status
  const { data: sysStatus, error: sysError } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => api.get("/api/bot/system/status").then((r) => r.data),
    refetchInterval: 10000,
    retry: false,
  });

  const typedSysError = sysError as AxiosErrorLike | null;
  const isForbidden = typedSysError?.response?.status === 403;

  // Poll Bybit Transfers
  const { data: transfersRaw } = useQuery({
    queryKey: ["bybit-transfers"],
    queryFn: () => api.get("/api/bybit/transfers").then((r) => r.data).catch(() => []),
    refetchInterval: 10000,
  });

  const transfers = transfersRaw 
    ? (Array.isArray(transfersRaw) ? transfersRaw : transfersRaw.transfers || [])
    : [];

  // Poll Balance Poller
  const { data: pollerStatus } = useQuery({
    queryKey: ["balance-poller-status"],
    queryFn: () => api.get("/api/bot/balance-poller/status").then((r) => r.data).catch(() => null),
    refetchInterval: 10000,
  });

  const displayPoller = pollerStatus || { lastChecked: new Date().toISOString(), monitoredCount: 3 };

  // Mutations
  const restartMutation = useMutation({
    mutationFn: () => api.post("/api/bot/system/restart"),
    onSuccess: () => {
      setShowRestartModal(false);
      queryClient.invalidateQueries({ queryKey: ["system-status"] });
    },
  });

  const handleRestart = async () => {
    await restartMutation.mutateAsync();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">System Configuration</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Manage daemon modules, EC2 instances, and sub-accounts.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* EC2 Status - Spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-card to-card/65 border-border/40 backdrop-blur-sm shadow-md h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/25">
              <CardTitle className="flex items-center justify-between font-mono text-xs tracking-wider text-slate-200">
                <span className="flex items-center gap-2 font-bold">
                  <span className="flex gap-1.5 mr-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </span>
                  <Server className="w-4 h-4 text-primary inline" />
                  EC2 SYSTEMD METRICS
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  SSM Console
                </span>
              </CardTitle>
              <CardDescription className="text-[10px] font-mono text-slate-500 mt-1">
                SSM active daemon output logs (Refreshes automatically).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 font-mono text-xs flex-1 flex flex-col justify-between">
              <div className="relative group/term flex-1">
                <div className="absolute top-2.5 right-3 opacity-0 group-hover/term:opacity-100 transition-opacity duration-200">
                  <span className="text-[9px] font-mono bg-black/50 text-slate-400 px-2 py-0.5 rounded border border-border/20 uppercase">
                    tty1
                  </span>
                </div>
                <pre className="bg-black/90 border border-border/30 p-4 rounded-xl text-slate-300 overflow-x-auto max-h-72 min-h-[160px] whitespace-pre text-[11px] leading-relaxed font-mono font-medium shadow-inner flex-1">
                  {sysError ? (
                    isForbidden ? (
                      <span className="text-rose-400/90 font-bold">Access Denied: Admin privileges required.</span>
                    ) : (
                      <span className="text-rose-400/90 font-bold">Failed to fetch system status.</span>
                    )
                  ) : sysStatus ? (
                    JSON.stringify(sysStatus, null, 2)
                  ) : (
                    <span className="text-slate-500 animate-pulse">Fetching status...</span>
                  )}
                </pre>
              </div>
              
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3 shadow-sm mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[11px] text-amber-400/90 leading-relaxed font-mono">
                  <strong className="text-foreground">AWS SSM Verification Required:</strong> System restarts command active AWS agents. Daemon reload operations will fail if run outside AWS VPC environments.
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-5 border-t border-border/15">
              <Button 
                variant="outline" 
                className="w-full font-mono text-xs font-bold uppercase tracking-wider text-rose-455 hover:bg-rose-500/10 hover:border-rose-500/40 border-rose-500/20 shadow-sm transition-all duration-300 cursor-pointer h-9.5" 
                onClick={() => setShowRestartModal(true)}
                disabled={isForbidden}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-2" /> Restart Daemon Service
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Balance Poller / subaccounts - Spans 1 column */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-card to-card/65 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-3 border-b border-border/25">
              <CardTitle className="flex items-center justify-between font-mono text-xs tracking-wider text-slate-200">
                <span className="flex items-center gap-2 font-bold">
                  <Wallet className="w-4 h-4 text-primary" />
                  BALANCE POLLER
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Active</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 font-mono text-xs text-slate-300">
              <div className="flex justify-between items-center border-b border-border/20 pb-2.5">
                <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Status Indicator</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/20 text-[10px] h-5 font-mono px-2 font-bold">
                  RUNNING
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b border-border/20 pb-2.5">
                <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Last Synced</span>
                <span className="font-bold text-foreground">{displayPoller?.lastChecked ? new Date(displayPoller.lastChecked).toLocaleTimeString() : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Monitored Keys</span>
                <span className="font-extrabold text-primary text-sm font-sans">{displayPoller?.monitoredCount || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/65 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-3 border-b border-border/25">
              <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200 font-bold">
                <Users className="w-4 h-4 text-primary" />
                BYBIT SUB-ACCOUNTS
              </CardTitle>
              <CardDescription className="text-[10px] font-mono text-slate-500 mt-1">
                Monitored accounts dynamically swept via API.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {transfers.length > 0 ? (
                <div className="space-y-3 font-mono text-xs">
                  {transfers.map((t: BybitTransfer, i: number) => {
                    const isActive = t.status === 'ACTIVE';
                    return (
                      <div key={i} className="p-3 bg-muted/20 border border-border/25 rounded-xl flex flex-col gap-2 relative group hover:border-primary/20 transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground text-sm font-sans">{t.username || "Sub-Account"}</span>
                          <Badge className={cn(
                            "border-transparent text-[9px] font-bold px-1.5 h-4.5 font-mono",
                            isActive 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}>
                            {t.status || "UNKNOWN"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-border/10">
                          <span className="text-slate-500">UID: {t.uid || "N/A"}</span>
                          <span className="font-bold text-emerald-400 text-xs font-sans">
                            {t.balance !== undefined ? `$${t.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-6 font-mono border border-dashed border-border/20 rounded-xl">
                  No linked sub-accounts detected.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showRestartModal && (
        <ConfirmModal
          title="Restart System Service"
          description="This will execute an AWS SSM remote command to restart the systemd service for the trading bot on the EC2 instance. WARNING: This action immediately disrupts active bot trading loops."
          onConfirm={handleRestart}
          onCancel={() => setShowRestartModal(false)}
        />
      )}
    </div>
  );
}
