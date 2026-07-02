import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../State/auth";
import { api } from "../Services/http.service";
import { authApi } from "../Services/authApi";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/Atoms/card";
import { useNavigate } from "react-router-dom";
import { Activity, Check, CheckCircle } from "lucide-react";
import ReactFlagsSelect from "react-flags-select";
import { Currency } from "../Enums/Currency.enum";
import { cn } from "../Helpers/utils";
import { Select } from "../Components/Atoms/select";

const STEPS = [
  { id: "email", label: "Verify Email", short: "Email" },
  { id: "otp", label: "Enter OTP", short: "OTP" },
  { id: "kyc", label: "Complete Profile", short: "Profile" },
] as const;

type Step = typeof STEPS[number]["id"];

export function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [kycForm, setKycForm] = useState({
    firstName: "",
    lastName: "",
    country: "",
    phone: "",
    currency: Currency.USD as Currency,
    referralCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  // H-01: OTP resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  // M-05: Show brief success state between OTP and KYC
  const [otpVerified, setOtpVerified] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  // H-01: Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const doSendOtp = async () => {
    setLoading(true);
    setEmailError("");
    setOtpError("");
    setDevOtp(null);
    try {
      await api.post("/api/auth/otp/send", { email });
      setResendCooldown(60);

      if (import.meta.env.DEV) {
        try {
          const res = await api.get("/api/auth/otp/dev-peek", {
            params: { email, purpose: "login" },
          });
          if (res.data?.otp) setDevOtp(res.data.otp);
        } catch {
          // Silently ignore
        }
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    await doSendOtp();
    setStep("otp");
  };

  // H-01: Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setOtp("");
    setOtpError("");
    setResendSuccess(false);
    await doSendOtp();
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 5000);
    otpInputRef.current?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOtpError("");
    try {
      const res = await api.post("/api/auth/otp/verify", { email, otp });
      const accessToken = res.data.access_token || res.data.accessToken || res.data.token;
      const refreshToken = res.data.refresh_token || res.data.refreshToken;
      const userData = res.data.user;
      if (accessToken) {
        setAuth(accessToken, refreshToken || "", {
          id: userData?.id,
          email: userData?.email || email,
          role: userData?.role || "USER",
          status: userData?.status,
          kycStatus: userData?.kycStatus,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          avatarUrl: userData?.avatarUrl,
        });

        if (userData?.kycStatus === "pending") {
          // M-05: Brief success flash before showing KYC
          setOtpVerified(true);
          setTimeout(() => {
            setOtpVerified(false);
            setStep("kyc");
          }, 1200);
        } else {
          navigate("/");
        }
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // H-02: Phone format validation
    const cleanPhone = kycForm.phone.replace(/[\s\-()]/g, "");
    if (!/^\+[1-9]\d{4,14}$/.test(cleanPhone)) {
      setError("Invalid phone number format. Must start with '+' and include your country code (e.g., +1 555 000 0000).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authApi.prepareAccount({
        ...kycForm,
        phone: cleanPhone
      });
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(
          useAuthStore.getState().accessToken,
          useAuthStore.getState().refreshToken,
          { ...currentUser, firstName: kycForm.firstName, lastName: kycForm.lastName, kycStatus: "in_review" }
        );
      }
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="space-y-4 items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Huebox Engine</CardTitle>

          {/* H-03: Step progress indicator */}
          <div className="w-full flex items-center justify-between gap-2 pt-1">
            {STEPS.map((s, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                        : isCurrent
                          ? "bg-primary/15 border-primary text-primary shadow-[0_0_8px_rgba(0,122,255,0.3)]"
                          : "bg-muted/30 border-border text-muted-foreground"
                    )}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className={cn(
                      "text-[10px] font-sans font-semibold whitespace-nowrap",
                      isCurrent ? "text-primary" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                    )}>
                      {s.short}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 rounded mb-4",
                      isCompleted ? "bg-emerald-500/40" : "bg-border/40"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          <CardDescription>
            {step === "email"
              ? "Enter your email to receive a one-time passcode"
              : step === "otp"
                ? `Enter the 6-digit code sent to ${email}`
                : "Complete your profile to activate your account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* M-05: OTP verified success flash */}
          {otpVerified && (
            <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-400 text-sm rounded-md border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Identity verified. Setting up your profile…
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                {/* H-02: Proper label */}
                <label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground">
                  Email address <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  autoComplete="email"
                  autoFocus
                  aria-describedby={emailError ? "login-email-error" : undefined}
                  aria-invalid={!!emailError}
                  className={cn("bg-background/50 text-foreground", emailError && "border-destructive focus-visible:ring-destructive")}
                />
                {emailError && (
                  <p id="login-email-error" className="text-xs text-destructive mt-1">
                    {emailError}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? "Sending…" : "Send One-Time Passcode"}
              </Button>
            </form>
          )}

          {step === "otp" && !otpVerified && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* DEV MODE: Auto-fetched OTP banner */}
              {import.meta.env.DEV && devOtp && (
                <div
                  className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-amber-500/15 transition-colors"
                  onClick={() => setOtp(devOtp)}
                  title="Click to auto-fill OTP"
                >
                  <div>
                    <p className="text-[10px] font-mono text-amber-400/70 uppercase tracking-widest mb-0.5">
                      🛠 Dev Mode — OTP
                    </p>
                    <p className="text-2xl font-mono font-bold tracking-[0.3em] text-amber-300">
                      {devOtp}
                    </p>
                  </div>
                  <span className="text-[10px] text-amber-400/60 font-mono border border-amber-500/20 px-2 py-1 rounded">
                    click to fill
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                {/* H-02: Proper label */}
                <label htmlFor="login-otp" className="text-xs font-semibold text-muted-foreground">
                  One-time passcode
                </label>
                <Input
                  ref={otpInputRef}
                  id="login-otp"
                  type="text"
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value); setOtpError(""); }}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  aria-describedby={otpError ? "login-otp-error" : resendSuccess ? "login-otp-resent" : undefined}
                  aria-invalid={!!otpError}
                  className={cn("bg-background/50 text-center tracking-widest text-lg font-mono text-foreground", otpError && "border-destructive focus-visible:ring-destructive")}
                  maxLength={6}
                />
                {otpError && (
                  <p id="login-otp-error" className="text-xs text-destructive mt-1">
                    {otpError}
                  </p>
                )}
                {resendSuccess && !otpError && (
                  <p id="login-otp-resent" className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    A new code has been sent. Please enter the latest OTP.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? "Verifying…" : "Verify & Login"}
              </Button>

              {/* H-01: Resend OTP with cooldown */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setStep("email"); setDevOtp(null); }}
                >
                  ← Back
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-primary disabled:opacity-40"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </Button>
              </div>
            </form>
          )}

          {step === "kyc" && !otpVerified && (
            <form onSubmit={handleKycSubmit} className="space-y-3">
              {/* M-05: Context message above KYC form */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground font-sans leading-relaxed">
                Your email has been verified. Please complete the fields below to activate your account.
              </div>

              {/* H-02: Labels for all KYC fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="kyc-first-name" className="text-xs font-semibold text-muted-foreground">
                    First name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="kyc-first-name"
                    type="text"
                    placeholder="Jane"
                    value={kycForm.firstName}
                    onChange={(e) => setKycForm({ ...kycForm, firstName: e.target.value })}
                    required
                    autoComplete="given-name"
                    className="bg-background/50 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="kyc-last-name" className="text-xs font-semibold text-muted-foreground">
                    Last name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="kyc-last-name"
                    type="text"
                    placeholder="Smith"
                    value={kycForm.lastName}
                    onChange={(e) => setKycForm({ ...kycForm, lastName: e.target.value })}
                    required
                    autoComplete="family-name"
                    className="bg-background/50 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <ReactFlagsSelect
                    selected={kycForm.country}
                    onSelect={(code) => setKycForm({ ...kycForm, country: code })}
                    searchable
                    placeholder="Select Country…"
                    className="react-flags-custom w-full text-foreground"
                    selectButtonClassName="!w-full !h-10 !bg-background/50 !rounded-md !border !border-input !px-3 !py-2 !text-sm focus:!ring-2 focus:!ring-ring focus:!outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="kyc-phone" className="text-xs font-semibold text-muted-foreground">
                    Phone number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="kyc-phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={kycForm.phone}
                    onChange={(e) => setKycForm({ ...kycForm, phone: e.target.value })}
                    required
                    autoComplete="tel"
                    className="bg-background/50 text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Format hint: +1 555 000 0000</p>
                </div>
              </div>

              {/* M-08: Currency select with consistent label + styling */}
              <div className="space-y-1">
                <label htmlFor="kyc-currency" className="text-xs font-semibold text-muted-foreground">
                  Preferred currency
                </label>
                <Select
                  id="kyc-currency"
                  value={kycForm.currency}
                  onChange={(e) => setKycForm({ ...kycForm, currency: e.target.value as Currency })}
                  required
                >
                  {Object.entries(Currency).map(([key, val]) => (
                    <option key={val} value={val}>{key}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label htmlFor="kyc-referral" className="text-xs font-semibold text-muted-foreground">
                  Referral code <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <Input
                  id="kyc-referral"
                  type="text"
                  placeholder="e.g. FRIEND2024"
                  value={kycForm.referralCode}
                  onChange={(e) => setKycForm({ ...kycForm, referralCode: e.target.value })}
                  className="bg-background/50 text-foreground"
                />
              </div>

              <Button type="submit" className="w-full font-semibold mt-2" disabled={loading}>
                {loading ? "Submitting…" : "Complete Setup"}
              </Button>
              {error && (
                <p className="text-xs text-destructive mt-2 text-center">{error}</p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
