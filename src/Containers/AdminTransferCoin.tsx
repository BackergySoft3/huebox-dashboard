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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transfer Coin</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Universal wallet transfers from Master Sub-Account to client sub-accounts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isBalanceLoading || isRefetching}
          className="gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching || (isBalanceLoading && balanceData) ? "animate-spin" : ""}`} />
          Refresh Balances
        </Button>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Master Sub Balance Card */}
        <Card className="bg-gradient-to-br from-card/40 to-indigo-950/10 border-border/40 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs tracking-wider text-primary flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" /> CONFIG MASTER SUB-ACCOUNT
            </CardTitle>
            <CardDescription className="font-mono text-[10px] text-muted-foreground/80">
              UID: <span className="text-foreground font-bold">{masterSubUid}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {isBalanceLoading && !balanceData ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="h-12 bg-muted/40 rounded-lg" />
                <div className="h-12 bg-muted/40 rounded-lg" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/40 border border-border/30 rounded-lg p-4 relative group hover:border-primary/20 transition-all duration-300">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground/60 block">Funding USDT</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-2xl font-mono font-bold text-foreground">{fundingUSDT}</span>
                    <span className="text-[10px] font-mono text-primary font-medium">USDT</span>
                  </div>
                  <Wallet className="absolute right-3 bottom-3 w-8 h-8 text-primary opacity-[0.04] group-hover:opacity-[0.08] transition-all" />
                </div>

                <div className="bg-background/40 border border-border/30 rounded-lg p-4 relative group hover:border-cyan-500/20 transition-all duration-300">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground/60 block">Unified USDT</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-2xl font-mono font-bold text-cyan-400">{unifiedUSDT}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-medium">USDT</span>
                  </div>
                  <TrendingUp className="absolute right-3 bottom-3 w-8 h-8 text-cyan-400 opacity-[0.04] group-hover:opacity-[0.08] transition-all" />
                </div>
              </div>
            )}
            <div className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-1.5 pt-1">
              <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Universal transfers will pull balance from the configured Master Sub-account.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Form Section */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-mono text-xs tracking-wider text-slate-200 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" /> INITIATE UNIVERSAL SUB-ACCOUNT TRANSFER
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Executes a universal transfer from the Master Sub-account to the target sub-account UID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransferSubmit} className="space-y-6 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coin Input */}
              <div className="space-y-2">
                <label className="text-slate-300 font-medium block">Coin Symbol</label>
                <Input
                  type="text"
                  placeholder="USDT"
                  value={coin}
                  onChange={(e) => setCoin(e.target.value)}
                  className="font-mono uppercase bg-background/50 border-border/40 focus:border-primary"
                  required
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-slate-300 font-medium block">Amount</label>
                <Input
                  type="text"
                  placeholder="e.g. 25.5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono bg-background/50 border-border/40 focus:border-primary"
                  required
                />
              </div>

              {/* Target Subaccount UID */}
              <div className="space-y-2">
                <label className="text-slate-300 font-medium block">Target Sub-account UID</label>
                <Input
                  type="text"
                  placeholder="e.g. 987654321"
                  value={targetSubUid}
                  onChange={(e) => setTargetSubUid(e.target.value)}
                  className="font-mono bg-background/50 border-border/40 focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Account Types Direction Panel */}
            <div className="bg-background/20 border border-border/30 rounded-xl p-6 relative">
              <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4">
                {/* From Account */}
                <div className="md:col-span-3 space-y-2">
                  <label className="text-slate-300 font-medium block">From Account Type</label>
                  <select
                    value={fromAccountType}
                    onChange={(e) => setFromAccountType(e.target.value as BybitAccountType)}
                    className="w-full h-10 px-3 rounded-md border border-border/40 bg-background/60 text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                  >
                    {Object.values(BybitAccountType).map((type) => (
                      <option key={type} value={type} className="bg-slate-900 text-slate-200">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap / Direction Arrow */}
                <div className="md:col-span-1 flex justify-center pt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={swapAccountTypes}
                    className="h-10 w-10 p-0 rounded-full hover:bg-primary/20 hover:text-primary transition-all duration-300 active:scale-95"
                    title="Swap direction"
                  >
                    <ArrowLeftRight className="w-4 h-4 rotate-90 md:rotate-0" />
                  </Button>
                </div>

                {/* To Account */}
                <div className="md:col-span-3 space-y-2">
                  <label className="text-slate-300 font-medium block">To Account Type</label>
                  <select
                    value={toAccountType}
                    onChange={(e) => setToAccountType(e.target.value as BybitAccountType)}
                    className="w-full h-10 px-3 rounded-md border border-border/40 bg-background/60 text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
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

            {/* Transfer Summary */}
            {amount && targetSubUid && !isNaN(Number(amount)) && !isNaN(Number(targetSubUid)) && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-[11px] font-mono text-slate-300 flex items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Summary:</span>
                  <span>Transferring</span>
                  <span className="font-bold text-primary">{parseFloat(amount).toFixed(2)} {coin.toUpperCase()}</span>
                  <span>from Master Sub <strong className="text-slate-200">{fromAccountType}</strong></span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary inline" />
                  <span>Sub-Account <strong className="text-slate-200">{targetSubUid}</strong> <strong className="text-slate-200">{toAccountType}</strong></span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={transferMutation.isPending}
                className="w-full md:w-auto bg-primary text-primary-foreground font-semibold px-6"
              >
                {transferMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Executing Transfer...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Transfer Coin
                  </>
                )}
              </Button>
            </div>

            {/* Status Feedback Banners */}
            {statusMessage.type && (
              <div
                className={`flex gap-3 p-4 rounded-lg border animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-300"
                    : "bg-red-500/5 border-red-500/25 text-red-300"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold">{statusMessage.text}</h4>
                  {statusMessage.details && (
                    <p className="mt-1 text-[10px] text-muted-foreground/90 font-mono break-all">
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
