import { useState } from "react";
import { useAuthStore } from "../State/auth";
import { api } from "../Services/http.service";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/Atoms/card";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDevOtp(null);
    try {
      await api.post("/api/auth/otp/send", { email });
      setStep("otp");

      // Dev-only: auto-fetch OTP for display
      if (import.meta.env.DEV) {
        try {
          const res = await api.get("/api/auth/otp/dev-peek", {
            params: { email, purpose: "login" },
          });
          if (res.data?.otp) setDevOtp(res.data.otp);
        } catch {
          // Silently ignore — email still works
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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
        navigate("/");
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to verify OTP");
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
        <CardHeader className="space-y-3 items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Huebox Engine</CardTitle>
          <CardDescription>
            {step === "email" ? "Enter your email to receive an OTP" : "Enter the 6-digit OTP sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              {error}
            </div>
          )}
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 text-foreground"
                />
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
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

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="bg-background/50 text-center tracking-widest text-lg font-mono text-foreground"
                  maxLength={6}
                />
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading ? "Verifying..." : "Login"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => { setStep("email"); setDevOtp(null); }}
              >
                Back
              </Button>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
