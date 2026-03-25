import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Smartphone,
  User,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import { Label } from "@/app/components/ui/label";

interface AuthScreenProps {
  onAuthenticated: (user: {
    name: string;
    email: string;
    token: string;
    role: "user" | "admin";
  }) => void;
  onBack: () => void;
}

type AuthTab = "login" | "register" | "reset";
type VerificationMethod = "email" | "sms";

const PASSWORD_RULES = [
  { key: "minLength", label: "Minimum 8 characters" },
  { key: "uppercase", label: "At least one uppercase letter" },
  { key: "lowercase", label: "At least one lowercase letter" },
  { key: "number", label: "At least one number" },
  { key: "special", label: "At least one special character" },
  { key: "match", label: "Passwords must match" },
] as const;

const OTP_TTL_SECONDS = 10 * 60;
const OTP_MAX_ATTEMPTS = 3;
const OTP_RESEND_SECONDS = 60;

const evaluatePasswordRules = (password: string, confirmPassword: string) => ({
  minLength: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
  match: password.length > 0 && password === confirmPassword,
});

const fieldClassName =
  "h-11 rounded-2xl border-border/70 bg-background shadow-none transition-colors focus-visible:ring-[3px] focus-visible:ring-[var(--focus-light)]";
const fieldWithLeadingIconClassName = `${fieldClassName} pl-10`;
const fieldWithTwoIconsClassName = `${fieldClassName} pl-10 pr-10`;
const primaryButtonClassName =
  "h-11 w-full rounded-2xl border-0 bg-[var(--focus-primary)] text-white shadow-[0_10px_30px_rgba(91,124,153,0.28)] hover:opacity-95";
const tabButtonClassName =
  "rounded-xl px-3 py-2 text-sm font-medium transition";

export function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const buildApiUrl = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerMethod, setRegisterMethod] = useState<VerificationMethod>("email");
  const [registerStep, setRegisterStep] = useState<"form" | "otp">("form");
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerAttemptsLeft, setRegisterAttemptsLeft] = useState(3);
  const [registerResendSeconds, setRegisterResendSeconds] = useState(0);
  const [registerOtpExpiresAt, setRegisterOtpExpiresAt] = useState<number | null>(null);

  const [resetEmail, setResetEmail] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetMethod, setResetMethod] = useState<VerificationMethod>("email");
  const [resetStep, setResetStep] = useState<"form" | "otp">("form");
  const [resetOtp, setResetOtp] = useState("");
  const [resetAttemptsLeft, setResetAttemptsLeft] = useState(3);
  const [resetResendSeconds, setResetResendSeconds] = useState(0);
  const [resetOtpExpiresAt, setResetOtpExpiresAt] = useState<number | null>(null);
  const [otpNow, setOtpNow] = useState(Date.now());

  useEffect(() => {
    const hasActiveOtp =
      registerStep === "otp" ||
      resetStep === "otp" ||
      registerResendSeconds > 0 ||
      resetResendSeconds > 0;
    if (!hasActiveOtp) return;
    const timer = window.setInterval(() => setOtpNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [registerStep, resetStep, registerResendSeconds, resetResendSeconds]);

  useEffect(() => {
    if (registerResendSeconds <= 0) return;
    const timer = window.setInterval(
      () => setRegisterResendSeconds((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [registerResendSeconds]);

  useEffect(() => {
    if (resetResendSeconds <= 0) return;
    const timer = window.setInterval(
      () => setResetResendSeconds((prev) => (prev > 0 ? prev - 1 : 0)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [resetResendSeconds]);

  const registerRules = useMemo(
    () => evaluatePasswordRules(registerPassword, registerConfirmPassword),
    [registerPassword, registerConfirmPassword]
  );
  const resetRules = useMemo(
    () => evaluatePasswordRules(resetPassword, resetConfirmPassword),
    [resetPassword, resetConfirmPassword]
  );
  const allRegisterRulesMet = Object.values(registerRules).every(Boolean);
  const allResetRulesMet = Object.values(resetRules).every(Boolean);
  const registerCanSubmit =
    registerName.trim().length > 0 &&
    registerEmail.trim().length > 0 &&
    (registerMethod === "email" || registerPhone.trim().length > 0) &&
    allRegisterRulesMet;
  const resetCanSubmit =
    ((resetMethod === "email" && resetEmail.trim().length > 0) ||
      (resetMethod === "sms" && resetPhone.trim().length > 0)) &&
    allResetRulesMet;
  const registerExpiresIn = registerOtpExpiresAt
    ? Math.max(0, Math.floor((registerOtpExpiresAt - otpNow) / 1000))
    : 0;
  const resetExpiresIn = resetOtpExpiresAt
    ? Math.max(0, Math.floor((resetOtpExpiresAt - otpNow) / 1000))
    : 0;

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const postJson = async (path: string, payload: Record<string, unknown>) => {
    const response = await fetch(buildApiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data?.error?.message || data?.message || "Server error") as Error & {
        code?: string;
      };
      err.code = data?.error?.code;
      throw err;
    }
    return data;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const normalizedEmail = loginEmail.trim();
      const data = await postJson("/api/auth/login", {
        email: normalizedEmail,
        password: loginPassword,
      });
      const token = data.token || data.accessToken;
      if (!token) throw new Error("Missing auth token.");
      const authenticatedUser = {
        name: data.user?.name ?? "User",
        email: data.user?.email ?? normalizedEmail,
        token,
        role: data.user?.role ?? "user",
      };
      setSuccess("Login successful!");
      setTimeout(() => onAuthenticated(authenticatedUser), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearFeedback();
    if (!registerCanSubmit) {
      setError("Complete all password conditions and required fields.");
      return;
    }
    setLoading(true);
    try {
      const data = await postJson("/api/auth/register/initiate", {
        name: registerName.trim(),
        email: registerEmail.trim(),
        phone: registerPhone.trim() || undefined,
        password: registerPassword,
        method: registerMethod,
      });
      setRegisterStep("otp");
      setRegisterOtp("");
      setRegisterAttemptsLeft(OTP_MAX_ATTEMPTS);
      setRegisterResendSeconds(OTP_RESEND_SECONDS);
      setRegisterOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setSuccess(typeof data?.message === "string" ? data.message : "Verification code sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerify = async () => {
    clearFeedback();
    if (registerOtp.length !== 6) return setError("Enter the 6-digit verification code.");
    if (registerAttemptsLeft <= 0) return setError("Too many failed attempts. Resend a new code.");
    setLoading(true);
    try {
      const data = await postJson("/api/auth/register/verify", {
        email: registerEmail.trim(),
        phone: registerMethod === "sms" ? registerPhone.trim() : undefined,
        method: registerMethod,
        otp: registerOtp,
      });
      const token = data.token || data.accessToken;
      if (!token) throw new Error("Missing auth token.");
      const authenticatedUser = {
        name: data.user?.name ?? registerName,
        email: data.user?.email ?? registerEmail,
        token,
        role: data.user?.role ?? "user",
      };
      setSuccess("Account verified successfully.");
      setTimeout(() => onAuthenticated(authenticatedUser), 700);
    } catch (err) {
      const code = err instanceof Error && "code" in err ? (err as { code?: string }).code : "";
      if (code === "INVALID_OTP") setRegisterAttemptsLeft((prev) => Math.max(0, prev - 1));
      if (code === "OTP_LOCKED") setRegisterAttemptsLeft(0);
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterResend = async () => {
    clearFeedback();
    if (registerResendSeconds > 0) return;
    setLoading(true);
    try {
      const data = await postJson("/api/auth/register/initiate", {
        name: registerName.trim(),
        email: registerEmail.trim(),
        phone: registerPhone.trim() || undefined,
        password: registerPassword,
        method: registerMethod,
      });
      setRegisterOtp("");
      setRegisterAttemptsLeft(OTP_MAX_ATTEMPTS);
      setRegisterResendSeconds(OTP_RESEND_SECONDS);
      setRegisterOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setSuccess(typeof data?.message === "string" ? data.message : "Verification code sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearFeedback();
    if (!resetCanSubmit) {
      setError("Complete all password conditions and required fields.");
      return;
    }
    setLoading(true);
    try {
      const data = await postJson("/api/auth/password-reset/request", {
        email: resetMethod === "email" ? resetEmail.trim() : undefined,
        phone: resetMethod === "sms" ? resetPhone.trim() : undefined,
        method: resetMethod,
      });
      setResetStep("otp");
      setResetOtp("");
      setResetAttemptsLeft(OTP_MAX_ATTEMPTS);
      setResetResendSeconds(OTP_RESEND_SECONDS);
      setResetOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setSuccess(typeof data?.message === "string" ? data.message : "Verification code sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerify = async () => {
    clearFeedback();
    if (resetOtp.length !== 6) return setError("Enter the 6-digit verification code.");
    if (resetAttemptsLeft <= 0) return setError("Too many failed attempts. Resend a new code.");
    setLoading(true);
    try {
      await postJson("/api/auth/password-reset/verify", {
        email: resetMethod === "email" ? resetEmail.trim() : undefined,
        phone: resetMethod === "sms" ? resetPhone.trim() : undefined,
        method: resetMethod,
        otp: resetOtp,
        newPassword: resetPassword,
      });
      setSuccess("Password updated successfully. Sign in with your new password.");
      setResetStep("form");
      setResetOtp("");
      setActiveTab("login");
    } catch (err) {
      const code = err instanceof Error && "code" in err ? (err as { code?: string }).code : "";
      if (code === "INVALID_OTP") setResetAttemptsLeft((prev) => Math.max(0, prev - 1));
      if (code === "OTP_LOCKED") setResetAttemptsLeft(0);
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetResend = async () => {
    clearFeedback();
    if (resetResendSeconds > 0) return;
    setLoading(true);
    try {
      const data = await postJson("/api/auth/password-reset/request", {
        email: resetMethod === "email" ? resetEmail.trim() : undefined,
        phone: resetMethod === "sms" ? resetPhone.trim() : undefined,
        method: resetMethod,
      });
      setResetOtp("");
      setResetAttemptsLeft(OTP_MAX_ATTEMPTS);
      setResetResendSeconds(OTP_RESEND_SECONDS);
      setResetOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setSuccess(typeof data?.message === "string" ? data.message : "Verification code sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Server error");
    } finally {
      setLoading(false);
    }
  };

  const headingText = activeTab === "register" ? "Create Account" : activeTab === "reset" ? "Reset Password" : "Log In";
  const subtitleText =
    activeTab === "register"
      ? "Create your account and verify it in a single streamlined flow."
      : activeTab === "reset"
        ? "Reset your password with a compact verification step."
        : "Welcome back. Sign in to continue where you left off.";

  const renderAlert = () => (
    <>
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </>
  );

  const renderPasswordRules = (rules: Record<string, boolean>) => (
      <div className="rounded-2xl border border-border/70 p-3" style={{ backgroundColor: "var(--focus-light)" }}>
        <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Password checks</p>
        <span className="text-xs text-muted-foreground">{Object.values(rules).filter(Boolean).length}/{PASSWORD_RULES.length}</span>
      </div>
      <div className="grid gap-x-3 gap-y-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => (
          <div key={rule.key} className={`flex items-center gap-2 text-xs ${rules[rule.key] ? "text-foreground" : "text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${rules[rule.key] ? "bg-[var(--focus-primary)]" : "bg-[var(--break-secondary)]"}`} />
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOtpPanel = (
    otpValue: string,
    setOtpValue: (value: string) => void,
    expiresIn: number,
    attemptsLeft: number,
    resendSeconds: number,
    helperText: string,
    onVerify: () => void,
    onBackClick: () => void,
    onResendClick: () => void
  ) => (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h3 className="text-lg font-semibold text-foreground">Enter verification code</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {helperText} Expires in {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}.
        </p>
      </div>
      <div className="rounded-2xl border border-border/70 p-4" style={{ backgroundColor: "var(--focus-light)" }}>
        <InputOTP
          maxLength={6}
          value={otpValue}
          onChange={setOtpValue}
          disabled={loading || attemptsLeft <= 0 || expiresIn <= 0}
          containerClassName="justify-center gap-2"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Attempts left: {attemptsLeft}</span>
          <span>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Ready to resend"}</span>
        </div>
      </div>
      <Button
        type="button"
        className={primaryButtonClassName}
        onClick={onVerify}
        disabled={loading || otpValue.length !== 6 || attemptsLeft <= 0 || expiresIn <= 0}
      >
        {loading ? "Verifying..." : "Verify Code"}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" className="font-medium text-muted-foreground hover:text-foreground disabled:opacity-50" onClick={onBackClick} disabled={loading}>
          Back
        </button>
        <button type="button" className="font-medium disabled:opacity-50" style={{ color: "var(--focus-primary)" }} onClick={onResendClick} disabled={loading || resendSeconds > 0}>
          {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, var(--focus-primary) 0%, transparent 45%), radial-gradient(circle at 80% 80%, var(--break-primary) 0%, transparent 40%), linear-gradient(180deg, #f9fbfd 0%, #f4f7fb 100%)",
        }}
      />
      <div className="relative z-10 w-full max-w-lg">
        <button
          onClick={onBack}
          className="mx-auto mb-4 flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-white"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--focus-light)", color: "var(--focus-primary)" }}>
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">Focus Space</span>
        </button>

        <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{headingText}</h1>
                <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">{subtitleText}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl p-1.5" style={{ backgroundColor: "var(--focus-light)" }}>
                {(["login", "register", "reset"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`${tabButtonClassName} ${activeTab === tab ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    style={activeTab === tab ? { color: "var(--focus-primary)" } : undefined}
                    onClick={() => {
                      setActiveTab(tab);
                      clearFeedback();
                    }}
                  >
                    {tab === "login" ? "Sign in" : tab === "register" ? "Sign up" : "Reset"}
                  </button>
                ))}
              </div>
              {activeTab !== "reset" && (
                <div className="text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    className="font-medium underline-offset-4 hover:underline"
                    style={{ color: "var(--focus-primary)" }}
                    onClick={() => {
                      setActiveTab(activeTab === "login" ? "reset" : "login");
                      clearFeedback();
                    }}
                  >
                    {activeTab === "login" ? "Forgot password?" : "Back to sign in"}
                  </button>
                </div>
              )}
            </div>

            {renderAlert()}

            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required disabled={loading} className={fieldWithLeadingIconClassName} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required disabled={loading} className={fieldWithTwoIconsClassName} />
                      <button type="button" aria-label={showLoginPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowLoginPassword((prev) => !prev)}>
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button type="submit" className={primaryButtonClassName} disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            {activeTab === "register" && registerStep === "form" && (
              <form onSubmit={handleRegisterInitiate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="register-name" className="text-sm font-medium text-slate-700">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-name" type="text" placeholder="John Doe" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required disabled={loading} className={fieldWithLeadingIconClassName} />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="register-email" className="text-sm font-medium text-slate-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-email" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required disabled={loading} className={fieldWithLeadingIconClassName} />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="register-phone" className="text-sm font-medium text-slate-700">Phone</Label>
                      <span className="text-xs text-slate-400">Required only for SMS</span>
                    </div>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-phone" type="tel" placeholder="+1 555 123 4567" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} disabled={loading} className={fieldWithLeadingIconClassName} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-password" className="text-sm font-medium text-slate-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-password" type={showRegisterPassword ? "text" : "password"} placeholder="Create password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required disabled={loading} className={fieldWithTwoIconsClassName} />
                      <button type="button" aria-label={showRegisterPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowRegisterPassword((prev) => !prev)}>
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-confirm-password" className="text-sm font-medium text-slate-700">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="register-confirm-password" type={showRegisterConfirmPassword ? "text" : "password"} placeholder="Repeat password" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} required disabled={loading} className={fieldWithTwoIconsClassName} />
                      <button type="button" aria-label={showRegisterConfirmPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}>
                        {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {renderPasswordRules(registerRules)}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Verification method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" className={registerMethod === "email" ? "h-10 rounded-2xl border-transparent text-white hover:opacity-95" : "h-10 rounded-2xl border-border/70 bg-white text-muted-foreground hover:bg-background hover:text-foreground"} style={registerMethod === "email" ? { backgroundColor: "var(--focus-primary)" } : undefined} onClick={() => setRegisterMethod("email")} disabled={loading}>Email</Button>
                    <Button type="button" variant="outline" className={registerMethod === "sms" ? "h-10 rounded-2xl border-transparent text-white hover:opacity-95" : "h-10 rounded-2xl border-border/70 bg-white text-muted-foreground hover:bg-background hover:text-foreground"} style={registerMethod === "sms" ? { backgroundColor: "var(--break-primary)" } : undefined} onClick={() => setRegisterMethod("sms")} disabled={loading}>SMS</Button>
                  </div>
                </div>
                <Button type="submit" className={primaryButtonClassName} disabled={loading || !registerCanSubmit}>
                  {loading ? "Submitting..." : "Create Account"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            {activeTab === "register" &&
              registerStep === "otp" &&
              renderOtpPanel(
                registerOtp,
                setRegisterOtp,
                registerExpiresIn,
                registerAttemptsLeft,
                registerResendSeconds,
                `A 6-digit code was sent via ${registerMethod.toUpperCase()}.`,
                handleRegisterVerify,
                () => {
                  setRegisterStep("form");
                  clearFeedback();
                },
                handleRegisterResend
              )}

            {activeTab === "reset" && resetStep === "form" && (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Verification method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" className={resetMethod === "email" ? "h-10 rounded-2xl border-transparent text-white hover:opacity-95" : "h-10 rounded-2xl border-border/70 bg-white text-muted-foreground hover:bg-background hover:text-foreground"} style={resetMethod === "email" ? { backgroundColor: "var(--focus-primary)" } : undefined} onClick={() => setResetMethod("email")} disabled={loading}>Email</Button>
                    <Button type="button" variant="outline" className={resetMethod === "sms" ? "h-10 rounded-2xl border-transparent text-white hover:opacity-95" : "h-10 rounded-2xl border-border/70 bg-white text-muted-foreground hover:bg-background hover:text-foreground"} style={resetMethod === "sms" ? { backgroundColor: "var(--break-primary)" } : undefined} onClick={() => setResetMethod("sms")} disabled={loading}>SMS</Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="reset-email" type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={loading || resetMethod !== "email"} required={resetMethod === "email"} className={fieldWithLeadingIconClassName} />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="reset-phone" className="text-sm font-medium text-slate-700">Phone</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="reset-phone" type="tel" placeholder="+1 555 123 4567" value={resetPhone} onChange={(e) => setResetPhone(e.target.value)} disabled={loading || resetMethod !== "sms"} required={resetMethod === "sms"} className={fieldWithLeadingIconClassName} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-password" className="text-sm font-medium text-slate-700">New password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="reset-password" type={showResetPassword ? "text" : "password"} placeholder="Create password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required disabled={loading} className={fieldWithTwoIconsClassName} />
                      <button type="button" aria-label={showResetPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowResetPassword((prev) => !prev)}>
                        {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-confirm-password" className="text-sm font-medium text-slate-700">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input id="reset-confirm-password" type={showResetConfirmPassword ? "text" : "password"} placeholder="Repeat password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} required disabled={loading} className={fieldWithTwoIconsClassName} />
                      <button type="button" aria-label={showResetConfirmPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowResetConfirmPassword((prev) => !prev)}>
                        {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {renderPasswordRules(resetRules)}
                <Button type="submit" className={primaryButtonClassName} disabled={loading || !resetCanSubmit}>
                  {loading ? "Submitting..." : "Send Verification Code"}
                </Button>
              </form>
            )}

            {activeTab === "reset" &&
              resetStep === "otp" &&
              renderOtpPanel(
                resetOtp,
                setResetOtp,
                resetExpiresIn,
                resetAttemptsLeft,
                resetResendSeconds,
                resetMethod === "email" ? "Use the 6-digit code from your email." : "Use the 6-digit code sent to your phone.",
                handleResetVerify,
                () => {
                  setResetStep("form");
                  clearFeedback();
                },
                handleResetResend
              )}
          </div>
        </Card>
      </div>
    </div>
  );
}
