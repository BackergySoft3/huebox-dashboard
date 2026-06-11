import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Wallet, ChevronRight, Info } from "lucide-react";

interface BotAllocationProps {
  availableBalance: number;
  onConfirm: (amount: number) => void;
}

export function BotAllocation({ availableBalance, onConfirm }: BotAllocationProps) {
  const [rawInput, setRawInput] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(0);

  // Sync slider → input
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value);
    setSliderValue(pct);
    const computed = Math.floor((pct / 100) * availableBalance);
    setRawInput(computed > 0 ? String(computed) : "");
    setAmount(computed > 0 ? computed : null);
    setError(null);
  };

  // Sync input → slider
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && availableBalance > 0) {
      setSliderValue(Math.min(100, Math.round((num / availableBalance) * 100)));
    } else {
      setSliderValue(0);
    }
    setAmount(null);
    setError(null);
  };

  const handleConfirm = () => {
    const num = parseFloat(rawInput);
    if (!rawInput || isNaN(num) || num === 0) {
      setError("Please enter an allocation amount.");
      return;
    }
    if (num < 100) {
      setError("Minimum allocation is $100 USDT.");
      return;
    }
    if (num > availableBalance) {
      setError(`Maximum is your available balance ($${availableBalance.toFixed(2)}).`);
      return;
    }
    setAmount(num);
    setError(null);
    onConfirm(num);
  };

  const pct = availableBalance > 0 ? sliderValue : 0;

  return (
    <Card className="bg-card/30 border-border/40 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-400">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-slate-200">
          <Wallet className="w-4 h-4 text-primary" />
          STEP 2 — WALLET ALLOCATION
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Balance overview */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-border/30 rounded-lg px-4 py-3">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Available Balance</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              ${availableBalance.toFixed(2)} <span className="text-xs text-slate-500 font-normal">USDT</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Allocating</p>
            <p className="text-xl font-bold font-mono text-primary mt-0.5">
              {rawInput && !isNaN(parseFloat(rawInput))
                ? `$${parseFloat(rawInput).toFixed(2)}`
                : "$0.00"}{" "}
              <span className="text-xs text-slate-500 font-normal">USDT</span>
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0%</span>
            <span className="text-primary font-semibold">{pct}% of balance</span>
            <span>100%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderValue}
              onChange={handleSliderChange}
              disabled={availableBalance === 0}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_hsl(180_60%_55%/0.6)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, hsl(180 60% 55%) 0%, hsl(180 60% 55%) ${pct}%, hsl(220 10% 18%) ${pct}%, hsl(220 10% 18%) 100%)`,
              }}
            />
          </div>
          {/* Quick % buttons */}
          <div className="flex gap-2 pt-1">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setSliderValue(p);
                  const computed = Math.floor((p / 100) * availableBalance);
                  setRawInput(String(computed));
                  setAmount(null);
                  setError(null);
                }}
                className="flex-1 text-[10px] font-mono font-semibold py-1 rounded border border-border/30 text-slate-400 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        {/* Manual input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Or enter exact amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">$</span>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={rawInput}
              onChange={handleInputChange}
              min={0}
              max={availableBalance}
              className="pl-7 font-mono text-sm bg-slate-950/50 border-border/40 focus-visible:ring-primary/40"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">USDT</span>
          </div>
          {error && (
            <p className="text-[11px] font-mono text-destructive flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* Helper text */}
        {availableBalance < 100 ? (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-destructive leading-relaxed">
              Insufficient balance. You need at least $100 USDT available in your Bybit account to start the bot.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
              Your bot will only use this amount. Remaining balance stays untouched.
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleConfirm}
          disabled={availableBalance < 100}
          className="w-full font-mono text-xs bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
        >
          Confirm Allocation
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
