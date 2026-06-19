import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../Services/http.service";
import { BybitAccountType } from "../Enums/BybitAccountType.enum";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import {
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  Wallet,
  Coins,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { cn } from "../Helpers/utils";

export function AdminTransferCoin() {
  // Form State
  const [coin, setCoin] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [targetSubUid, setTargetSubUid] = useState("");
  const [fromAccountType, setFromAccountType] = useState<BybitAccountType>(BybitAccountType.FUND);
  const [toAccountType, setToAccountType] = useState<BybitAccountType>(BybitAccountType.UNIFIED);

  // Status message state
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
    details?: string;
  }>({ type: null, text: "" });

  // Fetch balances query
  const { data: balanceData, isLoading: isBalanceLoading, isRefetching, refetch } = useQuery({
    queryKey: ["bybit-master-balance"],
    queryFn: () =>
      api.get("/api/bybit/master-balance")
        .then((r) => r.data)
        .catch((err) => {
          console.error("Failed to load balances", err);
          throw err;
        }),
  });

  // Universal transfer mutation
  const transferMutation = useMutation({
    mutationFn: (payload: {
      coin: string;
      amount: string;
      targetSubUid: number;
      fromAccountType: BybitAccountType;
      toAccountType: BybitAccountType;
    }) => api.post("/api/bybit/transfers/sub-account", payload).then((r) => r.data),
    onSuccess: (data) => {
      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Transfer successful!`,
          details: `Transfer ID: ${data.transferId}${data.status ? ` (Status: ${data.status})` : ""}`,
        });
        // Clear amount and UID on success
        setAmount("");
        setTargetSubUid("");
        // Refresh balances
        refetch();
      } else {
        setStatusMessage({
          type: "error",
          text: data.message || "Bybit universal transfer failed.",
          details: data.bybitCode !== undefined ? `Error code: ${data.bybitCode} - ${data.bybitMessage || ""}` : undefined,
        });
      }
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || error?.message || "An error occurred during transfer.";
      const errDetail = error?.response?.data?.error || undefined;
      setStatusMessage({
        type: "error",
        text: errMsg,
        details: typeof errDetail === "string" ? errDetail : undefined,
      });
    },
  });

  // Helpers to parse USDT balances safely
  const getUSDTFromFunding = (fundingList: any) => {
    if (!Array.isArray(fundingList)) return "0.00";
    const item = fundingList.find((c: any) => c.coin === "USDT" || c.coin === "usdt");
    if (!item) return "0.00";
    return parseFloat(item.walletBalance || item.transferBalance || "0").toFixed(2);
  };

  const getUSDTFromUnified = (unifiedData: any) => {
    if (!unifiedData) return "0.00";
    if (Array.isArray(unifiedData)) {
      const item = unifiedData.find((c: any) => c.coin === "USDT" || c.coin === "usdt");
      if (!item) return "0.00";
      return parseFloat(item.walletBalance || item.transferBalance || "0").toFixed(2);
    }
    // Main main account or single object case
    if (unifiedData.coin && Array.isArray(unifiedData.coin)) {
      const item = unifiedData.coin.find((c: any) => c.coin === "USDT" || c.coin === "usdt");
      if (!item) return "0.00";
      return parseFloat(item.walletBalance || item.transferBalance || "0").toFixed(2);
    }
    return "0.00";
  };

  const masterSubUid = balanceData?.masterSub?.uid || "Not configured";
  const fundingUSDT = getUSDTFromFunding(balanceData?.masterSub?.funding);
  const unifiedUSDT = getUSDTFromUnified(balanceData?.masterSub?.unified);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage({ type: null, text: "" });

    // Validations
    if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid positive transfer amount.",
      });
      return;
    }

    if (!targetSubUid || isNaN(Number(targetSubUid)) || parseInt(targetSubUid, 10) <= 0) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid numeric target sub-account UID.",
      });
      return;
    }

    transferMutation.mutate({
      coin: coin.trim().toUpperCase(),
      amount: amount.trim(),
      targetSubUid: parseInt(targetSubUid.trim(), 10),
      fromAccountType,
      toAccountType,
    });
  };

  const swapAccountTypes = () => {
    setFromAccountType(toAccountType);
    setToAccountType(fromAccountType);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Transfer Coin</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Universal wallet sweeps from Master sub-account to target user sub-accounts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isBalanceLoading || isRefetching}
          className="gap-2 font-mono text-xs font-bold shadow-sm shrink-0"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefetching || (isBalanceLoading && balanceData) ? "animate-spin" : "")} />
          Refresh Master Balance
        </Button>
      </div>

      {/* Master Sub Balance Card */}
      <Card className="bg-gradient-to-br from-card to-card/65 border-border/40 backdrop-blur-sm overflow-hidden relative shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        <CardHeader className="pb-3 border-b border-border/25">
          <CardTitle className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2 font-bold">
            <Coins className="w-4 h-4 text-primary" /> Master Sweeper Configuration
          </CardTitle>
          <CardDescription className="font-mono text-[10px] text-muted-foreground/60 mt-0.5">
            UID Link: <span className="text-foreground font-bold">{masterSubUid}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {isBalanceLoading && !balanceData ? (
            <div className="grid grid-cols-2 gap-4 py-2 animate-pulse">
              <div className="h-16 bg-muted/40 rounded-xl" />
              <div className="h-16 bg-muted/40 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-muted/20 border border-border/30 rounded-xl p-4 relative group hover:border-primary/20 transition-all duration-300">
                <span className="text-[9px] uppercase text-muted-foreground/60 block font-bold tracking-wider">Funding Wallet (USDT)</span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-2xl font-bold font-sans text-foreground">${Number(fundingUSDT).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] text-primary font-bold">USDT</span>
                </div>
                <Wallet className="absolute right-4 bottom-4 w-7 h-7 text-primary opacity-[0.03] group-hover:opacity-[0.07] transition-all" />
              </div>

              <div className="bg-muted/20 border border-border/30 rounded-xl p-4 relative group hover:border-cyan-500/20 transition-all duration-300">
                <span className="text-[9px] uppercase text-muted-foreground/60 block font-bold tracking-wider">Unified Wallet (USDT)</span>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-2xl font-bold font-sans text-cyan-400">${Number(unifiedUSDT).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] text-cyan-400 font-bold">USDT</span>
                </div>
                <TrendingUp className="absolute right-4 bottom-4 w-7 h-7 text-cyan-400 opacity-[0.03] group-hover:opacity-[0.07] transition-all" />
              </div>
            </div>
          )}
          <div className="text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1.5 pt-1.5">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Universal sweeps trigger instant wallet transfers across Bybit UID systems.</span>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Form Section */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3 border-b border-border/20">
          <CardTitle className="font-mono text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2 font-bold">
            <ArrowLeftRight className="w-4 h-4 text-primary" /> INITIATE SWEEP ROUTING
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
            Sweep target balances directly from configured master accounts to user keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleTransferSubmit} className="space-y-6 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coin Input */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground/75 font-bold text-[10px] uppercase block tracking-widest">Coin Symbol</label>
                <Input
                  type="text"
                  placeholder="USDT"
                  value={coin}
                  onChange={(e) => setCoin(e.target.value)}
                  className="font-mono uppercase bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground"
                  required
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground/75 font-bold text-[10px] uppercase block tracking-widest">Sweep Quantity</label>
                <Input
                  type="text"
                  placeholder="e.g. 25.50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground"
                  required
                />
              </div>

              {/* Target Subaccount UID */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground/75 font-bold text-[10px] uppercase block tracking-widest">Recipient Sub UID</label>
                <Input
                  type="text"
                  placeholder="e.g. 987654321"
                  value={targetSubUid}
                  onChange={(e) => setTargetSubUid(e.target.value)}
                  className="font-mono bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground"
                  required
                />
              </div>
            </div>

            {/* Account Types Direction Panel */}
            <div className="bg-muted/20 border border-border/30 rounded-xl p-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4">
                {/* From Account */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-muted-foreground/75 font-bold text-[10px] uppercase tracking-widest block">Source Account Ledger</label>
                  <select
                    value={fromAccountType}
                    onChange={(e) => setFromAccountType(e.target.value as BybitAccountType)}
                    className="w-full h-9.5 px-3 rounded-lg border border-border/30 bg-muted/30 text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs cursor-pointer"
                  >
                    {Object.values(BybitAccountType).map((type) => (
                      <option key={type} value={type} className="bg-slate-900 text-slate-200">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap / Direction Arrow */}
                <div className="md:col-span-1 flex justify-center pt-3 md:pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={swapAccountTypes}
                    className="h-9 w-9 p-0 rounded-full hover:bg-primary/20 hover:text-primary transition-all duration-300 active:scale-95 cursor-pointer"
                    title="Swap direction"
                  >
                    <ArrowLeftRight className="w-4 h-4 rotate-90 md:rotate-0" />
                  </Button>
                </div>

                {/* To Account */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-muted-foreground/75 font-bold text-[10px] uppercase tracking-widest block">Target Account Ledger</label>
                  <select
                    value={toAccountType}
                    onChange={(e) => setToAccountType(e.target.value as BybitAccountType)}
                    className="w-full h-9.5 px-3 rounded-lg border border-border/30 bg-muted/30 text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs cursor-pointer"
                  >
                    {Object.values(BybitAccountType).map((type) => (
                      <option key={type} value={type} className="bg-slate-900 text-slate-200">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Transfer Summary confirmation note */}
            {amount && targetSubUid && !isNaN(Number(amount)) && !isNaN(Number(targetSubUid)) && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-[11px] font-mono text-muted-foreground flex items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground">Sweep review:</span>
                  <span>Sweeping</span>
                  <span className="font-bold text-primary">{parseFloat(amount).toFixed(2)} {coin.toUpperCase()}</span>
                  <span>from Master {fromAccountType}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary inline" />
                  <span>Sub-Account UID <strong className="text-foreground">{targetSubUid}</strong> ({toAccountType})</span>
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={transferMutation.isPending}
                className="w-full md:w-auto bg-primary text-primary-foreground font-bold px-6 h-9.5 cursor-pointer shadow-sm"
              >
                {transferMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Executing Sweep...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Execute Sweep
                  </>
                )}
              </Button>
            </div>

            {/* Status Feedback Banners */}
            {statusMessage.type && (
              <div
                className={cn(
                  "flex gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-300",
                  statusMessage.type === "success"
                    ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-350"
                    : "bg-rose-500/5 border-rose-500/25 text-rose-350"
                )}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-foreground">{statusMessage.text}</h4>
                  {statusMessage.details && (
                    <p className="mt-1 text-[10px] text-muted-foreground/80 font-mono break-all leading-normal">
                      {statusMessage.details}
                    </p>
                  )}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
