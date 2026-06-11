import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { walletApi } from "../services/paymentApi";
import type { Transaction } from "../interfaces/wallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, Info } from "lucide-react";

async function pollForDeposit(orderNo: string, maxAttempts = 24): Promise<Transaction | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await walletApi.getHistory(1, 50);
    const deposit = data.items.find(tx => tx.txId === orderNo && tx.type === 'deposit');
    if (deposit?.status === 'completed') return deposit;
    if (deposit?.status === 'failed') throw new Error(deposit.errorMessage || 'Payment failed');
    await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

export function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"polling" | "success" | "failed" | "timeout" | "no-order">("polling");
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const txIdParam = searchParams.get("externalTransactionId") || searchParams.get("txId");
  const pendingOrderNo = localStorage.getItem("pending_order_no");
  const orderNo = txIdParam || pendingOrderNo;

  useEffect(() => {
    if (!orderNo) {
      setStatus("no-order");
      return;
    }

    let isMounted = true;
    setStatus("polling");

    const startPolling = async () => {
      try {
        const deposit = await pollForDeposit(orderNo);
        
        if (!isMounted) return;

        if (deposit) {
          setDepositAmount(deposit.amountUsdt);
          setStatus("success");
          localStorage.removeItem("pending_order_no");
        } else {
          setStatus("timeout");
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || "Payment verification failed.");
          setStatus("failed");
        }
      }
    };

    startPolling();

    return () => {
      isMounted = false;
    };
  }, [orderNo]);

  const renderContent = () => {
    switch (status) {
      case "polling":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="space-y-1">
              <h3 className="text-lg font-mono font-bold text-slate-200">Payment Processing...</h3>
              <p className="text-xs text-muted-foreground font-mono">
                Verifying your transaction with MoonPay.
              </p>
            </div>
            <div className="p-3 bg-muted/10 border border-border/20 rounded font-mono text-[10px] text-muted-foreground">
              Order No: <span className="text-slate-300 font-bold">{orderNo}</span>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-mono font-bold text-emerald-400">Payment Confirmed!</h3>
              <p className="text-sm text-slate-300 font-mono">
                Your deposit of{" "}
                <span className="text-primary font-extrabold font-mono text-lg">
                  ${Number(depositAmount ?? 0).toFixed(2)} USDT
                </span>{" "}
                has been successfully credited.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-mono">
                Funds are credited to the master account and automatically swept directly to your Bybit sub-account balance.
              </p>
            </div>
            <Button
              onClick={() => navigate("/payments")}
              className="font-mono text-xs px-6 py-2"
            >
              Go to Wallet
            </Button>
          </div>
        );

      case "failed":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            <div className="w-16 h-16 bg-destructive/10 border border-destructive/30 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-mono font-bold text-destructive">Payment Failed</h3>
              <p className="text-sm text-slate-300 font-mono">
                An error occurred while processing your deposit.
              </p>
              {errorMsg && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 text-xs text-destructive rounded-md font-mono max-w-md">
                  {errorMsg}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/payments")}
                className="font-mono text-xs"
              >
                Back to Payments
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="font-mono text-xs"
              >
                Retry Verification
              </Button>
            </div>
          </div>
        );

      case "timeout":
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-mono font-bold text-amber-400">Processing Timeout</h3>
              <p className="text-sm text-slate-300 font-mono leading-relaxed max-w-sm mx-auto">
                Your payment is still processing. Check your transaction history shortly.
              </p>
            </div>
            <Button
              onClick={() => navigate("/payments")}
              className="font-mono text-xs px-6 py-2"
            >
              Go to Wallet
            </Button>
          </div>
        );

      case "no-order":
      default:
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-6">
            <div className="w-16 h-16 bg-muted/10 border border-border/30 rounded-full flex items-center justify-center">
              <Info className="w-10 h-10 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-mono font-bold text-slate-300">No Pending Order</h3>
              <p className="text-xs text-muted-foreground font-mono max-w-sm mx-auto">
                We couldn't detect any active deposit order reference. Please check your transaction history.
              </p>
            </div>
            <Button
              onClick={() => navigate("/payments")}
              className="font-mono text-xs px-6"
            >
              Go to Payments
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-lg bg-card/30 border-border/40 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
        <CardHeader className="text-center border-b border-border/20 pb-4">
          <CardTitle className="text-sm font-mono tracking-wider text-slate-200">
            MOONPAY DEPOSIT VERIFICATION
          </CardTitle>
          <CardDescription className="text-[10px] font-mono text-slate-500">
            Securing transfer to your Bybit Sub-Account
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
