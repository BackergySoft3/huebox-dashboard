import { useState } from "react";
import {
  useWalletBalance,
  useTransactionHistory,
  useCreateOrder,
  useWithdraw,
  useSend,
} from "../hooks/useWallet";
import { PaymentsTab } from "../enums/PaymentsTab.enum";
import { TransactionType } from "../enums/TransactionType.enum";
import { TransactionStatus } from "../enums/TransactionStatus.enum";
import { useBotStatus } from "../hooks/useBotStatus";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ConfirmModal } from "../components/ConfirmModal";
import { parseApiError } from "../utils/parseApiError";
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
  Info,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";

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
        return <Percent className="w-4 h-4 text-slate-400" />;
      case TransactionType.Pnl:
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default:
        return <Coins className="w-4 h-4 text-primary" />;
    }
  };

  const getTxStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="text-slate-400 border-border/30 px-2 py-0.5 text-[10px] font-mono">
          UNKNOWN
        </Badge>
      );
    }
    switch (status) {
      case TransactionStatus.Completed:
      case TransactionStatus.Confirmed:
        return (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-mono">
            COMPLETED
          </Badge>
        );
      case TransactionStatus.Pending:
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px] font-mono">
            PENDING
          </Badge>
        );
      case TransactionStatus.Failed:
        return (
          <Badge variant="outline" className="text-red-400 border-red-500/20 bg-red-500/5 px-2 py-0.5 text-[10px] font-mono">
            FAILED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400 border-border/30 px-2 py-0.5 text-[10px] font-mono">
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
      <span className={cn("font-mono font-bold", color)}>
        {sign}${amountVal.toFixed(2)} <span className="text-[10px] text-muted-foreground">{coinSymbol || "USDT"}</span>
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

  // Mutators and Handlers
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Wallet</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            Manage deposit flows, wallet balance, and transfers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="font-mono text-xs shrink-0">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 pb-px gap-1 overflow-x-auto">
        {Object.values(PaymentsTab).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowFullHistory(false);
            }}
            className={cn(
              "px-4 py-2.5 text-xs font-mono font-medium border-b-2 capitalize transition-all whitespace-nowrap",
              activeTab === tab && !showFullHistory
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {tab === PaymentsTab.SendReceive ? "Send / Receive" : tab.replace("-", " ")}
          </button>
        ))}
        {showFullHistory && (
          <button
            className="px-4 py-2.5 text-xs font-mono font-medium border-b-2 border-primary text-primary bg-primary/5 capitalize transition-all whitespace-nowrap"
            disabled
          >
            Transaction History
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {!showFullHistory && activeTab === PaymentsTab.Overview && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Balance Card */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-mono tracking-wider flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-primary" /> SUB-ACCOUNT USDT BALANCE
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="h-10 w-48 bg-muted/20 animate-pulse rounded border border-border/20 mt-1" />
              ) : (
                <div className="text-4xl font-extrabold font-mono text-primary glow-cyan tracking-tight mt-1">
                  ${Number(balance ?? 0).toFixed(2)}{" "}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{coin}</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                Live balance checked every 15 seconds. Active funds ready for bot deployment.
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => setActiveTab(PaymentsTab.AddFunds)}
              className="bg-card/20 border-border/40 hover:border-primary/40 text-xs font-mono flex flex-col items-center justify-center h-20 py-2"
            >
              <ArrowDownLeft className="w-5 h-5 text-emerald-400 mb-1" /> Add Funds
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab(PaymentsTab.Withdraw)}
              className="bg-card/20 border-border/40 hover:border-amber-400/40 text-xs font-mono flex flex-col items-center justify-center h-20 py-2"
            >
              <ArrowUpRight className="w-5 h-5 text-amber-400 mb-1" /> Withdraw
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab(PaymentsTab.SendReceive)}
              className="bg-card/20 border-border/40 hover:border-primary/40 text-xs font-mono flex flex-col items-center justify-center h-20 py-2"
            >
              <Send className="w-5 h-5 text-primary mb-1" /> Send USDT
            </Button>
          </div>

          {/* Recent Transactions List */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-mono tracking-wider text-slate-200">
                  RECENT TRANSACTIONS
                </CardTitle>
                <CardDescription className="text-[10px] font-mono text-slate-500">
                  Last 5 operations recorded on this sub-account.
                </CardDescription>
              </div>
              <Button
                variant="link"
                onClick={() => setShowFullHistory(true)}
                className="text-xs text-primary font-mono hover:underline p-0 h-auto"
              >
                View all →
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto border-t border-border/20 bg-card/10">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
                      <th className="py-2.5 px-4 font-medium">DATE</th>
                      <th className="py-2.5 px-4 font-medium">TYPE</th>
                      <th className="py-2.5 px-4 font-medium text-right">AMOUNT (USDT)</th>
                      <th className="py-2.5 px-4 font-medium text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {historyLoading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-500 italic">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading transaction history...
                          </div>
                        </td>
                      </tr>
                    ) : historyItems.length > 0 ? (
                      historyItems.slice(0, 5).map((tx) => (
                        <tr key={tx._id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4 text-slate-500">
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
                        <td colSpan={4} className="py-8 text-center text-muted-foreground italic">
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
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-mono tracking-wider text-slate-200">
                DEPOSIT WITH MOONPAY
              </CardTitle>
              <CardDescription className="text-xs font-mono text-slate-500">
                Quick fiat on-ramp to buy crypto and fund your trading bot sub-account immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addFundsSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    MoonPay checkout opened in a new tab. Your balance will update automatically once payment is confirmed.
                  </span>
                </div>
              )}

              {addFundsErrorMsg && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addFundsErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddFundsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Amount in USD</label>
                  <Input
                    type="number"
                    min="10"
                    step="0.01"
                    placeholder="50.00"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    required
                    className="font-mono text-sm bg-background/40"
                  />
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Minimum deposit amount is $10.00 USD.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Fiat Currency</label>
                  <select
                    value={addFundsFiat}
                    onChange={(e) => setAddFundsFiat(e.target.value)}
                    className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-mono shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="w-full font-mono text-xs font-semibold py-2.5 mt-2"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Launching MoonPay...
                    </>
                  ) : (
                    "Deposit with MoonPay"
                  )}
                </Button>
              </form>

              {/* Info block */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded flex items-start gap-3 mt-4">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-400/90 leading-relaxed font-mono">
                  Deposited funds will be credited to the master wallet and instantly swept into your sub-account balance. The sweeping process typically completes within 2 minutes of the on-chain blockchain confirmation.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Withdraw */}
      {!showFullHistory && activeTab === PaymentsTab.Withdraw && (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-mono tracking-wider text-slate-200">
                WITHDRAW CRYPTO
              </CardTitle>
              <CardDescription className="text-xs font-mono text-slate-500">
                Withdraw USDT from this sub-account directly to any on-chain destination.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Balance display */}
              <div className="p-4 bg-muted/10 border border-border/30 rounded-lg flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400">Available Sub-account balance:</span>
                <span className="text-lg font-bold text-primary">${Number(balance ?? 0).toFixed(2)} USDT</span>
              </div>

              {withdrawSuccessId && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-md flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">Withdrawal request initiated successfully.</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 pl-6 break-all">
                    Reference ID: {withdrawSuccessId}
                  </span>
                </div>
              )}

              {withdrawErrorMsg && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{withdrawErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-slate-400">Withdrawal Amount</label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(balance.toString())}
                      className="text-[10px] text-primary font-mono hover:underline focus:outline-none"
                    >
                      Use Max Balance
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
                      className="font-mono text-sm bg-background/40 pr-12"
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">
                      USDT
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Destination Address</label>
                  <Input
                    type="text"
                    placeholder="Enter on-chain wallet address"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    required
                    className="font-mono text-sm bg-background/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Network</label>
                  <select
                    value={withdrawNetwork}
                    onChange={(e) => setWithdrawNetwork(e.target.value)}
                    className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-mono shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="TRC20">TRON (TRC20)</option>
                    <option value="ERC20">Ethereum (ERC20)</option>
                    <option value="BEP20">BNB Chain (BEP20)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={withdrawMutation.isPending || !withdrawAmount || !withdrawAddress}
                  className="w-full font-mono text-xs font-semibold py-2.5 mt-2"
                >
                  Initiate Withdrawal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Send / Receive */}
      {!showFullHistory && activeTab === PaymentsTab.SendReceive && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-300">
          {/* Send subaccount to UID */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-base font-mono tracking-wider text-slate-200">
                  INTERNAL TRANSFER (SEND)
                </CardTitle>
                <CardDescription className="text-xs font-mono text-slate-500">
                  Instantly transfer funds to another Bybit UID on the HueBox system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sendSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 rounded-md flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Transfer executed successfully. Balance updated.</span>
                  </div>
                )}

                {sendErrorMsg && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{sendErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSendSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400">Recipient Bybit UID</label>
                    <Input
                      type="text"
                      placeholder="Enter recipient Bybit UID"
                      value={sendUid}
                      onChange={(e) => setSendUid(e.target.value)}
                      required
                      className="font-mono text-sm bg-background/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-mono text-slate-400">Transfer Amount</label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Max: ${Number(balance ?? 0).toFixed(2)} USDT
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
                        className="font-mono text-sm bg-background/40 pr-12"
                      />
                      <div className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">
                        USDT
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={sendMutation.isPending || !sendAmount || !sendUid}
                    className="w-full font-mono text-xs font-semibold py-2.5 mt-2"
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Transferring...
                      </>
                    ) : (
                      "Send USDT"
                    )}
                  </Button>
                </form>
              </CardContent>
            </div>
          </Card>

          {/* Receive subaccount details */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
            <CardHeader>
              <CardTitle className="text-base font-mono tracking-wider text-slate-200">
                RECEIVE FUNDS
              </CardTitle>
              <CardDescription className="text-xs font-mono text-slate-500">
                Receive instant internal transfers from other operators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col justify-center">
              <div className="text-center space-y-3 py-4">
                <div className="inline-flex w-12 h-12 bg-primary/10 rounded-full items-center justify-center border border-primary/30">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                    Your Sub-account UID
                  </h4>
                  {subAccountUid ? (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="font-mono text-xl font-bold tracking-wider text-slate-200 select-all">
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
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className="font-mono text-sm text-slate-500 italic block mt-1">
                      Loading sub-account UID...
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded border border-border/20 text-[10px] leading-relaxed text-slate-500 font-mono">
                Give this UID code to the sending operator. Transfers from within the HueBox ecosystem are processed instantly at zero fee.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paginated full transaction list tab/view */}
      {showFullHistory && (
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm animate-in fade-in duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-mono tracking-wider text-slate-200 flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowFullHistory(false)}
                  className="p-1 h-auto mr-1 hover:bg-white/5 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                TRANSACTION HISTORY
              </CardTitle>
              <CardDescription className="text-[10px] font-mono text-slate-500 ml-7">
                Comprehensive log of all ledger changes for this account.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto border-t border-border/20 bg-card/10">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
                    <th className="py-2.5 px-4 font-medium">DATE</th>
                    <th className="py-2.5 px-4 font-medium">TYPE</th>
                    <th className="py-2.5 px-4 font-medium text-right">AMOUNT (USDT)</th>
                    <th className="py-2.5 px-4 font-medium text-center">STATUS</th>
                    <th className="py-2.5 px-4 font-medium text-center">TX ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" /> Loading history...
                      </td>
                    </tr>
                  ) : historyItems.length > 0 ? (
                    historyItems.map((tx) => (
                      <tr key={tx._id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 text-slate-500">
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
                        <td className="py-3 px-4 text-center text-slate-500 text-[10px]">
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
              <div className="flex items-center justify-between px-4 py-3 bg-muted/5 border-t border-border/20 font-mono text-xs text-muted-foreground">
                <div>
                  Showing page {historyPage} of {historyPages} ({historyTotal} transactions total)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage <= 1 || historyLoading}
                    onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 font-mono text-[10px] px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage >= historyPages || historyLoading}
                    onClick={() => setHistoryPage((prev) => Math.min(historyPages, prev + 1))}
                    className="h-8 font-mono text-[10px] px-2"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modals */}
      {withdrawConfirmOpen && (
        <ConfirmModal
          title="Confirm Withdrawal"
          description={`Withdraw ${withdrawAmount} USDT to ${withdrawAddress} via ${withdrawNetwork}?\n\nWARNING: This action is irreversible. Funds will leave the sub-account immediately. Please verify address and network before proceeding.`}
          onConfirm={executeWithdraw}
          onCancel={() => setWithdrawConfirmOpen(false)}
        />
      )}
    </div>
  );
}
