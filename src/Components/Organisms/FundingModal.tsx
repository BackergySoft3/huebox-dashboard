import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFundingStore } from "../../State/funding";
import { Button } from "../Atoms/button";
import { Input } from "../Atoms/input";
import { cn } from "../../Helpers/utils";
import {
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Info,
  ShieldCheck,
} from "lucide-react";

interface FundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "deposit" | "withdraw";
}

export function FundingModal({ isOpen, onClose, initialTab = "deposit" }: FundingModalProps) {
  const {
    balance,
    depositInfo,
    isBalanceLoading,
    isDepositInfoLoading,
    isWithdrawing,
    error,
    fetchBalance,
    fetchDepositInfo,
    initiateWithdrawal,
    clearError,
  } = useFundingStore();

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(initialTab);
  const [copied, setCopied] = useState(false);

  // Withdrawal form state
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [coin, setCoin] = useState("USDT");
  const [withdrawSuccess, setWithdrawSuccess] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
      fetchDepositInfo();
      clearError();
      setWithdrawSuccess(null);
      setAmount("");
      setAddress("");
      setNetwork("TRC20");
      setCoin("USDT");
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setWithdrawSuccess(null);

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return;
    }

    try {
      const result = await initiateWithdrawal(withdrawAmount, address, network, coin);
      setWithdrawSuccess(result);
      setAmount("");
      setAddress("");
      fetchBalance();
    } catch (err) {
      // Handled by store
    }
  };

  const handleOnRampRedirect = (provider: "moonpay" | "transak") => {
    const memo = depositInfo?.memo;
    if (!memo) return;

    if (provider === "moonpay") {
      // Directs to MoonPay with custom parameter matching our depositIngestion
      window.open(
        `https://buy.moonpay.com?apiKey=pk_live_placeholder&currencyCode=usdt&walletAddress=${depositInfo.masterDepositAddress}&walletAddressTag=${memo}`,
        "_blank"
      );
    } else {
      // Directs to Transak
      window.open(
        `https://global.transak.com?apiKey=pk_live_placeholder&cryptoCurrency=USDT&walletAddress=${depositInfo.masterDepositAddress}&uhd=${memo}`,
        "_blank"
      );
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex md:pl-[260px]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm md:left-[260px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Window Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
        <div
          className="relative z-10 w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col gap-0 my-auto animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/20 bg-muted/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-sans font-bold text-sm text-foreground">
                Manage Investment Account
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted/40"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Balance display */}
          <div className="mx-5 mt-5 p-4 bg-muted/30 border border-border/30 rounded-xl flex items-center justify-between font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Available balance
              </span>
              <span className="text-xl font-bold text-emerald-400 mt-0.5">
                {isBalanceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin inline-block" />
                ) : (
                  `$${(balance?.availableBalance ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}{" "}
                <span className="text-xs text-muted-foreground font-normal">USDT</span>
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Pending Balance
              </span>
              <span className="text-sm font-bold text-amber-400 mt-0.5">
                {isBalanceLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline-block" />
                ) : (
                  `$${(balance?.pendingBalance ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}{" "}
                <span className="text-xs text-muted-foreground font-normal">USDT</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border/20 mx-5 mt-4">
            <button
              onClick={() => setActiveTab("deposit")}
              className={cn(
                "flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
                activeTab === "deposit"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
              </span>
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={cn(
                "flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
                activeTab === "withdraw"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
              </span>
            </button>
          </div>

          {/* Error notifications */}
          {error && (
            <div className="mx-5 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success notifications */}
          {withdrawSuccess && (
            <div className="mx-5 mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{withdrawSuccess.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Ref: {withdrawSuccess.withdrawalId}
                </p>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="p-5 overflow-y-auto max-h-[380px] scrollbar-none">
            {activeTab === "deposit" ? (
              <div className="space-y-4 font-sans">
                {/* On-chain Deposit Option */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Option 1: On-Chain USDT Deposit
                  </h3>
                  <div className="p-4 bg-card border border-border/60 rounded-xl space-y-3 font-mono text-xs">
                    {isDepositInfoLoading ? (
                      <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading deposit info...
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase">
                            USDT Master Deposit Address
                          </span>
                          <div className="flex gap-2 items-center">
                            <span className="bg-muted/40 px-3 py-1.5 rounded-lg border border-border/20 break-all select-all font-bold text-[11px] flex-1">
                              {depositInfo?.masterDepositAddress || "Loading..."}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8.5 px-3 cursor-pointer shrink-0 border-border/30 hover:bg-muted/40"
                              onClick={() =>
                                handleCopy(depositInfo?.masterDepositAddress ?? "")
                              }
                            >
                              {copied ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1 mt-2">
                          <span className="text-[10px] text-muted-foreground uppercase">
                            Your Personal Memo/Tag (Required)
                          </span>
                          <div className="flex gap-2 items-center">
                            <span className="bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 font-extrabold text-sm text-primary tracking-widest flex-1 text-center">
                              {depositInfo?.memo || "Loading..."}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8.5 px-3 cursor-pointer shrink-0 border-border/30 hover:bg-muted/40"
                              onClick={() => handleCopy(depositInfo?.memo ?? "")}
                            >
                              {copied ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-start gap-2.5 mt-2">
                          <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                          <span className="text-[10px] leading-snug">
                            {depositInfo?.warning ||
                              "Always include your personal memo/tag when sending. Deposits without a memo cannot be matched."}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Fiat On-ramp Option */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Option 2: Buy USDT With Fiat
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleOnRampRedirect("moonpay")}
                      disabled={!depositInfo?.memo}
                      className="p-3 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 text-left transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      <span className="font-bold text-sm block text-foreground">MoonPay</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Credit card, Apple Pay, SEPA
                      </span>
                    </button>
                    <button
                      onClick={() => handleOnRampRedirect("transak")}
                      disabled={!depositInfo?.memo}
                      className="p-3 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 text-left transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      <span className="font-bold text-sm block text-foreground">Transak</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Bank transfers, cards, local pay
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWithdrawalSubmit} className="space-y-4 font-sans">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground/70 uppercase">
                    <label>Amount (USDT)</label>
                    <button
                      type="button"
                      onClick={() =>
                        setAmount(String(balance?.availableBalance ?? 0))
                      }
                      className="text-[9px] text-primary hover:underline font-bold"
                    >
                      Use Max
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="font-mono text-sm bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground pr-12"
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold font-mono pointer-events-none">
                      USDT
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase block">
                    Destination Wallet Address
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="font-mono text-sm bg-muted/30 border-border/30 h-9.5 focus:ring-primary focus:border-primary text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-muted-foreground/70 uppercase block">
                    On-Chain Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full h-9.5 rounded-lg border border-border/30 bg-muted/30 px-3 py-2 text-xs font-mono shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="TRC20">TRON (TRC20)</option>
                    <option value="ERC20">Ethereum (ERC20)</option>
                    <option value="BEP20">BNB Chain (BEP20)</option>
                  </select>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3 mt-4">
                  <ShieldCheck className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                  <div className="text-[10px] text-muted-foreground/90 leading-relaxed font-mono">
                    Large withdrawals (&gt;$1,000) are flagged and processed within 24 hours under superadmin multi-sig validation. Small withdrawals are automated.
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isWithdrawing || !amount || !address}
                  className="w-full font-mono text-xs font-bold py-2.5 mt-2 h-10 cursor-pointer"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Initiate Withdrawal"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
