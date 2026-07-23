"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck, CheckCircle2, Clock, XCircle, Search,
  CheckSquare, Square, ThumbsUp, ThumbsDown, Eye, RefreshCw,
  Loader2, X, Activity, TrendingUp, Users, FileText, Filter,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/providers/providers";
import { cn, getStatusColor, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";

interface ClearanceRequest {
  id: string; status: string; remarks?: string; submittedAt: string; completedAt?: string;
  student?: {
    id: string; studentId: string; currentLevel: number;
    user?: { firstName: string; lastName: string; email: string; phone?: string; avatarUrl?: string };
    department?: { name: string; code: string };
    course?: { name: string; code: string };
  };
  semester?: { name: string; academicYear?: { year: string } };
  approvals?: { id: string; status: string; remarks?: string; approvedAt?: string; officer?: { firstName: string; lastName: string; role: string } }[];
}

interface ClearanceStats { total: number; pending: number; inProgress: number; approved: number; rejected: number; }

type OfficerRole = "FINANCE_OFFICER" | "LIBRARY_OFFICER" | "LABORATORY_OFFICER" | "SPORTS_OFFICER" | "DEPARTMENT_OFFICER";

const officerLabels: Record<OfficerRole, string> = {
  FINANCE_OFFICER: "Finance Officer", LIBRARY_OFFICER: "Library Officer", LABORATORY_OFFICER: "Lab Officer",
  SPORTS_OFFICER: "Sports Officer", DEPARTMENT_OFFICER: "Dept. Officer",
};

const officerIcons: Record<OfficerRole, string> = {
  FINANCE_OFFICER: "💰", LIBRARY_OFFICER: "📚", LABORATORY_OFFICER: "🔬", SPORTS_OFFICER: "🏆", DEPARTMENT_OFFICER: "🏛️",
};

const weeklyStats = [
  { name: "Mon", approved: 8, rejected: 1 },
  { name: "Tue", approved: 15, rejected: 2 },
  { name: "Wed", approved: 6, rejected: 0 },
  { name: "Thu", approved: 12, rejected: 1 },
  { name: "Fri", approved: 18, rejected: 3 },
  { name: "Sat", approved: 4, rejected: 0 },
  { name: "Sun", approved: 3, rejected: 0 },
];

const statusPieData = [
  { name: "Approved", value: 145, color: "#22c55e" },
  { name: "Pending", value: 42, color: "#f59e0b" },
  { name: "Rejected", value: 28, color: "#ef4444" },
];

const recentActivities = [
  { id: "a1", action: "Clearance approved", description: "John Smith - CSC2021001", user: "You", time: "5 mins ago", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  { id: "a2", action: "Clearance rejected", description: "Jane Doe - Insufficient documentation", user: "You", time: "15 mins ago", icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
  { id: "a3", action: "Bulk approval processed", description: "8 clearances approved", user: "You", time: "1 hour ago", icon: CheckSquare, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
];

const quickActions = [
  { title: "Pending Requests", description: "View all pending clearance requests", icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", link: "?status=PENDING" },
  { title: "Generate Report", description: "Download clearance activity report", icon: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", link: "/officer/reports" },
  { title: "View Statistics", description: "See detailed clearance analytics", icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", link: "?view=stats" },
];

export default function OfficerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const officerRole = user?.role as OfficerRole;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [actionModal, setActionModal] = useState<{type: "approve" | "reject" | "bulk-approve" | "details"; clearance?: ClearanceRequest; ids?: string[]} | null>(null);
  const [remarks, setRemarks] = useState("");
  const [bulkRemarks, setBulkRemarks] = useState("");

  const { data: clearancesData, isLoading, refetch } = useQuery({
    queryKey: ["officer-clearances", statusFilter, searchQuery],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await apiService.clearance.getAll(params);
      return res.data?.data || [];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["clearance-statistics"],
    queryFn: async () => {
      try {
        const res = await apiService.clearance.getStatistics();
        return res.data?.data || res.data;
      } catch { return { total: 0, pending: 0, inProgress: 0, approved: 0, rejected: 0 }; }
    },
  });

  const stats: ClearanceStats = statsData || { total: 0, pending: 0, inProgress: 0, approved: 0, rejected: 0 };
  const clearances: ClearanceRequest[] = clearancesData || [];

  const approveMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) => { await apiService.clearance.approve(id, remarks); },
    onSuccess: () => { toast.success("Clearance approved!"); queryClient.invalidateQueries({ queryKey: ["officer-clearances"] }); queryClient.invalidateQueries({ queryKey: ["clearance-statistics"] }); setActionModal(null); setRemarks(""); },
    onError: (error: any) => { toast.error(error.response?.data?.message || "Failed to approve"); },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks: string }) => { if (!remarks) throw new Error("Remarks are required"); await apiService.clearance.reject(id, remarks); },
    onSuccess: () => { toast.success("Clearance rejected"); queryClient.invalidateQueries({ queryKey: ["officer-clearances"] }); queryClient.invalidateQueries({ queryKey: ["clearance-statistics"] }); setActionModal(null); setRemarks(""); },
    onError: (error: any) => { toast.error(error.response?.data?.message || error.message || "Failed to reject"); },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async ({ ids, remarks }: { ids: string[]; remarks?: string }) => { await apiService.clearance.bulkApprove(ids, remarks); },
    onSuccess: () => { toast.success("Bulk approval completed!"); queryClient.invalidateQueries({ queryKey: ["officer-clearances"] }); queryClient.invalidateQueries({ queryKey: ["clearance-statistics"] }); setSelectedIds(new Set()); setSelectAll(false); setActionModal(null); setBulkRemarks(""); },
    onError: (error: any) => { toast.error(error.response?.data?.message || "Bulk approval failed"); },
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet); setSelectAll(newSet.size === clearances.length);
  };
  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds(new Set()); setSelectAll(false); }
    else { setSelectedIds(new Set(clearances.map(c => c.id))); setSelectAll(true); }
  };

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title={`${officerIcons[officerRole] || ""} ${officerLabels[officerRole] || "Officer"} Dashboard`}
        description={`Manage clearance requests for your department.`}
        actions={<button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-glass-bg transition-colors text-sm"><RefreshCw className="w-4 h-4" /> Refresh</button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard title="Total" value={stats.total} icon={ClipboardCheck} gradient="from-blue-500 to-blue-600" delay={0} />
        <StatsCard title="Pending" value={stats.pending} icon={Clock} gradient="from-yellow-500 to-yellow-600" delay={0.05} />
        <StatsCard title="In Progress" value={stats.inProgress} icon={Activity} gradient="from-purple-500 to-purple-600" delay={0.1} />
        <StatsCard title="Approved" value={stats.approved} icon={CheckCircle2} gradient="from-green-500 to-green-600" delay={0.15} />
        <StatsCard title="Rejected" value={stats.rejected} icon={XCircle} gradient="from-red-500 to-red-600" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-primary" /> Status Overview</h2>
          <PieChart data={statusPieData} donut outerRadius={80} height={240} />
        </div>
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary" /> Weekly Processing</h2>
          <BarChart data={weeklyStats} dataKeys={[{ key: "approved", color: "#22c55e", label: "Approved" }, { key: "rejected", color: "#ef4444", label: "Rejected" }]} height={220} />
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input type="text" placeholder="Search by student name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["ALL", "PENDING", "IN_PROGRESS", "APPROVED", "REJECTED"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s === "ALL" ? "" : s)}
                className={cn("px-3 py-2 rounded-xl text-sm font-medium transition-all", (statusFilter === s || (s === "ALL" && !statusFilter)) ? "gradient-primary text-white" : "glass hover:bg-glass-bg")}>
                {s === "ALL" ? "All" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        {selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-glass-border flex items-center justify-between">
            <p className="text-sm text-foreground-secondary">{selectedIds.size} clearance(s) selected</p>
            <div className="flex gap-2">
              <button onClick={() => setActionModal({ type: "bulk-approve", ids: Array.from(selectedIds) })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 text-green-700 dark:text-green-400 font-medium text-sm hover:bg-green-500/30 transition-all">
                <ThumbsUp className="w-4 h-4" /> Approve All
              </button>
              <button onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass font-medium text-sm hover:bg-glass-bg transition-all">
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : clearances.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardCheck className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Clearance Requests</h3>
            <p className="text-sm text-foreground-secondary">{statusFilter ? `No ${statusFilter.toLowerCase()} requests found.` : "No requests match your search."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="p-4 text-left">
                    <button onClick={toggleSelectAll} className="p-1 hover:bg-glass-bg rounded transition-colors">
                      {selectAll ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-foreground-muted" />}
                    </button>
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Student</th>
                  <th className="p-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Dept</th>
                  <th className="p-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Level</th>
                  <th className="p-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right text-xs font-medium text-foreground-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clearances.map((clearance, i) => (
                  <motion.tr key={clearance.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-glass-border last:border-0 hover:bg-glass-bg/50 transition-colors">
                    <td className="p-4"><button onClick={() => toggleSelect(clearance.id)} className="p-1 hover:bg-glass-bg rounded transition-colors">
                      {selectedIds.has(clearance.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-foreground-muted" />}
                    </button></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-medium">
                          {clearance.student?.user?.firstName?.charAt(0) || ""}{clearance.student?.user?.lastName?.charAt(0) || ""}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{clearance.student?.user?.firstName} {clearance.student?.user?.lastName}</p>
                          <p className="text-xs text-foreground-muted">{clearance.student?.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4"><span className="text-sm">{clearance.student?.department?.code || "N/A"}</span></td>
                    <td className="p-4"><span className="text-sm">Lvl {clearance.student?.currentLevel}</span></td>
                    <td className="p-4"><span className="text-sm">{formatDate(clearance.submittedAt)}</span></td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", getStatusColor(clearance.status))}>
                        {clearance.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setActionModal({ type: "details", clearance })} className="p-2 hover:bg-glass-bg rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4 text-foreground-muted" />
                        </button>
                        {(clearance.status === "PENDING" || clearance.status === "IN_PROGRESS") && (
                          <>
                            <button onClick={() => { setActionModal({ type: "approve", clearance }); setRemarks(""); }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                              <ThumbsUp className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => { setActionModal({ type: "reject", clearance }); setRemarks(""); }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-medium hover:bg-red-500/30 transition-all">
                              <ThumbsDown className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ActivityFeed activities={recentActivities} title="Recent Activity" />
      <QuickActions actions={quickActions} />

      {actionModal?.type === "approve" && actionModal.clearance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-green-500/20"><ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
              <div><h3 className="text-lg font-semibold">Approve Clearance</h3><p className="text-sm text-foreground-secondary">{actionModal.clearance.student?.user?.firstName} {actionModal.clearance.student?.user?.lastName}</p></div>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add any remarks..." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => approveMutation.mutate({ id: actionModal.clearance!.id, remarks })} disabled={approveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all disabled:opacity-50">
                  {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </button>
                <button onClick={() => setActionModal(null)} className="px-4 py-2.5 rounded-xl glass font-medium hover:bg-glass-bg transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {actionModal?.type === "reject" && actionModal.clearance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20"><ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
              <div><h3 className="text-lg font-semibold">Reject Clearance</h3><p className="text-sm text-foreground-secondary">{actionModal.clearance.student?.user?.firstName} {actionModal.clearance.student?.user?.lastName}</p></div>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Reason for Rejection *</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Please provide a reason..." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all text-sm resize-none" required />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { if (!remarks.trim()) { toast.error("Please provide a reason"); return; } rejectMutation.mutate({ id: actionModal.clearance!.id, remarks }); }} disabled={rejectMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all disabled:opacity-50">
                  {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </button>
                <button onClick={() => setActionModal(null)} className="px-4 py-2.5 rounded-xl glass font-medium hover:bg-glass-bg transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {actionModal?.type === "bulk-approve" && actionModal.ids && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-green-500/20"><CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
              <div><h3 className="text-lg font-semibold">Bulk Approve</h3><p className="text-sm text-foreground-secondary">Approve {actionModal.ids.length} clearance request(s).</p></div>
            </div>
            <div className="space-y-4">
              <div className="glass p-3 rounded-xl max-h-32 overflow-y-auto">
                <p className="text-xs text-foreground-muted mb-2">Selected:</p>
                {actionModal.ids.map(id => { const c = clearances.find(cl => cl.id === id); return <p key={id} className="text-sm py-0.5">• {c?.student?.user?.firstName} {c?.student?.user?.lastName} ({c?.student?.studentId})</p>; })}
              </div>
              <div><label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
                <textarea value={bulkRemarks} onChange={(e) => setBulkRemarks(e.target.value)} placeholder="Add remarks for all..." rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-glass-border bg-glass-bg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => bulkApproveMutation.mutate({ ids: actionModal.ids!, remarks: bulkRemarks })} disabled={bulkApproveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all disabled:opacity-50">
                  {bulkApproveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                  {bulkApproveMutation.isPending ? "Approving..." : `Approve ${actionModal.ids.length}`}
                </button>
                <button onClick={() => setActionModal(null)} className="px-4 py-2.5 rounded-xl glass font-medium hover:bg-glass-bg transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {actionModal?.type === "details" && actionModal.clearance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Clearance Details</h3>
              <button onClick={() => setActionModal(null)} className="p-1 hover:bg-glass-bg rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="glass p-4 rounded-xl mb-4">
              <h4 className="text-sm font-medium text-foreground-muted mb-3">Student Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-foreground-muted">Name</p><p className="text-sm font-medium">{actionModal.clearance.student?.user?.firstName} {actionModal.clearance.student?.user?.lastName}</p></div>
                <div><p className="text-xs text-foreground-muted">ID</p><p className="text-sm font-medium">{actionModal.clearance.student?.studentId}</p></div>
                <div><p className="text-xs text-foreground-muted">Dept</p><p className="text-sm font-medium">{actionModal.clearance.student?.department?.name}</p></div>
                <div><p className="text-xs text-foreground-muted">Level</p><p className="text-sm font-medium">Level {actionModal.clearance.student?.currentLevel}</p></div>
              </div>
            </div>
            <button onClick={() => setActionModal(null)} className="w-full px-4 py-2.5 rounded-xl glass font-medium hover:bg-glass-bg transition-colors">Close</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
