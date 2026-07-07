/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Shield, Fingerprint, Smartphone, Activity, ChevronRight,
  Camera, CheckCircle2, Loader2, LogOut, Mail, Phone, Globe,
  BadgeCheck, X, Clock, AlertTriangle,
  Monitor, Tablet, AlertCircle, RefreshCw, MessageSquare,
} from "lucide-react";
import { api } from "../Services/http.service";
import { useAuthStore } from "../State/auth";
import { useFileUpload } from "../Hooks/useFileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { countryDialCodes } from "../Constants/countryDialCodes";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import { Select } from "../Components/Atoms/select";
import { Badge } from "../Components/Atoms/badge";
import { cn } from "../Helpers/utils";
import { UploadFolder } from "../Enums/UploadFolder.enum";
import { Currency } from "../Enums";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileSection = "info" | "security" | "devices" | "activities" | "account";

interface UserProfile {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  country?: string;
  currency?: Currency;
  kycStatus?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
}

interface DeviceSession {
  id: string;
  jti: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt?: string;
  expiresAt?: string;
  isCurrent?: boolean;
}

interface ActivityLog {
  id: string;
  type?: "login" | "security";
  action?: string;
  source?: string;
  status?: "completed" | "failed" | "pending";
  ipAddress?: string;
  createdAt?: string;
  description?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRIES: { code: string; name: string }[] = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" }, { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" }, { code: "AO", name: "Angola" }, { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" }, { code: "AM", name: "Armenia" }, { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" }, { code: "AZ", name: "Azerbaijan" }, { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" }, { code: "BD", name: "Bangladesh" }, { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" }, { code: "BE", name: "Belgium" }, { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" }, { code: "BT", name: "Bhutan" }, { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" }, { code: "BW", name: "Botswana" }, { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" }, { code: "BG", name: "Bulgaria" }, { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" }, { code: "CV", name: "Cabo Verde" }, { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" }, { code: "CA", name: "Canada" }, { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" }, { code: "CL", name: "Chile" }, { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" }, { code: "KM", name: "Comoros" }, { code: "CG", name: "Congo" },
  { code: "CR", name: "Costa Rica" }, { code: "HR", name: "Croatia" }, { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czech Republic" }, { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" }, { code: "DM", name: "Dominica" }, { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" }, { code: "EG", name: "Egypt" }, { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" }, { code: "ER", name: "Eritrea" }, { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Ethiopia" }, { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" }, { code: "FR", name: "France" }, { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" }, { code: "GE", name: "Georgia" }, { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" }, { code: "GR", name: "Greece" }, { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" }, { code: "GN", name: "Guinea" }, { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" }, { code: "HT", name: "Haiti" }, { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" }, { code: "IS", name: "Iceland" }, { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" }, { code: "IR", name: "Iran" }, { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" }, { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" }, { code: "JP", name: "Japan" }, { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" }, { code: "KE", name: "Kenya" }, { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" }, { code: "KG", name: "Kyrgyzstan" }, { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" }, { code: "LB", name: "Lebanon" }, { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" }, { code: "LY", name: "Libya" }, { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" }, { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" }, { code: "MY", name: "Malaysia" }, { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" }, { code: "MT", name: "Malta" }, { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" }, { code: "MU", name: "Mauritius" }, { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" }, { code: "MD", name: "Moldova" }, { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" }, { code: "ME", name: "Montenegro" }, { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" }, { code: "MM", name: "Myanmar" }, { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" }, { code: "NP", name: "Nepal" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NI", name: "Nicaragua" }, { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" }, { code: "KP", name: "North Korea" }, { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" }, { code: "OM", name: "Oman" }, { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" }, { code: "PS", name: "Palestine" }, { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" }, { code: "PY", name: "Paraguay" }, { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" }, { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" }, { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" }, { code: "KN", name: "Saint Kitts and Nevis" }, { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" }, { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" }, { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" }, { code: "SN", name: "Senegal" }, { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" }, { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" }, { code: "SI", name: "Slovenia" }, { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" }, { code: "ZA", name: "South Africa" }, { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" }, { code: "ES", name: "Spain" }, { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" }, { code: "SR", name: "Suriname" }, { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" }, { code: "SY", name: "Syria" }, { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" }, { code: "TZ", name: "Tanzania" }, { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" }, { code: "TG", name: "Togo" }, { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" }, { code: "TN", name: "Tunisia" }, { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" }, { code: "TV", name: "Tuvalu" }, { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" }, { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" }, { code: "UZ", name: "Uzbekistan" }, { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" }, { code: "VE", name: "Venezuela" }, { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" }, { code: "ZM", name: "Zambia" }, { code: "ZW", name: "Zimbabwe" },
];

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap">
        {children}
      </h2>
      <div className="flex-1 h-[1px] bg-border/25" />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function StatusBadgeKyc({ status }: { status?: string }) {
  if (status === "verified") {
    return (
      <Badge className="gap-1 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10">
        <BadgeCheck className="w-3 h-3" /> Verified Member
      </Badge>
    );
  }
  if (status === "in_review") {
    return (
      <Badge className="gap-1 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/10">
        <Clock className="w-3 h-3" /> KYC In Review
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 text-[10px] font-mono bg-muted/40 text-muted-foreground border border-border/40 hover:bg-muted/40">
      <AlertCircle className="w-3 h-3" /> KYC Pending
    </Badge>
  );
}

// ─── Disable Account Modal ─────────────────────────────────────────────────────

function DisableAccountModal({
  open, onConfirm, onCancel, loading,
}: { open: boolean; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-scale-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Disable Account</h3>
          <p className="text-sm text-muted-foreground">Are you sure you want to disable your account?</p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Your account will be temporarily disabled and you won't be able to log in or use most features.
          </p>
        </div>
        <div className="space-y-2">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold h-10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Disable Account"}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full font-mono text-xs text-muted-foreground hover:text-foreground h-10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Close Account Modal ───────────────────────────────────────────────────────

function CloseAccountModal({
  open, onConfirm, onCancel, loading,
}: { open: boolean; onConfirm: (otp: string) => void; onCancel: () => void; loading: boolean }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Request OTP when modal opens
  useEffect(() => {
    if (!open) { setOtp(["","","","","",""]); setOtpSent(false); setCountdown(0); return; }
    api.post("/api/auth/close/request-otp")
      .then((r) => { setOtpSent(true); setCountdown(r.data?.expiresIn ?? 120); })
      .catch(() => setOtpSent(true));
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const resendOtp = () => {
    setOtp(["","","","","",""]);
    api.post("/api/auth/close/request-otp")
      .then((r) => setCountdown(r.data?.expiresIn ?? 120))
      .catch(() => {});
  };

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const code = otp.join("");

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-scale-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <X className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Close Account</h3>
          <p className="text-sm text-muted-foreground">
            {otpSent ? "Enter the OTP sent to your email." : "Sending OTP to your email…"}
          </p>
        </div>
        {countdown > 0 && (
          <p className="text-center text-xs font-mono text-muted-foreground">
            {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
          </p>
        )}
        {otpSent && countdown === 0 && (
          <p className="text-center text-xs font-mono text-muted-foreground">
            Didn't receive a code?{" "}
            <button onClick={resendOtp} className="text-primary hover:underline">Resend Code</button>
          </p>
        )}
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-10 h-12 text-center text-lg font-bold bg-muted/40 border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          ))}
        </div>
        <div className="space-y-2">
          <Button
            onClick={() => onConfirm(code)}
            disabled={loading || code.length < 6}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-bold h-10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Close Account"}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full font-mono text-xs text-muted-foreground hover:text-foreground h-10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}


// ─── User Info Section ─────────────────────────────────────────────────────────

function UserInfoSection({
  profile, onProfileUpdate, avatarPublicUrl,
}: {
  profile: UserProfile;
  onProfileUpdate: (updated: Partial<UserProfile>) => void;
  avatarPublicUrl: string | null;
}) {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const qc = useQueryClient();
  const isKycVerified = profile.kycStatus === "verified";
  const [form, setForm] = useState({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    phone: profile.phoneNumber || profile.phone || "",
    country: profile.country || "",
    currency: profile.currency || Currency.USD,
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.phoneNumber || profile.phone || "",
      country: profile.country || "",
      currency: profile.currency || Currency.USD,
    });
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: any) => api.patch("/api/auth/prepare-account", data),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      const updatedUser = {
        ...user!,
        firstName: form.firstName,
        lastName: form.lastName,
        avatarUrl: avatarPublicUrl || user?.avatarUrl,
      };
      setAuth(accessToken, refreshToken, updatedUser);
      onProfileUpdate({ firstName: form.firstName, lastName: form.lastName, avatarUrl: avatarPublicUrl || profile.avatarUrl });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || profile.phoneNumber || profile.phone || "+1",
      country: form.country || profile.country || "US",
      currency: form.currency,
      avatarUrl: avatarPublicUrl || undefined,
    });
  };

  return (
    <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/20">
        <h2 className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest">
          Personal Details
        </h2>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>First Name</FieldLabel>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="bg-muted/20 border-border/50 h-9 text-sm"
                  placeholder="John"
                  disabled={isKycVerified}
                />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="bg-muted/20 border-border/50 h-9 text-sm"
                  placeholder="Doe"
                  disabled={isKycVerified}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Email Address</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <Input
                  value={profile.email}
                  disabled
                  className="pl-9 bg-muted/10 border-border/30 h-9 text-sm opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">Email address cannot be changed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Country / Region</FieldLabel>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
                  <Select
                    value={form.country}
                    onChange={(e) => {
                      const countryName = e.target.value;
                      const dialCode = countryDialCodes[countryName] || "";
                      setForm(f => ({
                        ...f,
                        country: countryName,
                        phone: dialCode ? `${dialCode} ` : ""
                      }));
                    }}
                    className="pl-9 bg-muted/20 border-border/50 h-9 text-sm"
                    disabled={isKycVerified}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </Select>
                </div>
              </div>

              <div>
                <FieldLabel>Mobile Number</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="pl-9 bg-muted/20 border-border/50 h-9 text-sm"
                    placeholder="+1 555 000 0000"
                    disabled={isKycVerified}
                  />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Preferred Currency</FieldLabel>
              <Select
                value={form.currency}
                onChange={(e) => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                className="bg-muted/20 border-border/50 h-9 text-sm"
                disabled={isKycVerified}
              >
                {Object.entries(Currency).map(([k, v]) => (
                  <option key={v} value={v}>{k}</option>
                ))}
              </Select>
            </div>

            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Profile updated successfully.
              </div>
            )}

            {mutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(mutation.error as any)?.response?.data?.message || "Failed to update profile."}
              </div>
            )}

            {isKycVerified ? (
              <p className="text-[11px] font-mono text-muted-foreground/50 text-right pt-2">
                * Personal details cannot be changed once KYC is verified.
              </p>
            ) : (
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="font-mono text-xs font-bold h-9 px-6"
                >
                  {mutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...</> : "Update Profile"}
                </Button>
              </div>
            )}
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Security Section ──────────────────────────────────────────────────────────

function SecuritySection({
  onNavigate,
}: { onNavigate: (s: ProfileSection) => void }) {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [requirePasscode, setRequirePasscode] = useState(true);

  return (
    <div className="space-y-6">
      <SectionHeading>Security Settings</SectionHeading>

      {/* Toggles */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/20">
          {[
            {
              icon: Fingerprint,
              label: "Two-Factor Authentication",
              desc: "Add an extra layer of security to your account",
              checked: twoFaEnabled,
              toggle: () => setTwoFaEnabled(v => !v),
              color: "text-blue-400",
            },
            {
              icon: Shield,
              label: "Require Passcode",
              desc: "Require a passcode on every login",
              checked: requirePasscode,
              toggle: () => setRequirePasscode(v => !v),
              color: "text-violet-400",
            },
          ].map(({ icon: Icon, label, desc, checked, toggle, color }) => (
            <div key={label} className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0", color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </div>
              <button
                onClick={toggle}
                className={cn(
                  "relative w-10 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 cursor-pointer",
                  checked ? "bg-primary" : "bg-muted/60"
                )}
                style={{ height: "22px" }}
                aria-checked={checked}
                role="switch"
              >
                <span
                  className={cn(
                    "block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                    checked ? "translate-x-5" : "translate-x-1"
                  )}
                  style={{ marginTop: "3px" }}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* OTP Auth info */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
            Login Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Email OTP</p>
                <p className="text-[11px] text-muted-foreground">Passwordless — a one-time code is sent to your email</p>
              </div>
            </div>
            <Badge className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <SectionHeading>Device & Activity</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Smartphone, label: "My Devices", desc: "Manage connected devices", section: "devices" as ProfileSection, color: "text-sky-400" },
          { icon: Activity, label: "Account Activities", desc: "Monitor login history", section: "activities" as ProfileSection, color: "text-violet-400" },
          { icon: AlertTriangle, label: "Manage Account", desc: "Disable or close account", section: "account" as ProfileSection, color: "text-red-400" },
        ].map(({ icon: Icon, label, desc, section, color }) => (
          <button
            key={section}
            onClick={() => onNavigate(section)}
            className="flex items-start gap-3 p-4 rounded-xl bg-card/30 border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left"
          >
            <div className={cn("w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mt-0.5", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1 ml-auto" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Devices Section ───────────────────────────────────────────────────────────

function DevicesSection() {
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery<DeviceSession[]>({
    queryKey: ["user-sessions"],
    queryFn: () => api.get("/api/auth/sessions").then(r => r.data).catch(() => []),
  });

  const logoutDevice = useMutation({
    mutationFn: (id: string) => api.delete(`/api/auth/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-sessions"] }),
  });

  const logoutAll = useMutation({
    mutationFn: () => api.delete("/api/auth/sessions"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-sessions"] }),
  });

  const getDeviceIcon = (info?: string) => {
    const s = info?.toLowerCase() ?? "";
    if (s.includes("mobile") || s.includes("android") || s.includes("iphone")) return Smartphone;
    if (s.includes("tablet") || s.includes("ipad")) return Tablet;
    return Monitor;
  };

  const parseDeviceName = (info?: string) => {
    if (!info) return "Unknown Device";
    if (info.toLowerCase().includes("mobile") || info.toLowerCase().includes("android")) return "Mobile Device";
    if (info.toLowerCase().includes("iphone")) return "iPhone";
    if (info.toLowerCase().includes("ipad")) return "iPad";
    if (info.toLowerCase().includes("mac")) return "Mac";
    if (info.toLowerCase().includes("windows")) return "Windows PC";
    return "Web Browser";
  };

  return (
    <div className="space-y-6">
      <SectionHeading>My Devices</SectionHeading>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-mono text-muted-foreground">No active sessions found</p>
            <p className="text-xs text-muted-foreground/60">This endpoint may not be available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {sessions.map((session, idx) => {
            const Icon = getDeviceIcon(session.deviceInfo);
            return (
              <Card key={session.id} className={cn("bg-card/30 border-border/40 backdrop-blur-sm", session.isCurrent && "border-primary/30")}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        session.isCurrent ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {parseDeviceName(session.deviceInfo) || `Device ${idx + 1}`}
                          </p>
                          {session.isCurrent && (
                            <Badge className="text-[9px] font-mono bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 px-1.5 py-0">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {session.createdAt && (
                            <p className="text-[11px] text-muted-foreground font-mono">
                              First Login: <span className="text-foreground/70">{new Date(session.createdAt).toLocaleString()}</span>
                            </p>
                          )}
                          {session.ipAddress && (
                            <p className="text-[11px] text-muted-foreground font-mono">
                              IP Address: <span className="text-foreground/70">{session.ipAddress}</span>
                            </p>
                          )}
                          {session.deviceInfo && (
                            <p className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                              Agent: <span className="text-foreground/70">{session.deviceInfo}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logoutDevice.mutate(session.jti)}
                        disabled={logoutDevice.isPending}
                        className="font-mono text-xs h-7 px-2.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 shrink-0"
                      >
                        Log Out
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={() => logoutAll.mutate()}
            disabled={logoutAll.isPending}
            className="w-full font-mono text-xs font-bold h-10 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            {logoutAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
              <LogOut className="w-3.5 h-3.5 mr-2" /> Log Out From All Devices
            </>}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Activities Section ────────────────────────────────────────────────────────

function ActivitiesSection() {
  const [tab, setTab] = useState<"login" | "security">("login");

  const { data: activities = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["user-activities", tab],
    queryFn: () =>
      api.get("/api/auth/activities", { params: { type: tab } })
        .then(r => r.data)
        .catch(() => []),
  });

  const statusColor = (status?: string) => {
    if (status === "completed") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "failed") return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <div className="space-y-5">
      <SectionHeading>Account Activities</SectionHeading>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["login", "security"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wide transition-all",
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60"
            )}
          >
            {t === "login" ? <LogOut className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
        <button
          onClick={() => {}}
          className="ml-auto p-2 rounded-lg bg-card/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60 transition-all"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : activities.length === 0 ? (
        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center">
              <Activity className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-mono text-muted-foreground">No activity logs found</p>
            <p className="text-xs text-muted-foreground/60">Activity logging may not be available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map(log => (
            <Card key={log.id} className="bg-card/30 border-border/40 backdrop-blur-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground capitalize">
                        {log.action || (log.type === "security" ? "Security Event" : "Login")}
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                        {log.createdAt && (
                          <p className="text-[11px] font-mono text-muted-foreground">
                            Date: <span className="text-foreground/70">{new Date(log.createdAt).toLocaleString()}</span>
                          </p>
                        )}
                        {log.source && (
                          <p className="text-[11px] font-mono text-muted-foreground">
                            Source: <span className="text-foreground/70">{log.source}</span>
                          </p>
                        )}
                        {log.ipAddress && (
                          <p className="text-[11px] font-mono text-muted-foreground">
                            IP Address: <span className="text-foreground/70">{log.ipAddress}</span>
                          </p>
                        )}
                        {log.description && (
                          <p className="text-[11px] font-mono text-muted-foreground">
                            Activity: <span className="text-foreground/70">{log.description}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {log.status && (
                    <Badge className={cn("text-[9px] font-mono capitalize shrink-0 border", statusColor(log.status))}>
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                      {log.status}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Account Section ───────────────────────────────────────────────────────────

function AccountSection() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDisable, setShowDisable] = useState(false);
  const [showClose, setShowClose] = useState(false);

  const disableMutation = useMutation({
    mutationFn: () => api.post("/api/auth/disable"),
    onSuccess: () => { logout(); navigate("/login"); },
  });

  const closeMutation = useMutation({
    mutationFn: (otp: string) => api.post("/api/auth/close", { otp }),
    onSuccess: () => { logout(); navigate("/login"); },
  });

  return (
    <>
      <DisableAccountModal
        open={showDisable}
        onConfirm={() => disableMutation.mutate()}
        onCancel={() => setShowDisable(false)}
        loading={disableMutation.isPending}
      />
      <CloseAccountModal
        open={showClose}
        onConfirm={(otp) => closeMutation.mutate(otp)}
        onCancel={() => setShowClose(false)}
        loading={closeMutation.isPending}
      />

      <div className="space-y-6">
        <SectionHeading>Manage Account</SectionHeading>

        <p className="text-xs font-mono text-muted-foreground">
          Manage your account and security settings.
        </p>

        <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
          <CardContent className="pt-4 space-y-0 divide-y divide-border/20">
            <button
              onClick={() => setShowDisable(true)}
              className="w-full flex items-center justify-between py-4 group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-amber-400 transition-colors">Disable Account</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Temporarily disable your account. You can reactivate it anytime.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-amber-400 transition-colors shrink-0" />
            </button>

            <button
              onClick={() => setShowClose(true)}
              className="w-full flex items-center justify-between py-4 group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors">Close Account</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Delete your account and all associated data permanently.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-red-400 transition-colors shrink-0" />
            </button>
          </CardContent>
        </Card>

        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <p className="text-[11px] font-mono text-red-400/80 leading-relaxed">
            <strong className="text-red-400">Warning:</strong> Closing your account is permanent and irreversible. All your data,
            portfolio history, and settings will be deleted. This action cannot be undone.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── KYC Section ──────────────────────────────────────────────────────────────

export function KycSection({ profile }: { profile: UserProfile }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <SectionHeading>Identity Verification</SectionHeading>

      <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
        <CardContent className="pt-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
              profile.kycStatus === "verified" ? "bg-emerald-500/10" : "bg-amber-500/10"
            )}>
              <BadgeCheck className={cn("w-7 h-7", profile.kycStatus === "verified" ? "text-emerald-400" : "text-amber-400")} />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">KYC Verification</p>
              <StatusBadgeKyc status={profile.kycStatus} />
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Identity Document", done: profile.kycStatus !== "pending" },
              { label: "Address Verification", done: profile.kycStatus === "verified" },
              { label: "Selfie with Document", done: profile.kycStatus === "verified" },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                  done ? "bg-emerald-500/20" : "bg-muted/40"
                )}>
                  {done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <Clock className="w-3 h-3 text-muted-foreground/40" />
                  }
                </div>
                <span className={cn("text-xs font-mono", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </div>
            ))}
          </div>

          {profile.kycStatus === "pending" && (
            <Button
              onClick={() => navigate("/login")}
              className="w-full font-mono text-xs font-bold h-9"
            >
              Start Verification
            </Button>
          )}
          {profile.kycStatus === "in_review" && (
            <p className="text-xs font-mono text-center text-amber-400/80 p-3 bg-amber-500/5 rounded-lg border border-amber-500/15">
              Your documents are under review. This usually takes 1–3 business days.
            </p>
          )}
          {profile.kycStatus === "verified" && (
            <p className="text-xs font-mono text-center text-emerald-400/80 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/15">
              Your identity is fully verified. You have access to all platform features.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Profile Component ────────────────────────────────────────────────────

const NAV_ITEMS: { section: ProfileSection; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { section: "info",       label: "User Info",    desc: "Personal details and profile data",  icon: User },
  { section: "security",   label: "Security",     desc: "Protect your account and assets",    icon: Shield },
  { section: "devices",    label: "Devices",      desc: "Manage connected devices",           icon: Smartphone },
  { section: "activities", label: "Activities",   desc: "View login and security history",    icon: Activity },
  { section: "account",    label: "Manage Account", desc: "Account settings and closure",     icon: AlertTriangle },
];

export function Profile() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<ProfileSection>("info");

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: () => api.get("/api/auth/me").then(r => r.data),
    // placeholderData pre-fills the UI from the auth store but always fires the real fetch,
    // unlike initialData which tells React Query the cache is already fresh and skips the network call.
    placeholderData: user
      ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, kycStatus: user.kycStatus, avatarUrl: user.avatarUrl, role: user.role }
      : undefined,
  });

  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const displayProfile = localProfile ?? profile ?? (user ? { email: user.email, kycStatus: user.kycStatus, avatarUrl: user.avatarUrl } : null);

  // Avatar state lifted here so sidebar camera button and UserInfoSection share it
  const [avatarPreview, setAvatarPreview] = useState<string | null>(displayProfile?.avatarUrl || null);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(displayProfile?.avatarUrl || null);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { upload: uploadAvatar, isUploading: isUploadingAvatar } = useFileUpload({
    folder: UploadFolder.AVATARS,
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    maxSizeBytes: 5 * 1024 * 1024,
  });

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);
    setAvatarPublicUrl(null);
    setAvatarImgError(false);
    const uploadResult = await uploadAvatar(file);
    if (uploadResult) {
      setAvatarPublicUrl(uploadResult.publicUrl);
    } else {
      URL.revokeObjectURL(localPreviewUrl);
      setAvatarPreview(displayProfile?.avatarUrl || null);
    }
  }, [uploadAvatar, displayProfile?.avatarUrl]);

  useEffect(() => {
    if (displayProfile?.avatarUrl && !avatarPreview) {
      setAvatarPreview(displayProfile.avatarUrl);
      setAvatarPublicUrl(displayProfile.avatarUrl);
    }
  }, [displayProfile?.avatarUrl]);

  if (!displayProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const fullName = [displayProfile.firstName, displayProfile.lastName].filter(Boolean).join(" ") || displayProfile.email?.split("@")[0] || "User";

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1 font-mono text-[11px] uppercase tracking-wider">
          Manage your personal information, security, and account settings.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left sidebar ── */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Profile card */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm overflow-hidden">
            {/* Gradient header */}
            <div className="h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="pb-5">
              <div className="-mt-8 flex flex-col items-center text-center gap-2">
                {/* Avatar with camera button */}
                <div className="relative ring-4 ring-card rounded-full">
                  {isLoading ? (
                    <div className="w-16 h-16 rounded-full bg-muted/40 animate-pulse" />
                  ) : (
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      {avatarPreview && !avatarImgError ? (
                        <img src={avatarPreview} alt="" className="w-full h-full object-cover"
                          onError={() => setAvatarImgError(true)} />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                          {displayProfile.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                    </div>
                  )}
                  {displayProfile.kycStatus !== "verified" && (
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-md hover:bg-primary/90 transition-colors"
                    >
                      {isUploadingAvatar
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Camera className="w-3 h-3" />
                      }
                    </button>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{fullName}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{displayProfile.email}</p>
                </div>
                <StatusBadgeKyc status={displayProfile.kycStatus} />
              </div>
            </CardContent>
          </Card>

          {/* Nav */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm">
            <CardContent className="pt-3 pb-2 px-2">
              <nav className="space-y-0.5">
                {NAV_ITEMS.map(({ section, label, desc, icon: Icon }) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                      activeSection === section
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight truncate">{label}</p>
                      <p className="text-[10px] text-muted-foreground/70 leading-tight mt-0.5 truncate">{desc}</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-opacity",
                      activeSection === section ? "opacity-100" : "opacity-0"
                    )} />
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

        </aside>

        {/* ── Right content ── */}
        <main className="flex-1 min-w-0">
          {activeSection === "info" && (
            <UserInfoSection
              profile={displayProfile}
              onProfileUpdate={(updated) => setLocalProfile(p => p ? { ...p, ...updated } : { ...displayProfile, ...updated })}
              avatarPublicUrl={avatarPublicUrl}
            />
          )}
          {activeSection === "security" && (
            <SecuritySection onNavigate={setActiveSection} />
          )}
          {activeSection === "devices" && <DevicesSection />}
          {activeSection === "activities" && <ActivitiesSection />}
          {activeSection === "account" && <AccountSection />}
        </main>
      </div>
    </div>
  );
}
