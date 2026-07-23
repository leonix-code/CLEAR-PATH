"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Eye,
  EyeOff,
  LogIn,
  GraduationCap,
  Loader2,
  Mail,
  Lock,
  Check,
  Fingerprint,
  QrCode,
  User,
  Sun,
  Moon,
  ArrowRight,
  Shield,
  Clock,
  RefreshCw,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/providers/providers";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type TabId = "credentials" | "biometric" | "qr";

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

function getStrengthLabel(score: number) {
  if (score <= 1) return { text: "Weak", color: "text-danger", bar: "bg-danger", width: "25%" };
  if (score === 2) return { text: "Medium", color: "text-warning", bar: "bg-warning", width: "50%" };
  if (score === 3) return { text: "Good", color: "text-brand-500", bar: "bg-brand-500", width: "75%" };
  return { text: "Strong", color: "text-success", bar: "bg-success", width: "100%" };
}

const TAB_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "credentials", label: "Account", icon: <User className="w-3.5 h-3.5" /> },
  { id: "biometric", label: "Biometric", icon: <Fingerprint className="w-3.5 h-3.5" /> },
  { id: "qr", label: "QR Code", icon: <QrCode className="w-3.5 h-3.5" /> },
];

// Static orb styles — uses CSS vars from globals.css, no dynamic inline values
const orbStyle1: React.CSSProperties = {
  top: "-10%",
  left: "10%",
  width: "45vw",
  height: "45vw",
  background: "radial-gradient(circle, #6366f1 0%, rgba(99,102,241,0) 70%)",
  opacity: "var(--orb-opacity-1)",
  animation: "floatAround 25s infinite alternate ease-in-out",
};

const orbStyle2: React.CSSProperties = {
  bottom: "-15%",
  right: "5%",
  width: "50vw",
  height: "50vw",
  background: "radial-gradient(circle, #06b6d4 0%, rgba(6,182,212,0) 70%)",
  opacity: "var(--orb-opacity-1)",
  animation: "floatAround 25s infinite alternate ease-in-out",
  animationDelay: "-5s",
};

const orbStyle3: React.CSSProperties = {
  top: "35%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "35vw",
  height: "35vw",
  background: "radial-gradient(circle, #8b5cf6 0%, rgba(139,92,246,0) 70%)",
  opacity: "var(--orb-opacity-2)",
  animation: "floatAround 25s infinite alternate ease-in-out",
  animationDelay: "-10s",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("credentials");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(45);
  const [biometricState, setBiometricState] = useState<"idle" | "scanning" | "success">("idle");
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const passwordValue = watch("password", "");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "qr") {
      setQrCountdown(45);
      return;
    }
    const interval = setInterval(() => {
      setQrCountdown((prev) => (prev <= 0 ? 45 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (showForgotPassword) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setRotateX(-(y / (rect.height / 2)) * 8);
      setRotateY((x / (rect.width / 2)) * 8);
    },
    [showForgotPassword]
  );

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiService.auth.login(data);
      const { accessToken, refreshToken, user } = response.data.data || response.data;
      login(accessToken, user);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      toast.success(`Welcome back, ${user.firstName}!`);

      const role = user.role?.toLowerCase();
      if (role === "administrator") router.push("/admin");
      else if (role === "student") router.push("/student");
      else if (role === "invigilator") router.push("/invigilator");
      else if (role?.includes("officer")) router.push("/officer");
      else if (role === "parent") router.push("/parent");
      else if (role === "supervisor") router.push("/supervisor");
      else if (role === "ict_support") router.push("/ict-support");
      else router.push("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await apiService.auth.forgotPassword(forgotEmail);
      toast.success(`Recovery email sent to ${forgotEmail}`);
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send recovery email");
    } finally {
      setForgotLoading(false);
    }
  };

  const triggerBiometricScan = () => {
    if (biometricState !== "idle") return;
    setBiometricState("scanning");
    setTimeout(() => {
      setBiometricState("success");
      toast.success("Biometric identity verified!");
      setTimeout(() => {
        toast.info("Demo mode — biometric auth is simulated");
        setBiometricState("idle");
      }, 1500);
    }, 2000);
  };

  const regenerateQR = () => {
    setQrCountdown(45);
    toast.info("QR code regenerated");
  };

  const strength = passwordValue ? getPasswordStrength(passwordValue) : null;
  const strengthLabel = strength ? getStrengthLabel(strength.score) : null;
  const tabIndicatorIndex = TAB_ITEMS.findIndex((t) => t.id === activeTab);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] dark:blur-[100px]" style={orbStyle1} />
        <div className="absolute rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] dark:blur-[100px]" style={orbStyle2} />
        <div className="absolute rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] dark:blur-[100px]" style={orbStyle3} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/65 dark:bg-neutral-900/65 border border-white/40 dark:border-neutral-700/40 backdrop-blur-xl flex items-center justify-center text-foreground shadow-lg hover:scale-110 hover:rotate-15 transition-all duration-300"
        aria-label="Toggle theme"
      >
        {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Main card with 3D perspective */}
      <div
        ref={containerRef}
        className="w-full max-w-[460px] perspective-[1200px] z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="relative w-full"
          style={{
            transformStyle: "preserve-3d",
            rotateX: showForgotPassword ? 0 : rotateX,
            rotateY: showForgotPassword ? 180 : rotateY,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="min-h-[580px] relative" style={{ transformStyle: "preserve-3d" }}>
            {/* ── Front face (login) ── */}
            <div
              className="absolute inset-0 bg-white/65 dark:bg-neutral-900/65 border border-white/40 dark:border-neutral-700/40 backdrop-blur-2xl rounded-3xl shadow-glass p-10 w-full overflow-y-auto"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* Decorative gradient border */}
              <div className="absolute inset-0 rounded-3xl p-[1.5px] pointer-events-none overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(99,102,241,0.2) 100%)",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
              </div>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg"
                  style={{ animation: "logoPulse 3s infinite alternate" }}
                >
                  <GraduationCap className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-3xl font-extrabold tracking-tight gradient-primary bg-clip-text text-transparent">
                  ClearPath Portal
                </h1>
                <p className="text-foreground-muted mt-2 text-sm font-medium">
                  Sign in to access your digital clearance
                </p>
              </motion.div>

              {/* Tab bar */}
              <div className="flex bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-2xl mb-8 relative">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-300 relative z-10 ${
                      activeTab === tab.id ? "text-foreground" : "text-foreground-muted hover:text-foreground-secondary"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
                <div
                  className="absolute top-1 h-[calc(100%-0.5rem)] bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-border-light transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    left: `calc(${tabIndicatorIndex * 33.333}% + ${tabIndicatorIndex * 0.25}rem)`,
                    width: "calc(33.333% - 0.25rem)",
                  }}
                />
              </div>

              {/* Panels */}
              <div className="relative min-h-[280px]">
                <AnimatePresence mode="wait">
                  {activeTab === "credentials" && (
                    <motion.div
                      key="credentials"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email — floating label using peer */}
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none z-10" />
                          <input
                            {...register("email")}
                            type="email"
                            placeholder="Email address"
                            className="peer w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm text-sm font-medium text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                            disabled={isLoading}
                          />
                          <label className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-foreground-muted pointer-events-none transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-brand-500 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-500 peer-[:not(:placeholder-shown)]:font-semibold">
                            Email address
                          </label>
                          {errors.email && (
                            <p className="text-danger text-xs mt-1">{errors.email.message}</p>
                          )}
                        </div>

                        {/* Password — floating label using peer */}
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none z-10" />
                          <input
                            {...register("password")}
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="peer w-full pl-11 pr-20 py-3 rounded-xl border border-border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm text-sm font-medium text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                            disabled={isLoading}
                          />
                          <label className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-foreground-muted pointer-events-none transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-brand-500 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-500 peer-[:not(:placeholder-shown)]:font-semibold">
                            Password
                          </label>
                          {capsLockOn && (
                            <span className="absolute right-20 top-1/2 -translate-y-1/2 bg-warning text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                              CAPS
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-brand-500 transition-colors p-1 z-10"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {errors.password && (
                            <p className="text-danger text-xs mt-1">{errors.password.message}</p>
                          )}
                        </div>

                        {/* Password strength */}
                        {strength && passwordValue && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2 -mt-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold ${strengthLabel?.color}`}>
                                Strength: {strengthLabel?.text}
                              </span>
                            </div>
                            <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${strengthLabel?.bar}`}
                                style={{ width: strengthLabel?.width }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {(
                                [
                                  ["length", "8+ Characters"],
                                  ["upper", "Uppercase"],
                                  ["number", "Contains Number"],
                                  ["special", "Special Symbol"],
                                ] as const
                              ).map(([key, label]) => (
                                <div
                                  key={key}
                                  className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                                    strength.checks[key] ? "text-success" : "text-foreground-muted"
                                  }`}
                                >
                                  <Check className={`w-3 h-3 ${strength.checks[key] ? "opacity-100" : "opacity-30"}`} />
                                  {label}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Remember / Forgot */}
                        <div className="flex items-center justify-between text-sm font-medium">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-border text-brand-500 focus:ring-brand-500/20" />
                            <span className="text-foreground-secondary">Remember me</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-brand-500 hover:text-brand-600 transition-colors"
                          >
                            Forgot Password?
                          </button>
                        </div>

                        {/* Submit */}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-[0.97]"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <LogIn className="w-5 h-5" />
                              Sign In Securely
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {activeTab === "biometric" && (
                    <motion.div
                      key="biometric"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center text-center gap-5 min-h-[260px]"
                    >
                      <p className="text-sm text-foreground-muted font-medium -mt-2">
                        Touch security key or scan fingerprint to authenticate
                      </p>
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <div
                          className="absolute inset-0 border-2 border-dashed border-border rounded-full"
                          style={{ animation: biometricState === "scanning" ? "spin-slow 15s linear infinite" : "none" }}
                        />
                        {biometricState === "scanning" && (
                          <div
                            className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#06b6d4] z-10"
                            style={{ animation: "scanVertical 2s infinite ease-in-out" }}
                          />
                        )}
                        <button
                          onClick={triggerBiometricScan}
                          disabled={biometricState === "scanning"}
                          className={`relative z-20 w-20 h-20 flex items-center justify-center rounded-full transition-all duration-300 ${
                            biometricState === "success"
                              ? "text-success scale-110"
                              : biometricState === "scanning"
                                ? "text-brand-400 scale-95"
                                : "text-brand-500 hover:scale-105"
                          }`}
                        >
                          <Fingerprint className="w-20 h-20" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p
                        className={`text-sm font-semibold transition-colors ${
                          biometricState === "success"
                            ? "text-success"
                            : biometricState === "scanning"
                              ? "text-brand-400"
                              : "text-foreground-muted"
                        }`}
                      >
                        {biometricState === "success"
                          ? "Identity verified!"
                          : biometricState === "scanning"
                            ? "Scanning biometric template..."
                            : "Ready to scan biometric credential"}
                      </p>
                      <button
                        onClick={triggerBiometricScan}
                        disabled={biometricState === "scanning"}
                        className="px-6 py-2.5 rounded-full border-2 border-brand-500 text-brand-500 font-bold text-sm hover:bg-brand-500 hover:text-white transition-all duration-300 disabled:opacity-50"
                      >
                        {biometricState === "scanning" ? "Scanning..." : "Scan Fingerprint"}
                      </button>
                    </motion.div>
                  )}

                  {activeTab === "qr" && (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center text-center gap-4 min-h-[260px]"
                    >
                      <p className="text-sm text-foreground-muted font-medium -mt-2">
                        Scan the secure QR code with the ClearPath Mobile App
                      </p>
                      <div className="relative w-36 h-36 p-3 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
                        <div
                          className="absolute w-[calc(100%-1.5rem)] h-0.5 bg-brand-400 shadow-[0_0_6px_#818cf8] z-10"
                          style={{ animation: "scanVerticalQr 3s infinite linear" }}
                        />
                        <svg className="w-full h-full text-foreground" viewBox="0 0 100 100" fill="currentColor">
                          <path d="M0,0h25v25h-25zM5,5h15v15h-15z M8,8h9v9h-9z" />
                          <path d="M75,0h25v25h-25zM80,5h15v15h-15z M83,8h9v9h-9z" />
                          <path d="M0,75h25v25h-25zM5,80h15v15h-15z M8,83h9v9h-9z" />
                          <path d="M35,5h5v5h-5z M45,0h10v5h-10z M60,5h10v5h-10z M35,15h15v5h-15z M55,15h10v5h-10z M45,20h5v5h-5z" />
                          <path d="M35,30h10v5h-10z M50,35h5v10h-5z M60,30h15v5h-15z M40,45h5v5h-5z M65,40h10v5h-10z M35,55h5v5h-5z" />
                          <path d="M0,35h10v5h-10z M15,40h10v5h-10z M5,50h15v5h-15z M25,55h5v10h-5z M10,65h10v5h-10z M20,70h5v5h-5z" />
                          <path d="M75,35h10v5h-10z M90,40h10v5h-10z M80,50h15v5h-15z M85,60h5v15h-5z M95,65h5v5h-5z M75,70h5v5h-5z" />
                          <path d="M35,65h20v5h-20z M40,75h5v10h-5z M50,80h15v5h-15z M35,90h25v5h-25z M65,90h5v5h-5z M70,75h5v10h-5z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted">
                        <Clock className="w-3 h-3" />
                        Code expires in: <span className="text-brand-500">{qrCountdown}s</span>
                      </div>
                      <button
                        onClick={regenerateQR}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate Code
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom info */}
              <div className="text-center mt-6 text-sm font-medium text-foreground-muted">
                Need an account?{" "}
                <Link href="/register" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                  Register with your Student ID
                </Link>
              </div>
            </div>

            {/* ── Back face (forgot password) ── */}
            <div
              className="absolute inset-0 bg-white/65 dark:bg-neutral-900/65 border border-white/40 dark:border-neutral-700/40 backdrop-blur-2xl rounded-3xl shadow-glass p-10 w-full flex flex-col justify-center overflow-y-auto"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold gradient-primary bg-clip-text text-transparent">
                    Recover Password
                  </h2>
                  <p className="text-sm text-foreground-muted mt-2">
                    Enter your email and we&apos;ll send a recovery link
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none z-10" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Registered email"
                      className="peer w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm text-sm font-medium text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      required
                    />
                    <label className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-foreground-muted pointer-events-none transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-brand-500 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-500 peer-[:not(:placeholder-shown)]:font-semibold">
                      Registered email
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                  >
                    {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Recovery Email"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="block w-full text-center text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors mt-4"
                  >
                    Back to Sign In
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
