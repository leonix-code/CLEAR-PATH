"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  QrCode,
  Camera,
  CameraOff,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Search,
  BadgeCheck,
  BookOpen,
  RefreshCw,
  Loader2,
  Scan,
  Smartphone,
  Wifi,
  WifiOff,
  ChevronRight,
  Clock,
  GraduationCap,
  FileCheck,
  Maximize2,
  Minimize2,
  Zap,
  Activity,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/providers/providers";
import { cn, getStatusColor, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface StudentInfo {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  course?: string;
  currentLevel: number;
  avatarUrl?: string;
  clearanceStatus?: string;
  eligibilityStatus?: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
  student?: StudentInfo;
  timestamp: string;
}

interface EligibilityResult {
  eligible: boolean;
  status: string;
  message: string;
  details?: {
    clearanceCompleted: boolean;
    feePaid: boolean;
    attendanceMet: boolean;
  };
}

// History item for the verification log
interface VerificationLogItem {
  id: string;
  type: "qr" | "manual" | "offline";
  studentId: string;
  studentName: string;
  status: "verified" | "not_found" | "not_eligible" | "error";
  timestamp: string;
  mode: "online" | "offline";
}

export default function InvigilatorDashboard() {
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<"scanner" | "manual" | "offline" | "history">("scanner");

  // Scanner state
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerFullscreen, setScannerFullscreen] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Manual verification state
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualResult, setManualResult] = useState<VerificationResult | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  // Verification result state
  const [currentResult, setCurrentResult] = useState<{
    student: StudentInfo;
    eligibility: EligibilityResult | null;
  } | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  // Verification log
  const [verificationLog, setVerificationLog] = useState<VerificationLogItem[]>([]);

  // Offline mode state
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineCache, setOfflineCache] = useState<StudentInfo[]>([]);
  const [offlineStudentId, setOfflineStudentId] = useState("");
  const [offlineResult, setOfflineResult] = useState<VerificationResult | null>(null);

  // Initialize scanner
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  const startScanner = useCallback(async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          handleQRResult(decodedText);
        },
        () => {}
      );
      setScannerActive(true);
    } catch (err: any) {
      toast.error("Camera access denied. Please allow camera permissions.");
      console.error("Scanner error:", err);
    } finally {
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {}
    }
    setScannerActive(false);
  }, []);

  const handleQRResult = async (code: string) => {
    setLastScanResult(code);
    await stopScanner();

    try {
      const res = await apiService.invigilator.verifyQR(code);
      const data = res.data?.data || res.data;
      if (data.student) {
        setCurrentResult({ student: data.student, eligibility: null });
        addToLog(data.student, "qr", "verified");
        toast.success(`Student found: ${data.student.firstName} ${data.student.lastName}`);
        // Auto-check eligibility
        checkEligibility(data.student.studentId || data.student.id);
      } else {
        toast.error(data.message || "Student not found");
        addToLog({ studentId: code, firstName: "Unknown", lastName: "" } as StudentInfo, "qr", "not_found");
      }
    } catch {
      // Offline fallback
      const cached = offlineCache.find((s) => s.studentId === code || s.id === code);
      if (cached) {
        setCurrentResult({ student: cached, eligibility: null });
        addToLog(cached, "qr", "verified");
        toast.success("Student found (offline cache)");
      } else {
        toast.error("Student not found. Switch to offline mode to use cached data.");
        addToLog({ studentId: code, firstName: "Unknown", lastName: "" } as StudentInfo, "qr", "not_found");
      }
    }
  };

  const checkEligibility = async (studentId: string) => {
    setEligibilityLoading(true);
    try {
      const res = await apiService.invigilator.checkEligibility(studentId);
      const eligibility = res.data?.data || res.data;
      setCurrentResult((prev) => prev ? { ...prev, eligibility } : null);
    } catch {
      // Simulate offline eligibility check
      const cached = offlineCache.find((s) => s.studentId === studentId || s.id === studentId);
      if (cached) {
        setCurrentResult((prev) =>
          prev
            ? {
                ...prev,
                eligibility: {
                  eligible: cached.eligibilityStatus === "ELIGIBLE",
                  status: cached.eligibilityStatus || "PENDING_REVIEW",
                  message: "Based on cached data",
                  details: { clearanceCompleted: true, feePaid: true, attendanceMet: true },
                },
              }
            : null
        );
      }
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!manualStudentId.trim()) {
      toast.error("Please enter a student ID");
      return;
    }

    setManualLoading(true);
    setManualResult(null);
    try {
      const res = await apiService.invigilator.verifyStudent(manualStudentId.trim());
      const data = res.data?.data || res.data;
      if (data.id || data.studentId) {
        const student: StudentInfo = {
          id: data.id || data.studentId,
          studentId: data.studentId || manualStudentId.trim(),
          firstName: data.firstName || data.user?.firstName || data.student?.user?.firstName,
          lastName: data.lastName || data.user?.lastName || data.student?.user?.lastName,
          email: data.email || data.user?.email || "",
          phone: data.phone || data.user?.phone || "",
          department: data.department?.name || data.student?.department?.name,
          course: data.course?.name || data.student?.course?.name,
          currentLevel: data.currentLevel || data.student?.currentLevel || 0,
          clearanceStatus: data.clearanceStatus || data.clearance?.[0]?.status,
          eligibilityStatus: data.eligibilityStatus,
        };
        setManualResult({ success: true, message: "Student verified", student, timestamp: new Date().toISOString() });
        setCurrentResult({ student, eligibility: null });
        addToLog(student, "manual", "verified");
        toast.success("Student verified successfully");
        checkEligibility(student.studentId);
      } else {
        setManualResult({ success: false, message: data.message || "Student not found", timestamp: new Date().toISOString() });
        addToLog({ studentId: manualStudentId.trim(), firstName: "Unknown", lastName: "" } as StudentInfo, "manual", "not_found");
      }
    } catch (error: any) {
      // Offline fallback
      const cached = offlineCache.find((s) => s.studentId === manualStudentId.trim());
      if (cached) {
        setManualResult({ success: true, message: "Found in offline cache", student: cached, timestamp: new Date().toISOString() });
        setCurrentResult({ student: cached, eligibility: null });
        addToLog(cached, "manual", "verified");
        toast.success("Student found in offline cache");
      } else {
        setManualResult({ success: false, message: "Student not found. Check ID and try again.", timestamp: new Date().toISOString() });
        addToLog({ studentId: manualStudentId.trim(), firstName: "Unknown", lastName: "" } as StudentInfo, "manual", "not_found");
      }
    } finally {
      setManualLoading(false);
    }
  };

  const handleOfflineVerify = (studentIdParam?: string) => {
    const id = (studentIdParam || offlineStudentId).trim();
    if (!id) {
      toast.error("Please enter a student ID");
      return;
    }
    const cached = offlineCache.find((s) => s.studentId === id);
    if (cached) {
      setOfflineResult({
        success: true,
        message: "Student verified from offline cache",
        student: cached,
        timestamp: new Date().toISOString(),
      });
      setCurrentResult({ student: cached, eligibility: null });
      addToLog(cached, "offline", "verified");
      toast.success("Student verified (offline)");
    } else {
      setOfflineResult({
        success: false,
        message: "Student not found in offline cache. Sync data first.",
        timestamp: new Date().toISOString(),
      });
      addToLog({ studentId: offlineStudentId.trim(), firstName: "Unknown", lastName: "" } as StudentInfo, "offline", "not_found");
    }
  };

  const addToLog = (student: StudentInfo, type: "qr" | "manual" | "offline", status: VerificationLogItem["status"]) => {
    const logItem: VerificationLogItem = {
      id: Date.now().toString(),
      type,
      studentId: student.studentId || student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim() || "Unknown",
      status,
      timestamp: new Date().toISOString(),
      mode: offlineMode ? "offline" : "online",
    };
    setVerificationLog((prev) => [logItem, ...prev].slice(0, 50));
  };

  // Simulated offline data sync
  const syncOfflineData = async () => {
    toast.info("Syncing student data for offline use...");
    try {
      const res = await apiService.students.getAll({ limit: 100 });
      const students = res.data?.data || [];
      const mapped: StudentInfo[] = students.map((s: any) => ({
        id: s.id,
        studentId: s.studentId,
        firstName: s.user?.firstName || s.firstName || "",
        lastName: s.user?.lastName || s.lastName || "",
        email: s.user?.email || s.email || "",
        phone: s.user?.phone || "",
        department: s.department?.name || "",
        course: s.course?.name || "",
        currentLevel: s.currentLevel || 0,
        clearanceStatus: s.clearanceRequests?.[0]?.status,
      }));
      setOfflineCache(mapped);
      localStorage.setItem("invigilator_offline_cache", JSON.stringify(mapped));
      toast.success(`Synced ${mapped.length} students for offline use`);
    } catch {
      // Load from localStorage
      const cached = localStorage.getItem("invigilator_offline_cache");
      if (cached) {
        setOfflineCache(JSON.parse(cached));
        toast.info("Loaded from local cache");
      } else {
        toast.error("No cached data available. Connect to internet to sync.");
      }
    }
  };

  // Load offline cache from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("invigilator_offline_cache");
    if (cached) {
      try {
        setOfflineCache(JSON.parse(cached));
      } catch {}
    }
  }, []);

  const clearResult = () => {
    setCurrentResult(null);
    setManualResult(null);
    setOfflineResult(null);
  };

  const tabs = [
    { id: "scanner" as const, label: "QR Scanner", icon: Scan },
    { id: "manual" as const, label: "ID Verify", icon: BadgeCheck },
    { id: "offline" as const, label: "Offline", icon: WifiOff },
    { id: "history" as const, label: "History", icon: Clock },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Invigilator Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Verify students, scan QR codes, and check exam eligibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setOfflineMode(!offlineMode); clearResult(); }}
            className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              offlineMode ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "glass hover:bg-glass-bg"
            )}
          >
            {offlineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {offlineMode ? "Offline" : "Online"}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {offlineMode && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You are in offline mode. Verification uses cached data.{" "}
            <button onClick={syncOfflineData} className="underline font-medium">Sync data</button> to update the cache.
          </p>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 glass-card p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); clearResult(); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
              activeTab === tab.id
                ? "gradient-primary text-white shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-glass-bg"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab: QR Scanner */}
          {activeTab === "scanner" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div
                className={cn(
                  "glass-card overflow-hidden relative transition-all duration-300",
                  scannerFullscreen ? "fixed inset-4 z-50" : ""
                )}
              >
                <div className="p-4 border-b border-glass-border flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    QR Code Scanner
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScannerFullscreen(!scannerFullscreen)}
                      className="p-1.5 hover:bg-glass-bg rounded-lg transition-colors"
                    >
                      {scannerFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    {scannerActive ? (
                      <button onClick={stopScanner} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all">
                        <CameraOff className="w-3.5 h-3.5" /> Stop
                      </button>
                    ) : (
                      <button onClick={startScanner} disabled={scanning}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-all disabled:opacity-50">
                        {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        {scanning ? "Starting..." : "Start"}
                      </button>
                    )}
                  </div>
                </div>

                <div className={cn("relative", scannerFullscreen ? "h-[calc(100%-57px)]" : "h-[350px]")}>
                  <div id="qr-reader" className={cn("w-full h-full", !scannerActive && "hidden")} />
                  {!scannerActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20">
                      <QrCode className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
                      <p className="text-muted-foreground text-sm mb-4">
                        {scanning ? "Initializing camera..." : "Click Start to begin scanning"}
                      </p>
                      {!scanning && (
                        <button onClick={startScanner}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/25">
                          <Zap className="w-4 h-4" /> Start Camera Scanner
                        </button>
                      )}
                    </div>
                  )}
                  {/* Scanner overlay */}
                  {scannerActive && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary/50 rounded-xl animate-pulse-glow" />
                    </div>
                  )}
                </div>

                {lastScanResult && (
                  <div className="p-3 border-t border-glass-border bg-glass-bg">
                    <p className="text-xs text-muted-foreground">Last scan:</p>
                    <p className="text-sm font-mono truncate">{lastScanResult}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab: Manual ID Verification */}
          {activeTab === "manual" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-primary" />
                Manual ID Verification
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the student ID number to verify their identity and check clearance status.
              </p>

              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter Student ID (e.g., CSC2021001)"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    disabled={manualLoading}
                  />
                </div>
                <button
                  onClick={handleManualVerify}
                  disabled={manualLoading || !manualStudentId.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {manualLoading ? "Searching..." : "Verify"}
                </button>
              </div>

              {/* Manual Result */}
              <AnimatePresence>
                {manualResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={cn("p-4 rounded-xl", manualResult.success ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20")}>
                    <div className="flex items-center gap-2 mb-2">
                      {manualResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <p className={cn("font-medium", manualResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                        {manualResult.success ? "Student Found" : "Not Found"}
                      </p>
                    </div>
                    {manualResult.student && (
                      <div className="space-y-2 mt-3">
                        <p className="text-sm"><strong>Name:</strong> {manualResult.student.firstName} {manualResult.student.lastName}</p>
                        <p className="text-sm"><strong>ID:</strong> {manualResult.student.studentId}</p>
                        <p className="text-sm"><strong>Dept:</strong> {manualResult.student.department || "N/A"}</p>
                        <p className="text-sm"><strong>Level:</strong> {manualResult.student.currentLevel || "N/A"}</p>
                      </div>
                    )}
                    {!manualResult.success && <p className="text-sm mt-2">{manualResult.message}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Tab: Offline Verification */}
          {activeTab === "offline" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      Offline Verification
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {offlineCache.length} students cached for offline use
                    </p>
                  </div>
                  <button onClick={syncOfflineData}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-glass-bg transition-colors text-sm">
                    <RefreshCw className="w-4 h-4" /> Sync Data
                  </button>
                </div>

                <div className="flex gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text" placeholder="Search offline cache..."
                      value={offlineStudentId}
                      onChange={(e) => setOfflineStudentId(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleOfflineVerify()}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                  <button onClick={() => handleOfflineVerify()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all">
                    <Search className="w-4 h-4" /> Find
                  </button>
                </div>

                {/* Offline Cache List */}
                {offlineCache.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cached Students</p>
                    {offlineCache.slice(0, 10).map((s) => (
                      <div key={s.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-glass-bg transition-colors cursor-pointer"
                        onClick={() => { setOfflineStudentId(s.studentId); handleOfflineVerify(); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-medium">
                            {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-muted-foreground">{s.studentId}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                    {offlineCache.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        +{offlineCache.length - 10} more students
                      </p>
                    )}
                  </div>
                )}

                {offlineCache.length === 0 && (
                  <div className="text-center py-8">
                    <WifiOff className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No offline data available</p>
                    <p className="text-xs text-muted-foreground mt-1">Connect to the internet and sync data first</p>
                  </div>
                )}
              </div>

              {/* Offline Result */}
              <AnimatePresence>
                {offlineResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={cn("glass-card p-4", offlineResult.success ? "border-green-500/20" : "border-red-500/20")}>
                    <div className="flex items-center gap-2 mb-2">
                      {offlineResult.success ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                      <p className="font-medium">{offlineResult.success ? "Verified Offline" : "Not Found"}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{offlineResult.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Tab: Verification History */}
          {activeTab === "history" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Verification Log
                </h3>
                <button onClick={() => setVerificationLog([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Clear all
                </button>
              </div>

              {verificationLog.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">No verification history yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {verificationLog.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-glass-bg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full",
                          log.status === "verified" ? "bg-green-500" :
                          log.status === "not_found" ? "bg-red-500" :
                          log.status === "not_eligible" ? "bg-yellow-500" : "bg-gray-500")} />
                        <div>
                          <p className="text-sm font-medium">{log.studentName}</p>
                          <p className="text-xs text-muted-foreground">{log.studentId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                            log.mode === "online" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
                            {log.mode}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{log.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column - Verification Result */}
        <div className="space-y-6">
          {/* Current Verification Result */}
          {currentResult ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-primary" />
                  Verification Result
                </h3>
                <button onClick={clearResult} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Clear
                </button>
              </div>

              {/* Student Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold">
                  {currentResult.student.firstName?.charAt(0)}{currentResult.student.lastName?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{currentResult.student.firstName} {currentResult.student.lastName}</h4>
                  <p className="text-sm text-muted-foreground">{currentResult.student.studentId}</p>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 py-2 border-b border-glass-border">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{currentResult.student.department || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-glass-border">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="text-sm font-medium">{currentResult.student.course || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-glass-border">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="text-sm font-medium">Level {currentResult.student.currentLevel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-glass-border">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Clearance Status</p>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium mt-1 inline-block",
                      getStatusColor(currentResult.student.clearanceStatus || "PENDING"))}>
                      {currentResult.student.clearanceStatus?.replace(/_/g, " ") || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Eligibility Status */}
              {eligibilityLoading ? (
                <div className="glass p-4 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Checking eligibility...</span>
                </div>
              ) : currentResult.eligibility ? (
                <div className={cn("p-4 rounded-xl",
                  currentResult.eligibility.eligible ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20")}>
                  <div className="flex items-center gap-2 mb-2">
                    {currentResult.eligibility.eligible ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <p className={cn("font-semibold", currentResult.eligibility.eligible ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                      {currentResult.eligibility.eligible ? "ELIGIBLE FOR EXAMS" : "NOT ELIGIBLE FOR EXAMS"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentResult.eligibility.message}</p>
                </div>
              ) : (
                <button onClick={() => checkEligibility(currentResult.student.studentId)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-glass-bg transition-colors text-sm font-medium">
                  <Shield className="w-4 h-4" /> Check Exam Eligibility
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 text-center">
              <div className="py-8">
                <Scan className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="font-semibold mb-2">Ready to Verify</h3>
                <p className="text-sm text-muted-foreground">
                  Scan a QR code or search for a student to see their verification details and exam eligibility status.
                </p>
              </div>
            </motion.div>
          )}

          {/* Stats / Quick Info */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Today&apos;s Verifications
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="glass p-2 rounded-lg">
                <p className="text-lg font-bold text-green-600">{verificationLog.filter(l => l.status === "verified").length}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div className="glass p-2 rounded-lg">
                <p className="text-lg font-bold text-red-600">{verificationLog.filter(l => l.status === "not_found" || l.status === "not_eligible").length}</p>
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
              <div className="glass p-2 rounded-lg">
                <p className="text-lg font-bold text-primary">{offlineCache.length}</p>
                <p className="text-xs text-muted-foreground">Cached</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
