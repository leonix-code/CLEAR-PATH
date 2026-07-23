"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, GraduationCap, ClipboardCheck, CheckCircle2, Clock,
  Bell, Search, Loader2, BookOpen, Building2, ChevronRight,
  RefreshCw, AlertCircle, TrendingUp, User, Mail, Star,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { cn, getStatusColor, getInitials } from "@/lib/utils";
import { useAuth } from "@/providers/providers";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PieChart } from "@/components/charts/pie-chart";
import { BarChart } from "@/components/charts/bar-chart";

interface ChildStudent {
  id: string; studentId: string;
  user: { firstName: string; lastName: string; email: string; phone?: string; avatarUrl?: string };
  department: { name: string }; course: { name: string }; currentLevel: number;
  clearanceRequests: { id: string; status: string; semester: { name: string; academicYear: { year: string } }; approvals: { status: string; officer: { role: string } }[]; createdAt: string }[];
}

const departmentPerformance = [
  { name: "CS", passed: 85, pending: 12 },
  { name: "ENG", passed: 72, pending: 18 },
  { name: "BUS", passed: 65, pending: 10 },
  { name: "MED", passed: 90, pending: 8 },
  { name: "LAW", passed: 48, pending: 15 },
];

const clearanceStatusData = [
  { name: "Cleared", value: 3, color: "#22c55e" },
  { name: "In Progress", value: 2, color: "#f59e0b" },
  { name: "Not Started", value: 1, color: "#94a3b8" },
];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: children, isLoading } = useQuery<ChildStudent[]>({
    queryKey: ["parent-children"],
    queryFn: async () => {
      const response = await apiService.students.getAll({ limit: 50 });
      const data = response?.data?.data || response?.data || [];
      return Array.isArray(data) ? data : [];
    },
  });

  const filteredChildren = (children || []).filter(c =>
    c.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const latestClearance = (child: ChildStudent) => child.clearanceRequests?.[0];
  const clearanceProgress = (child: ChildStudent) => {
    const cr = latestClearance(child); if (!cr) return { approved: 0, total: 5, percentage: 0 };
    const total = cr.approvals?.length || 5;
    const approved = cr.approvals?.filter(a => a.status === "APPROVED").length || 0;
    return { approved, total, percentage: Math.round((approved / total) * 100) };
  };

  const clearedCount = children?.filter(c => latestClearance(c)?.status === "APPROVED").length || 0;
  const inProgressCount = children?.filter(c => {
    const s = latestClearance(c)?.status;
    return s === "PENDING" || s === "IN_PROGRESS";
  }).length || 0;

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader title="Parent Dashboard" description="Monitor your ward's clearance progress and academic status across all institutions." searchable />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-[100px] rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Children" value={children?.length || 0} icon={Users} gradient="from-blue-500 to-blue-600" delay={0} />
          <StatsCard title="Fully Cleared" value={clearedCount} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-600" delay={0.05} />
          <StatsCard title="In Progress" value={inProgressCount} icon={Clock} gradient="from-amber-500 to-amber-600" delay={0.1} />
          <StatsCard title="Notifications" value={0} icon={Bell} gradient="from-purple-500 to-purple-600" delay={0.15} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Clearance Overview
          </h2>
          <PieChart data={clearanceStatusData} donut outerRadius={80} height={250} />
        </div>
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            Department Performance
          </h2>
          <BarChart data={departmentPerformance} dataKeys={[{ key: "passed", color: "#22c55e", label: "Cleared" }, { key: "pending", color: "#f59e0b", label: "Pending" }]} height={250} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredChildren.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 text-foreground-muted mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold text-lg mb-2">No Children Found</h3>
          <p className="text-foreground-secondary max-w-md mx-auto text-sm">
            {searchQuery ? "No students match your search." : "No registered children linked to your account. Contact administration."}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-lg font-semibold">Children ({filteredChildren.length})</h2>
          {filteredChildren.map((child, i) => {
            const cr = latestClearance(child);
            const progress = clearanceProgress(child);
            return (
              <motion.div key={child.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(child.user.firstName, child.user.lastName)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{child.user.firstName} {child.user.lastName}</h3>
                        <p className="text-sm text-foreground-secondary">{child.studentId}</p>
                      </div>
                    </div>
                    {cr && <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(cr.status))}>{cr.status.replace(/_/g, " ")}</span>}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="glass p-3 rounded-xl">
                      <Building2 className="w-4 h-4 text-foreground-muted mb-1" />
                      <p className="text-[10px] text-foreground-muted">Department</p>
                      <p className="text-sm font-medium">{child.department?.name || "N/A"}</p>
                    </div>
                    <div className="glass p-3 rounded-xl">
                      <BookOpen className="w-4 h-4 text-foreground-muted mb-1" />
                      <p className="text-[10px] text-foreground-muted">Course</p>
                      <p className="text-sm font-medium">{child.course?.name || "N/A"}</p>
                    </div>
                    <div className="glass p-3 rounded-xl">
                      <GraduationCap className="w-4 h-4 text-foreground-muted mb-1" />
                      <p className="text-[10px] text-foreground-muted">Level</p>
                      <p className="text-sm font-medium">Level {child.currentLevel}</p>
                    </div>
                    <div className="glass p-3 rounded-xl">
                      <Mail className="w-4 h-4 text-foreground-muted mb-1" />
                      <p className="text-[10px] text-foreground-muted">Email</p>
                      <p className="text-sm font-medium truncate">{child.user.email}</p>
                    </div>
                  </div>

                  {cr ? (
                    <div className="glass p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-primary" />
                          Clearance Progress
                        </h4>
                        <span className="text-xs text-foreground-muted">{cr.semester?.name || "Current"}</span>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full mb-3">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress.percentage}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className={cn("absolute inset-y-0 left-0 rounded-full transition-all",
                            progress.percentage === 100 ? "bg-green-500" : progress.percentage > 50 ? "bg-primary" : "bg-yellow-500")} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-foreground-secondary">
                        <span>{progress.approved} of {progress.total} approvals</span>
                        <span>{progress.percentage}%</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {cr.approvals?.map((approval, i) => (
                          <div key={i} className="text-center">
                            <div className={cn("w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium",
                              approval.status === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              approval.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400")}>
                              {approval.status === "APPROVED" ? "✓" : approval.status === "REJECTED" ? "✗" : i + 1}
                            </div>
                            <p className="text-[10px] text-foreground-muted leading-tight">
                              {approval.officer?.role?.replace(/_/g, " ").replace("OFFICER", "") || "Step"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="glass p-4 rounded-xl text-center">
                      <AlertCircle className="w-5 h-5 text-foreground-muted mx-auto mb-2" />
                      <p className="text-sm text-foreground-secondary">No clearance request submitted for the current semester.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
