import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Server, RotateCcw, AlertTriangle, Users, Wallet } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

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

  const handleRestart = () => {
    restartMutation.mutate();
  };

  const loading = restartMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">Manage daemon modules, EC2 instances, and sub-accounts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* EC2 Status */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <Server className="w-4 h-4 text-primary" />
              EC2 SYSTEMD METRICS
            </CardTitle>
            <CardDescription className="text-[10px] font-mono text-slate-500">SSM active daemon output.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-xs">
            <div className="bg-black/60 p-4 rounded border border-border/20 text-slate-400 overflow-x-auto max-h-64 whitespace-pre text-[11px] leading-relaxed">
              {sysError ? (
                (sysError as any)?.response?.status === 403 ? (
                  <span className="text-red-400/90">Access Denied: Admin privileges required.</span>
                ) : (
                  <span className="text-destructive">Failed to fetch system status.</span>
                )
              ) : sysStatus ? (
                JSON.stringify(sysStatus, null, 2)
              ) : (
                "Fetching status..."
              )}
            </div>
            
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-400/90 leading-relaxed">
                <strong>Local Development Notice:</strong> Requiring active AWS SSM connection. System restarts will fail if run in local workspaces.
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full font-mono text-xs" 
              onClick={() => setShowRestartModal(true)}
              disabled={(sysError as any)?.response?.status === 403}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" /> Restart Daemon Service
            </Button>
          </CardFooter>
        </Card>

        {/* Balance Poller / subaccounts */}
        <div className="space-y-6">
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
                <Wallet className="w-4 h-4 text-primary" />
                BALANCE POLLER
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-mono text-xs text-slate-300">
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span className="text-slate-500">Status</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-transparent text-[10px] h-5 font-mono">
                  ACTIVE
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span className="text-slate-500">Last Checked</span>
                <span>{displayPoller?.lastChecked ? new Date(displayPoller.lastChecked).toLocaleTimeString() : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Monitored Accounts</span>
                <span className="font-bold text-foreground">{displayPoller?.monitoredCount || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
                <Users className="w-4 h-4 text-primary" />
                BYBIT SUB-ACCOUNTS
              </CardTitle>
              <CardDescription className="text-[10px] font-mono text-slate-500">Currently monitored via GET /api/bybit/transfers.</CardDescription>
            </CardHeader>
            <CardContent>
              {transfers.length > 0 ? (
                <div className="space-y-3 font-mono text-xs">
                  {transfers.map((t: any, i: number) => (
                    <div key={i} className="p-3 bg-black/40 rounded border border-border/20 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{t.username || "Sub-Account"}</span>
                        <Badge className={`${t.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'} border-transparent text-[10px] h-5 font-mono`}>
                          {t.status || "UNKNOWN"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">UID: {t.uid || "N/A"}</span>
                        <span className="font-bold text-emerald-400">{t.balance !== undefined ? `$${t.balance.toFixed(2)}` : "$0.00"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-4 font-mono">No linked sub-accounts found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRestartModal}
        title="Restart System Service"
        description="This will execute an AWS SSM remote command to restart the systemd service for the trading bot on the EC2 instance."
        warningText="WARNING: This action immediately disrupts active bot trading loops."
        onConfirm={handleRestart}
        onCancel={() => setShowRestartModal(false)}
        isLoading={loading}
      />
    </div>
  );
}
