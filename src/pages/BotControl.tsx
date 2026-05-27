import { useState, useEffect } from "react";
import { useBotStatus } from "../hooks/useBotStatus";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Play, Pause, Settings2, HeartPulse, AlertTriangle, FastForward } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

export function BotControl() {
  const queryClient = useQueryClient();
  const { data: status } = useBotStatus();
  const [personality, setPersonality] = useState("balanced");
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: "deposit" | "pause" | "resume" | null;
    title: string;
    description: string;
    warningText?: string;
  }>({
    isOpen: false,
    type: null,
    title: "",
    description: "",
  });

  useEffect(() => {
    if (status?.personality) {
      setPersonality(status.personality);
    }
  }, [status]);

  // Mutations
  const actionMutation = useMutation({
    mutationFn: (action: "pause" | "resume") => api.post(`/api/bot/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    },
  });

  const personalityMutation = useMutation({
    mutationFn: (val: string) => api.post("/api/bot/select", { personality: val }),
    onSuccess: (_, val) => {
      setPersonality(val);
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
    },
  });

  const simulateMutation = useMutation({
    mutationFn: () => api.post("/api/bot/dev/simulate-deposit", { amount: 1000 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot-status"] });
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    },
  });

  const handleActionClick = (action: "pause" | "resume") => {
    setConfirmState({
      isOpen: true,
      type: action,
      title: action === "pause" ? "Pause Trading Bot" : "Resume Trading Bot",
      description: action === "pause" 
        ? "This will halt signal execution and grid placement loop."
        : "This will start scanning signals and resuming orders.",
      warningText: action === "pause" ? "Active grids will be left unattended until resumed." : undefined
    });
  };

  const handleSimulateClick = () => {
    setConfirmState({
      isOpen: true,
      type: "deposit",
      title: "Simulate Deposit Webhook",
      description: "Triggering this mock deposit webhook will instruct the backend to spawn the Python engine processes.",
      warningText: "This action is only intended for development mode. Use caution."
    });
  };

  const handleConfirmAction = () => {
    if (confirmState.type === "pause") {
      actionMutation.mutate("pause");
    } else if (confirmState.type === "resume") {
      actionMutation.mutate("resume");
    } else if (confirmState.type === "deposit") {
      simulateMutation.mutate();
    }
  };

  const handleSelectPersonality = (val: string) => {
    personalityMutation.mutate(val);
  };

  const loading = actionMutation.isPending || personalityMutation.isPending || simulateMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-sans">Bot Control</h1>
        <p className="text-muted-foreground mt-1 font-mono text-xs">Manage system status and trade policies.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pulse State */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <HeartPulse className="w-4 h-4 text-primary animate-pulse" />
              ENGINE PULSE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-xs text-slate-300">
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-foreground capitalize">{status?.status || "stalled"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Personality</span>
              <span className="font-bold text-foreground capitalize">{status?.personality || "balanced"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Bybit Sub-Account</span>
              <span className="font-bold text-foreground">{status?.bybitAccount?.uid || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Sub-Account Balance</span>
              <span className="font-bold text-emerald-400">{status?.bybitAccount?.balance !== undefined ? `$${status.bybitAccount.balance.toFixed(2)}` : "$0.00"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-slate-500">Heartbeat</span>
              <span>{status?.lastHeartbeat || status?.heartbeat ? new Date(status.lastHeartbeat || status.heartbeat).toLocaleTimeString() : "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Live ROI</span>
              <span className="font-bold text-emerald-400">{status?.live_roi ? `+${status.live_roi.toFixed(2)}%` : "0.00%"}</span>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3 pt-2">
            <Button 
              variant={status?.status === "paused" ? "default" : "outline"}
              className="flex-1 font-mono text-xs"
              onClick={() => handleActionClick("resume")}
              disabled={loading || status?.status === "running"}
            >
              <Play className="w-3.5 h-3.5 mr-2" /> Resume
            </Button>
            <Button 
              variant={status?.status === "running" ? "destructive" : "outline"}
              className="flex-1 font-mono text-xs"
              onClick={() => handleActionClick("pause")}
              disabled={loading || status?.status !== "running"}
            >
              <Pause className="w-3.5 h-3.5 mr-2" /> Pause
            </Button>
          </CardFooter>
        </Card>

        {/* Personality Config */}
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
              <Settings2 className="w-4 h-4 text-primary" />
              POLICY PROFILE
            </CardTitle>
            <CardDescription className="text-[10px] font-mono text-slate-500">Select active bot strategy profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 font-mono text-xs">
              {(["conservative", "balanced", "aggressive"] as const).map((p) => (
                <Button
                  key={p}
                  variant={personality === p ? "default" : "outline"}
                  className="justify-start capitalize font-mono text-xs"
                  onClick={() => handleSelectPersonality(p)}
                  disabled={loading}
                >
                  {p}
                  {personality === p && <span className="ml-auto text-[10px] text-primary">Active</span>}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Developer Override */}
        <Card className="bg-card/30 border-destructive/20 shadow-[0_0_20px_rgba(var(--destructive),0.05)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive font-mono text-xs tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              OVERRIDE TOOLS
            </CardTitle>
            <CardDescription className="text-[10px] font-mono text-slate-500">Spawning mechanisms and testing helpers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 font-mono text-xs border-destructive/30"
              onClick={handleSimulateClick}
              disabled={loading}
            >
              <FastForward className="w-3.5 h-3.5 mr-2" /> Simulate Deposit
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        warningText={confirmState.warningText}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        isLoading={loading}
      />
    </div>
  );
}
