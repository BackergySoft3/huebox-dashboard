import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../State/auth";
import { api } from "../Services/http.service";
import { authApi } from "../Services/authApi";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/Atoms/card";
import { useNavigate, Link } from "react-router-dom";
import {
  Activity,
  Check,
  CheckCircle,
  Sun,
  Moon,
  ShieldCheck,
  Cpu,
  ShieldAlert,
  Award,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Camera,
} from "lucide-react";
import { useFileUpload } from "../Hooks/useFileUpload";
import { UploadFolder } from "../Enums/UploadFolder.enum";
import ReactFlagsSelect from "react-flags-select";
import { Currency } from "../Enums/Currency.enum";
import { cn } from "../Helpers/utils";
import { Select } from "../Components/Atoms/select";
import { useThemeStore } from "../State/theme";
import { motion, type Variants, type Transition } from "framer-motion";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}


const STEPS = [
  { id: "email", label: "Verify Email", short: "Email" },
  { id: "otp", label: "Enter OTP", short: "OTP" },
  { id: "kyc", label: "Complete Profile", short: "Profile" },
] as const;

type Step = typeof STEPS[number]["id"];

const HueBoxLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-activity w-6 h-6 shrink-0 text-[#42E2D5]"
    aria-hidden="true"
  >
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
  </svg>
);

export function Login() {
  // --- ORIGINAL STATE & HANDLERS PRESERVED ---
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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

  // Avatar upload (profile step)
  const { upload: uploadAvatar, isUploading: isUploadingAvatar, error: avatarUploadError } =
    useFileUpload({
      folder: UploadFolder.AVATARS,
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      maxSizeBytes: 5 * 1024 * 1024,
    });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarPublicUrl(null);
    const result = await uploadAvatar(file);
    if (result) {
      setAvatarPublicUrl(result.publicUrl);
    } else {
      URL.revokeObjectURL(localUrl);
      setAvatarPreview(null);
    }
  };

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

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

    if (!avatarPublicUrl) {
      setError("Please upload a profile photo to continue.");
      return;
    }

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
        phone: cleanPhone,
        avatarUrl: avatarPublicUrl,
      });
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setAuth(
          useAuthStore.getState().accessToken,
          useAuthStore.getState().refreshToken,
          { ...currentUser, firstName: kycForm.firstName, lastName: kycForm.lastName, kycStatus: "in_review", avatarUrl: avatarPublicUrl },
        );
      }
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit profile");
    } finally {
      setLoading(false);
    }
  };
  // -------------------------------------------

  // --- STYLING & ANIMATION ENHANCEMENTS ---
  const { theme, setTheme } = useThemeStore();
  const shouldReduceMotion = useReducedMotion();
  const loginCardRef = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToLogin = () => {
    loginCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Motion variants that respect prefers-reduced-motion
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const heroTextVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const loginCardVariants: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" as const, delay: shouldReduceMotion ? 0 : 0.4 }
    }
  };

  const scrollRevealVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  // Spring animations for interactive hover states
  const hoverSpring: Transition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden relative transition-colors duration-300">

      {/* 1. Sticky / Fixed Animated Navbar */}
      <motion.header
        initial={{ height: 72 }}
        animate={{
          height: scrolled ? 56 : 72,
          backgroundColor: scrolled
            ? theme === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(245, 246, 248, 0.85)"
            : "rgba(0, 0, 0, 0)",
          borderBottomColor: scrolled
            ? "hsl(var(--border))"
            : "rgba(0, 0, 0, 0)",
          boxShadow: scrolled ? "0 4px 20px -5px rgba(0, 0, 0, 0.15)" : "none"
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md flex items-center justify-between px-6 md:px-12 border-b transition-colors duration-300"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <HueBoxLogo />
          <span className="font-bold tracking-wider text-lg font-heading text-foreground">
            HUEBOX
          </span>
        </Link>

        {/* Navigation links & Actions */}
        <div className="flex items-center gap-6 md:gap-8">
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              to="/academy"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Academy
            </Link>
            <Link
              to="/terms"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms & Conditions
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Button size="sm" variant="outline" className="font-semibold cursor-pointer" onClick={scrollToLogin}>
              Access Bot
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Background Motion blobs (Pauses/reduces on prefers-reduced-motion) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={shouldReduceMotion ? {} : {
            x: [0, 40, -20, 0],
            y: [0, -50, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "linear"
          }}
          className="absolute top-[10%] left-[-5%] w-96 h-96 bg-primary/10 blur-[130px] rounded-full"
        />
        <motion.div
          animate={shouldReduceMotion ? {} : {
            x: [0, -30, 50, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "linear"
          }}
          className="absolute bottom-[20%] right-[-5%] w-[450px] h-[450px] bg-accent/10 blur-[130px] rounded-full"
        />
      </div>

      {/* 2. Hero Section with Value Prop & Login Card */}
      {/* min-h fills the viewport below the navbar (72px resting height) so the grid
          stays vertically centered on every step regardless of card content height. */}
      <section className="relative z-10 min-h-[calc(100vh-72px)] flex items-center max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left: Value proposition */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 space-y-4"
          >
            <motion.div variants={heroTextVariants} className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>Next-Gen Grid Automation</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-heading leading-tight">
                Automated Grid Trading <br />
                <span className="bg-gradient-to-r from-primary to-[#42E2D5] bg-clip-text text-transparent">
                  Powered by Advanced AI
                </span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed font-sans">
                HueBox runs automated grid-trading bot software connected to secure exchange infrastructure. Optimize returns, utilize compounding, and manage risk without pool custody.
              </p>
            </motion.div>

            {/* Bullet points — titles only for compact layout */}
            <motion.div variants={heroTextVariants} className="space-y-2.5 max-w-lg">
              {[
                { icon: ShieldCheck, label: "Isolated Account Trading", desc: "Capital stays isolated — HueBox holds zero deposit custody." },
                { icon: TrendingUp, label: "Dynamic Volatility Management", desc: "ATR-based grid spacing survives volatile market breakouts." },
                { icon: Sliders, label: "Personality Profile Strategy", desc: "Moderate, Balanced, or Aggressive — matched to your risk targets." },
                { icon: DollarSign, label: "Non-Custodial & Secure", desc: "You retain full control of your funds at all times." },
              ].map(({ label, desc }) => (
                <div key={label} className="flex gap-3 items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    <span className="hidden lg:inline text-xs text-muted-foreground"> — {desc}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Restyled Login Card */}
          <motion.div
            ref={loginCardRef}
            variants={loginCardVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 flex justify-center"
          >
            <Card className="w-full max-w-lg relative z-10 border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
              <CardHeader className="space-y-2 items-center text-center pb-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Activity className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">Access Control</CardTitle>

                {/* Step indicator */}
                <div className="w-full flex items-center justify-between gap-2">
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
                                : "bg-muted/30 border-border/50 text-muted-foreground/50"
                          )}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <span className={cn(
                            "text-[10px] font-sans font-semibold whitespace-nowrap",
                            isCurrent ? "text-primary" : isCompleted ? "text-emerald-400" : "text-muted-foreground/40"
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
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                    {error}
                  </div>
                )}

                {otpVerified && (
                  <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-400 text-sm rounded-md border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Identity verified. Setting up your profile…
                  </div>
                )}

                {step === "email" && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
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
                    <Button type="submit" className="w-full font-semibold cursor-pointer" disabled={loading}>
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

                    <Button type="submit" className="w-full font-semibold cursor-pointer" disabled={loading}>
                      {loading ? "Verifying…" : "Verify & Login"}
                    </Button>

                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => { setStep("email"); setDevOtp(null); }}
                      >
                        ← Back
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-primary disabled:opacity-40 cursor-pointer"
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
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground font-sans leading-relaxed">
                      Your email has been verified. Please complete the fields below to activate your account.
                    </div>

                    {/* ── Avatar upload ── */}
                    <div className="flex flex-col items-center gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground self-start">
                        Profile photo <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <div
                          role="button"
                          tabIndex={isUploadingAvatar ? -1 : 0}
                          aria-label="Upload profile photo"
                          onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                          onKeyDown={(e) => e.key === "Enter" && !isUploadingAvatar && avatarInputRef.current?.click()}
                          className={cn(
                            "w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
                            !isUploadingAvatar && "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
                            avatarPreview ? "border-primary" : "border-border/50 bg-background/50",
                            isUploadingAvatar && "pointer-events-none",
                          )}
                        >
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                              <Camera className="w-5 h-5" />
                              <span className="text-[9px]">Upload</span>
                            </div>
                          )}
                        </div>

                        {isUploadingAvatar && (
                          <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}

                        {avatarPublicUrl && !isUploadingAvatar && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-background">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                      />

                      {avatarUploadError ? (
                        <p className="text-[10px] text-rose-500 font-mono">{avatarUploadError}</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60">
                          {avatarPublicUrl ? "Click to change" : "PNG, JPG or WebP · max 5 MB"}
                        </p>
                      )}
                    </div>

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
                      </div>
                    </div>

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

                    <Button type="submit" className="w-full font-semibold mt-2 cursor-pointer" disabled={loading}>
                      {loading ? "Submitting…" : "Complete Setup"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </section>

      {/* 3. "How it Works" Section */}
      <section className="border-t border-border/20 py-20 bg-card/10 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">

          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              Deploy Your Bot in 4 Simple Steps
            </h2>
            <p className="text-sm text-muted-foreground">
              A seamless integration process designed to keep your trading capital isolated and in your complete custody.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Step 1 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={scrollRevealVariants}
              className="border border-border/40 bg-card/45 p-6 rounded-2xl relative space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-foreground font-heading">Create Account</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Register with your email to set up your secure, isolated trading account profile. No external configuration is required.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={scrollRevealVariants}
              className="border border-border/40 bg-card/45 p-6 rounded-2xl relative space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-foreground font-heading">Select Strategy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose your preferred strategy setting: Moderate (narrow ranges, tighter spreads), Balanced (standard operations), or Aggressive (leveraged compounding).
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={scrollRevealVariants}
              className="border border-border/40 bg-card/45 p-6 rounded-2xl relative space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-foreground font-heading">Fund Your Balance</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deposit funds via our integrated secure processors. Your assets are safely allocated to your isolated trading account.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={scrollRevealVariants}
              className="border border-border/40 bg-card/45 p-6 rounded-2xl relative space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold">
                4
              </div>
              <h3 className="text-base font-bold text-foreground font-heading">Activate Bot</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deploy the engine. Your strategy starts executing trades instantly, with automated risk management and performance tracking.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. Feature Highlights Section (Interactive Hover Lifts) */}
      <section className="py-20 border-t border-border/20 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">

          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              Engineered for Execution, Built for Safety
            </h2>
            <p className="text-sm text-muted-foreground">
              Deep grid technology tailored to protect your principal capital during volatile market shifts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Feature 1 */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -6, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)" }}
              transition={hoverSpring}
              className="border border-border/30 bg-card/30 p-6 rounded-2xl space-y-4"
            >
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl w-fit">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Dynamic ATR Spacing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The engine listens to Average True Range metrics, spacing active grid lines wider during heavy volatility to prevent buying/selling premature breakouts.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -6, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)" }}
              transition={hoverSpring}
              className="border border-border/30 bg-card/30 p-6 rounded-2xl space-y-4"
            >
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Isolated Trading Accounts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trading operations run strictly within isolated account environments. Cross-strategy margin depletion or unauthorized withdrawals are physically impossible.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -6, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)" }}
              transition={hoverSpring}
              className="border border-border/30 bg-card/30 p-6 rounded-2xl space-y-4"
            >
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl w-fit">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Trailing Grids & Take-Profits</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ensure profit capture by using trailing price boundaries that move upward in strong bullish regimes to ride trend expansion.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -6, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)" }}
              transition={hoverSpring}
              className="border border-border/30 bg-card/30 p-6 rounded-2xl space-y-4"
            >
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl w-fit">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Live Telemetry Control</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Watch active telemetry lines feed data every 30 seconds. Track active cycle counters, heartbeats, order history, and execution errors.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -6, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)" }}
              transition={hoverSpring}
              className="border border-border/30 bg-card/30 p-6 rounded-2xl space-y-4"
            >
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl w-fit">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Admin-Grade Safety Stops</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Emergency circuit breakers allow administrators and users to globally broadcast signal pauses, freeze active bots, or immediately trigger safety stops.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              whileHover={shouldReduceMotion ? {} : { y: -6, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)" }}
              transition={hoverSpring}
              className="border border-border/30 bg-card/30 p-6 rounded-2xl space-y-4"
            >
              <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl w-fit">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-heading">Automatic Capital Recycling</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compounding is integrated. Realized profits within your trading account are automatically recycled to fund new active grid layers, optimizing capital.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. Trust / Social Proof Section */}
      <section className="py-16 border-t border-border/20 bg-card/10 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center space-y-8">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 font-mono">
              Integrations & Verifiable Partnerships
            </h3>
            <p className="text-sm text-muted-foreground">
              Connecting you directly to premium crypto providers with no middle-man custody.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            <div className="text-sm font-semibold tracking-wider font-heading text-foreground px-4 py-2 border border-border/40 rounded-lg bg-card/30">
              MOONPAY GATEWAY
            </div>
            <div className="text-sm font-semibold tracking-wider font-heading text-foreground px-4 py-2 border border-border/40 rounded-lg bg-card/30">
              TRANSAK SUPPORTED
            </div>
            <div className="text-sm font-semibold tracking-wider font-heading text-foreground px-4 py-2 border border-border/40 rounded-lg bg-card/30">
              MERCURYO GATEWAY
            </div>
          </div>

          {/* Commented and visual placeholder for future testimonials */}
          {/* [PLACEHOLDER: Team to insert verified user counts, live active volume metrics, and user testimonials here] */}
          <div className="border border-dashed border-border/60 max-w-xl mx-auto p-4 rounded-xl text-[11px] text-muted-foreground font-sans">
            <span className="font-semibold text-foreground uppercase tracking-wider block mb-1">Metrics & Social Proof placeholder</span>
            Testimonials and verified active bot stats are subject to legal verification. Placeholders will be populated with audited platform figures.
          </div>
        </div>
      </section>

      {/* 6. Academy / Terms Teaser Strip */}
      <section className="py-8 bg-primary/5 border-t border-b border-primary/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-sm text-foreground font-sans font-medium">
              Want to learn how grid bots operate before getting started? Explore our Academy.
            </p>
          </div>

          <div className="flex gap-4">
            <Button asChild size="sm" className="font-semibold cursor-pointer">
              <Link to="/academy">
                Go to Academy <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground cursor-pointer">
              <Link to="/terms">Terms & Conditions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Public Footer */}
      <footer className="border-t border-border/40 bg-card/25 transition-colors duration-300 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

            {/* Brand column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <HueBoxLogo />
                <span className="font-bold tracking-wider text-lg font-heading text-foreground">
                  HUEBOX
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Automated grid-trading bot software infrastructure powered by advanced AI. Keep custody of your funds in your isolated trading account while optimizing your trading.
              </p>
            </div>

            {/* Navigation column */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold tracking-widest text-foreground uppercase">
                Platform
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/academy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    Academy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/glossary" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    Trading Glossary
                  </Link>
                </li>
              </ul>
            </div>

            {/* Disclaimer column */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold tracking-widest text-foreground uppercase">
                Legal Disclaimer
              </h4>
              <p className="text-[12px] text-muted-foreground leading-relaxed font-sans">
                HueBox is an automated software utility. We do not solicit investments, custody user funds, or offer financial advisory services. Algorithmic and cryptocurrency trading involves high operational and financial risk. Past results are no guarantee of future returns.
              </p>
            </div>

          </div>

          <div className="border-t border-border/20 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} HueBox. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-[11px] text-muted-foreground/60">
                100% Free Public Education
              </span>
              <span className="text-[11px] text-muted-foreground/60">
                Non-Custodial Service
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
