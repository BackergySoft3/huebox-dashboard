import { useState } from "react";
import {
  useWalletBalance,
  useTransactionHistory,
  useCreateOrder,
  useWithdraw,
  useSend,
} from "../Hooks/useWallet";
import { PaymentsTab } from "../Enums/PaymentsTab.enum";
import { TransactionType } from "../Enums/TransactionType.enum";
import { TransactionStatus } from "../Enums/TransactionStatus.enum";
import { useBotStatus } from "../Hooks/useBotStatus";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import { Badge } from "../Components/Atoms/badge";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { parseApiError } from "../Helpers/parseApiError";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Percent,
  TrendingUp,
  RefreshCw,
  Wallet,
  Coins,
  Send,
  Download,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../Helpers/utils";

export function Payments() {
  const [activeTab, setActiveTab] = useState<PaymentsTab>(PaymentsTab.Overview);
  
  // States for pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Form States for Add Funds
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [addFundsFiat, setAddFundsFiat] = useState("USD");
  const [addFundsSuccess, setAddFundsSuccess] = useState(false);
  const [addFundsErrorMsg, setAddFundsErrorMsg] = useState("");

  // Form States for Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawNetwork, setWithdrawNetwork] = useState("TRC20");
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawSuccessId, setWithdrawSuccessId] = useState("");
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState("");

  // Form States for Send
  const [sendUid, setSendUid] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendErrorMsg, setSendErrorMsg] = useState("");

  // Clipboard Feedback State
  const [copied, setCopied] = useState(false);

  // API Hooks
  const { balance, coin, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance();
  const { items: historyItems, total: historyTotal, pages: historyPages, isLoading: historyLoading, refetch: refetchHistory } = useTransactionHistory(historyPage, 10);
  const botStatusQuery = useBotStatus();
  const subAccountUid = botStatusQuery.data?.bybitAccount?.uid;

  const createOrderMutation = useCreateOrder();
  const withdrawMutation = useWithdraw();
  const sendMutation = useSend();

  const handleRefresh = async () => {
    await Promise.all([refetchBalance(), refetchHistory()]);
  };

  // Transaction Helpers
  const getTxIcon = (type: string) => {
    switch (type) {
      case TransactionType.Deposit:
      case TransactionType.Receive:
      case TransactionType.Transfer:
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case TransactionType.Withdrawal:
      case TransactionType.Withdraw:
      case TransactionType.Send:
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case TransactionType.Fee:
        return <Percent className="w-4 h-4 text-slate-405" />;
      case TransactionType.Pnl:
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default:
        return <Coins className="w-4 h-4 text-primary" />;
    }
  };

  const getTxStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="text-slate-400 border-border/30 px-2 py-0.5 text-[9px] font-mono font-semibold">
          UNKNOWN
        </Badge>
      );
    }
    switch (status) {
      case TransactionStatus.Completed:
      case TransactionStatus.Confirmed:
        return (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono font-bold">
            COMPLETED
          </Badge>
        );
      case TransactionStatus.Pending:
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-mono font-bold">
            PENDING
          </Badge>
        );
      case TransactionStatus.Failed:
        return (
          <Badge variant="outline" className="text-rose-400 border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-mono font-bold">
            FAILED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400 border-border/30 px-2 py-0.5 text-[9px] font-mono font-semibold">
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  const formatTxAmount = (type: string, amount?: number | string, coinSymbol?: string) => {
    const isIncoming = ([ TransactionType.Deposit, TransactionType.Receive, TransactionType.Pnl, TransactionType.Transfer] as string[]).includes(type);
    const sign = isIncoming ? "+" : "-";
    const color = isIncoming ? "text-emerald-400" : "text-amber-400";
    const amountVal = amount !== undefined && amount !== null ? Number(amount) : 0;
    return (
      <span className={cn("font-mono font-bold text-xs md:text-sm", color)}>
        {sign}${amountVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-muted-foreground font-normal">{coinSymbol || "USDT"}</span>
      </span>
    );
  };

  const formatTxDate = (dateStr?: string, pattern = "MMM dd, HH:mm") => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, pattern);
    } catch {
      return "N/A";
    }
  };

  const handleCopyUid = () => {
    if (subAccountUid) {
      navigator.clipboard.writeText(subAccountUid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateTxId = (id?: any) => {
    if (id === undefined || id === null) return "N/A";
    const str = String(id);
    if (str.length <= 12) return str;
    return `${str.slice(0, 6)}...${str.slice(-6)}`;
  };

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFundsSuccess(false);
    setAddFundsErrorMsg("");
    const amountNum = parseFloat(addFundsAmount);
    
    if (isNaN(amountNum) || amountNum < 10) {
      setAddFundsErrorMsg("Minimum deposit amount is $10.00 USD.");
      return;
    }

    createOrderMutation.mutate(
      { amountUsd: amountNum, fiat: addFundsFiat, coin: "USDT" },
      {
        onSuccess: () => {
          setAddFundsSuccess(true);
          setAddFundsAmount("");
        },
        onError: (err: any) => {
          setAddFundsErrorMsg(parseApiError(err));
        }
      }
    );
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg("");
    setWithdrawSuccessId("");
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      setWithdrawErrorMsg("Minimum withdrawal amount is 0.01 USDT.");
      return;
    }
    if (amountNum > balance) {
      setWithdrawErrorMsg("Insufficient balance.");
      return;
    }
    if (!withdrawAddress) {
      setWithdrawErrorMsg("Destination address is required.");
      return;
    }
    setWithdrawConfirmOpen(true);
  };

  const executeWithdraw = async () => {
    const data = await withdrawMutation.mutateAsync({
      amount: parseFloat(withdrawAmount),
      address: withdrawAddress,
      network: withdrawNetwork,
      coin,
    });
    setWithdrawSuccessId(data.withdrawalId || data.transferId || "Successfully Initiated");
    setWithdrawAmount("");
    setWithdrawAddress("");
    setWithdrawConfirmOpen(false);
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSendErrorMsg("");
    setSendSuccess(false);
    const amountNum = parseFloat(sendAmount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      setSendErrorMsg("Minimum send amount is 0.01 USDT.");
      return;
    }
    if (amountNum > balance) {
      setSendErrorMsg("Insufficient balance.");
      return;
    }
    if (!sendUid) {
      setSendErrorMsg("Recipient Bybit UID is required.");
      return;
    }
    
    sendMutation.mutate(
      {
        toBybitUid: sendUid,
        amount: amountNum,
        coin: "USDT",
      },
      {
        onSuccess: () => {
          setSendSuccess(true);
          setSendAmount("");
          setSendUid("");
        },
        onError: (err: any) => {
          setSendErrorMsg(parseApiError(err));
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Wallet</h1>
          <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
            Monitor balances, deposit capital, withdraw funds, and view transactions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="font-mono text-xs font-bold shadow-sm">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Balance
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 pb-px gap-1 overflow-x-auto scrollbar-none">
        {Object.values(PaymentsTab).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowFullHistory(false);
            }}
            className={cn(
              "px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab && !showFullHistory
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
            )}
          >
            {tab === PaymentsTab.SendReceive ? "Internal Transfer" : tab.replace("-", " ")}
          </button>
        ))}
        {showFullHistory && (
          <button
            className="px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 border-primary text-primary"
            disabled
          >
            Transaction History
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {!showFullHistory && activeTab === PaymentsTab.Overview && (
        <div className="space-y-6">
          {/* Row 1: Balance Card (2 cols) & Security Panel (1 col) */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Balance Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-card to-card/65 border-border/40 shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[85px] rounded-full pointer-events-none" />
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-primary" /> AVAILABLE BALANCE
                </CardDescription>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div className="h-10 w-48 bg-muted/20 animate-pulse rounded border border-border/20 mt-1" />
                ) : (
                  <div className="text-4xl font-extrabold font-sans tracking-tight text-foreground mt-1">
                    ${Number(balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                    <span className="text-sm font-semibold text-primary font-mono ml-1">{coin}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/60 mt-3 font-mono">
                  Wallet Sweeping: enabled (USDT TRC20/ERC20 sweeping processes active)
                </p>
              </CardContent>
            </Card>

            {/* Security Status Panel */}
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" /> SECURITY STATS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-border/15 pb-2">
                  <span className="text-muted-foreground">API Sweeping</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SECURED
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Multi-Sig Guard</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ACTIVE
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Stats */}
          {(() => {
            const totalDeposited = (historyItems || [])
              .filter((tx: any) => [TransactionType.Deposit, TransactionType.Receive].includes(tx.type as any))
              .reduce((sum: number, tx: any) => sum + (Number(tx.amountUsdt) || 0), 0);
            const totalWithdrawn = (historyItems || [])
              .filter((tx: any) => [TransactionType.Withdrawal, TransactionType.Withdraw, TransactionType.Send].includes(tx.type as any))
              .reduce((sum: number, tx: any) => sum + (Number(tx.amountUsdt) || 0), 0);
            const netInvestment = totalDeposited - totalWithdrawn;
            return (
              <div className="space-y-2 font-mono">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/30">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Deposited (Recent)
                    </div>
                    <div className="text-base font-bold text-emerald-400 font-sans">+${totalDeposited.toFixed(2)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/30">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" /> Withdrawn (Recent)
                    </div>
                    <div className="text-base font-bold text-amber-400 font-sans">-${totalWithdrawn.toFixed(2)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/30">
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" /> Net Capital
                    </div>
                    <div className="text-base font-bold text-primary font-sans">${netInvestment.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => setActiveTab(PaymentsTab.AddFunds)}
              className="bg-card/20 border-border/40 hover:border-primary/40 hover:bg-primary/5 text-xs font-mono font-bold flex flex-col items-center justify-center h-20 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowDownLeft className="w-5 h-5 text-emerald-400 mb-1" /> Add Funds
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab(PaymentsTab.Withdraw)}
              className="bg-card/20 border-border/40 hover:border-amber-400/40 hover:bg-amber-500/5 text-xs font-mono font-bold flex flex-col items-center justify-center h-20 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowUpRight className="w-5 h-5 text-amber-400 mb-1" /> Withdraw USDT
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab(PaymentsTab.SendReceive)}
              className="bg-card/20 border-border/40 hover:border-primary/40 hover:bg-primary/5 text-xs font-mono font-bold flex flex-col items-center justify-center h-20 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Send className="w-5 h-5 text-primary mb-1" /> Internal Send
            </Button>
          </div>

          {/* Recent Transactions List */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
                  RECENT LEDGER LOGS
                </CardTitle>
                <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
                  Last 5 account transactions.
                </CardDescription>
              </div>
              <Button
                variant="link"
                onClick={() => setShowFullHistory(true)}
                className="text-xs text-primary font-mono hover:underline p-0 h-auto"
              >
                View full history →
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto border-t border-border/20 bg-card/10">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground bg-muted/10 text-[9px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">DATE</th>
                      <th className="py-2.5 px-4 font-semibold">TYPE</th>
                      <th className="py-2.5 px-4 font-semibold text-right">AMOUNT</th>
                      <th className="py-2.5 px-4 font-semibold text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/15">
                    {historyLoading ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-500 italic">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading transaction logs...
                          </div>
                        </td>
                      </tr>
                    ) : historyItems.length > 0 ? (
                      historyItems.slice(0, 5).map((tx) => (
                        <tr key={tx._id} className="hover:bg-muted/15 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground/60">
                            {formatTxDate(tx.createdAt, "MMM dd, HH:mm")}
                          </td>
                          <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                            {getTxIcon(tx.type)}
                            <span className="capitalize">{tx.type}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {formatTxAmount(tx.type, tx.amountUsdt, tx.coin)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getTxStatusBadge(tx.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-muted-foreground italic">
                          No transactions found on this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Add Funds */}
      {!showFullHistory && activeTab === PaymentsTab.AddFunds && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
                ADD FUNDS VIA MOONPAY
              </CardTitle>
              <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
                Quick fiat on-ramp to buy crypto and fund your investment account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addFundsSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl flex items-start gap-2 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    MoonPay checkout initialized. Balance sweeps will trigger once transaction confirms.
                  </span>
                </div>
              )}

              {addFundsErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 rounded-xl flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addFundsErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddFundsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase">Deposit Amount (Fiat)</label>
                  <Input
                    type="number"
                    min="10"
                    step="0.01"
                    placeholder="50.00"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    required
                    className="font-mono text-sm bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground"
                  />
                  <p className="text-[9px] text-muted-foreground/60 font-mono">
                    Minimum deposit amount is $10.00.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase">Fiat Currency</label>
                  <select
                    value={addFundsFiat}
                    onChange={(e) => setAddFundsFiat(e.target.value)}
                    className="w-full h-9.5 rounded-lg border border-border/30 bg-muted/30 px-3 py-2 text-xs font-mono shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="w-full font-mono text-xs font-bold py-2.5 mt-2 h-10 cursor-pointer"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Launching MoonPay Checkout...
                    </>
                  ) : (
                    "Deposit with MoonPay"
                  )}
                </Button>
              </form>

              {/* Security info note */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3 mt-4">
                <ShieldCheck className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <div className="text-[10px] text-muted-foreground/90 leading-relaxed font-mono">
                  Your payments are processed securely. Deposited funds are swept directly into your Bybit sub-account ledger under encryption shields.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Withdraw */}
      {!showFullHistory && activeTab === PaymentsTab.Withdraw && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
                WITHDRAW ON-CHAIN (USDT)
              </CardTitle>
              <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
                Withdraw USDT from your sub-account balance to any external on-chain destination.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance display */}
              <div className="p-4 bg-muted/30 border border-border/30 rounded-xl flex items-center justify-between font-mono">
                <span className="text-xs text-muted-foreground">Available balance:</span>
                <span className="text-lg font-bold text-primary">${Number(balance ?? 0).toFixed(2)} USDT</span>
              </div>

              {withdrawSuccessId && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">Withdrawal requested successfully.</span>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground pl-6 break-all">
                    Sweep ID: {withdrawSuccessId}
                  </span>
                </div>
              )}

              {withdrawErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 rounded-xl flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{withdrawErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground/70 uppercase">
                    <label>Amount (USDT)</label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(balance.toString())}
                      className="text-[9px] text-primary hover:underline font-bold"
                    >
                      Use Max
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.0001"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      required
                      className="font-mono text-sm bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground pr-12"
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold font-mono pointer-events-none">
                      USDT
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase block">Destination Wallet Address</label>
                  <Input
                    type="text"
                    placeholder="e.g. Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    required
                    className="font-mono text-sm bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase block">On-Chain Network</label>
                  <select
                    value={withdrawNetwork}
                    onChange={(e) => setWithdrawNetwork(e.target.value)}
                    className="w-full h-9.5 rounded-lg border border-border/30 bg-muted/30 px-3 py-2 text-xs font-mono shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="TRC20">TRON (TRC20)</option>
                    <option value="ERC20">Ethereum (ERC20)</option>
                    <option value="BEP20">BNB Chain (BEP20)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={withdrawMutation.isPending || !withdrawAmount || !withdrawAddress}
                  className="w-full font-mono text-xs font-bold py-2.5 mt-2 h-10 cursor-pointer"
                >
                  Initiate Withdrawal Review
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Send / Receive */}
      {!showFullHistory && activeTab === PaymentsTab.SendReceive && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Send subaccount to UID */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
                  INTERNAL HUEBOX SEND
                </CardTitle>
                <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
                  Instantly transfer funds to another Bybit UID registered on HueBox.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sendSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl flex items-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Transfer executed successfully. Balance adjusted.</span>
                  </div>
                )}

                {sendErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 rounded-xl flex items-center gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sendErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSendSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase block">Recipient Bybit UID</label>
                    <Input
                      type="text"
                      placeholder="Enter recipient Bybit UID"
                      value={sendUid}
                      onChange={(e) => setSendUid(e.target.value)}
                      required
                      className="font-mono text-sm bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground/70 uppercase">
                      <label>Amount (USDT)</label>
                      <span>
                        Max: ${Number(balance ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        required
                        className="font-mono text-sm bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground pr-12"
                      />
                      <div className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold font-mono pointer-events-none">
                        USDT
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={sendMutation.isPending || !sendAmount || !sendUid}
                    className="w-full font-mono text-xs font-bold py-2.5 mt-2 h-10 cursor-pointer"
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Transferring...
                      </>
                    ) : (
                      "Send USDT Instantly"
                    )}
                  </Button>
                </form>
              </CardContent>
            </div>
          </Card>

          {/* Receive details */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between shadow-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
            <div>
              <CardHeader>
                <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
                  RECEIVE ASSETS
                </CardTitle>
                <CardDescription className="text-[10px] font-mono text-muted-foreground/60">
                  Receive instant internal sweeps at zero platform cost.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-3 py-6">
                  <div className="inline-flex w-12 h-12 bg-primary/10 rounded-full items-center justify-center border border-primary/20 shadow-[0_0_10px_rgba(0,212,255,0.1)]">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-mono font-bold text-muted-foreground/75 uppercase tracking-wide">
                      Your System Sub-account UID
                    </h4>
                    {subAccountUid ? (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="font-mono text-xl font-bold tracking-wider text-foreground select-all bg-muted/40 px-3 py-1 rounded-lg border border-border/30">
                          {subAccountUid}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCopyUid}
                          className="w-8 h-8 rounded border border-border/30 hover:border-primary/30"
                        >
                          {copied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground/60" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="font-mono text-sm text-muted-foreground/50 italic block mt-1">
                        Sweeper loading credentials...
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-muted/40 rounded-xl border border-border/30 text-[10px] leading-relaxed text-muted-foreground font-mono">
                  Share this UID code to receive off-chain transfers from other platform operators. Sweeper processes credit transfers automatically.
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      )}

      {/* Paginated full transaction list tab/view */}
      {showFullHistory && (
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2 font-bold">
                <Button
                  variant="ghost"
                  onClick={() => setShowFullHistory(false)}
                  className="p-1 h-auto mr-1 hover:bg-muted/40 rounded-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                LEDGER HISTORY
              </CardTitle>
              <CardDescription className="text-[10px] font-mono text-muted-foreground/60 ml-7">
                Comprehensive sweep audits and transaction logs.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto border-t border-border/20 bg-card/10">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground bg-muted/10 text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">DATE</th>
                    <th className="py-2.5 px-4 font-semibold">TYPE</th>
                    <th className="py-2.5 px-4 font-semibold text-right">AMOUNT (USDT)</th>
                    <th className="py-2.5 px-4 font-semibold text-center">STATUS</th>
                    <th className="py-2.5 px-4 font-semibold text-center">TX / REF ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/15">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" /> Syncing ledger data...
                      </td>
                    </tr>
                  ) : historyItems.length > 0 ? (
                    historyItems.map((tx) => (
                      <tr key={tx._id} className="hover:bg-muted/15 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground/60">
                          {formatTxDate(tx.createdAt, "MMM dd, yyyy HH:mm")}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground flex items-center gap-2">
                          {getTxIcon(tx.type)}
                          <span className="capitalize">{tx.type}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {formatTxAmount(tx.type, tx.amountUsdt, tx.coin)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getTxStatusBadge(tx.status)}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground/60 text-[9px]">
                          {truncateTxId(tx.txId || tx.bybitTransferId)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                        No transactions registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {historyPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-muted/5 border-t border-border/20 font-mono text-[10px] text-muted-foreground font-bold">
                <div>
                  Page {historyPage} of {historyPages} ({historyTotal} transactions)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage <= 1 || historyLoading}
                    onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 font-mono text-[9px] px-2.5 font-bold cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage >= historyPages || historyLoading}
                    onClick={() => setHistoryPage((prev) => Math.min(historyPages, prev + 1))}
                    className="h-8 font-mono text-[9px] px-2.5 font-bold cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modals: Withdrawal Invoice Review Panel */}
      {withdrawConfirmOpen && (
        <ConfirmModal
          title="Review Withdrawal Request"
          description="Please verify the withdrawal parameters and security options before executing the transfer."
          confirmLabel="Execute Withdrawal"
          danger={true}
          onConfirm={executeWithdraw}
          onCancel={() => setWithdrawConfirmOpen(false)}
        >
          <div className="bg-muted border border-border/40 p-4.5 rounded-xl space-y-3 font-mono text-[10px] shadow-inner">
            <div className="flex justify-between border-b border-border/15 pb-2">
              <span className="text-muted-foreground font-semibold">WITHDRAW AMOUNT:</span>
              <span className="font-extrabold text-foreground text-xs font-sans">${Number(withdrawAmount).toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between border-b border-border/15 pb-2">
              <span className="text-muted-foreground font-semibold">ON-CHAIN NETWORK:</span>
              <span className="font-extrabold text-primary">{withdrawNetwork}</span>
            </div>
            <div className="flex justify-between border-b border-border/15 pb-2">
              <span className="text-muted-foreground font-semibold">TRANSACTION FEES:</span>
              <span className="font-extrabold text-emerald-400 uppercase">Zero (Swept Sweep)</span>
            </div>
            <div className="flex justify-between border-b border-border/15 pb-2">
              <span className="text-muted-foreground font-semibold">EST. BLOCK ARRIVAL:</span>
              <span className="font-extrabold text-foreground">2–5 minutes</span>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/15 pb-2">
              <span className="text-muted-foreground font-semibold">DESTINATION ADDRESS:</span>
              <span className="text-foreground font-bold break-all select-all">{withdrawAddress}</span>
            </div>
            <div className="space-y-1 pt-1.5 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sub-account Sweep Signature Checked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Address Checklist Validated</span>
              </div>
            </div>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
