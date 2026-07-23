"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp, ClipboardCheck, CheckCircle2, Clock, Users,
  GraduationCap, Activity, FileText, Calendar, Loader2,
  AlertTriangle, Shield, Download, RefreshCw,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DataTable } from "@/components/dashboard/data-table";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import Link from "next/link";

interface DashboardStats {
  totalClearances: number; approvedClearances: number; pendingClearances: number;
  rejectedClearances: number; totalStudents: number; approvalRate: string; totalOfficers: number;
}

const weeklyTrend = [
  { name: "Mon", submitted: 15, approved: 12, rejected: 1 },
  { name: "Tue", submitted: 22, approved: 18, rejected: 2 },
  { name: "Wed", submitted: 10, approved: 8, rejected: 0 },
  { name: "Thu", submitted: 18, approved: 14, rejected: 1 },
  { name: "Fri", submitted: 25, approved: 20, rejected: 3 },
  { name: "Sat", submitted: 6, approved: 5, rejected: 0 },
  { name: "Sun", submitted: 4, approved: 3, rejected: 0 },
];

const officerPerformanceData = [
  { name: "Finance", processed: 85, approved: 72 },
  { name: "Library", processed: 78, approved: 70 },
  { name: "Lab", processed: 62, approved: 55 },
  { name: "Sports", processed: 45, approved: 42 },
  { name: "Dept", processed: 92, approved: 80 },
];

const statusData = [
  { name: "Approved", value: 145, color: "#22c55e" },
  { name: "Pending", value: 65, color: "#f59e0b" },
  { name: "Rejected", value: 28, color: "#ef4444" },
  { name: "In Progress", value: 42, color: "#3b82f6" },
];

const recentActivities = [
  { id: "a1", action: "Bulk clearance approval completed", description: "15 clearances approved", user: "Finance Officer", time: "10 mins ago", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  { id: "a2", action: "New clearance request submitted", user: "Jane Student", time: "25 mins ago", icon: ClipboardCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "a3", action: "Department report generated", user: "System", time: "1 hour ago", icon: FileText, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { id: "a4", action: "Clearance deadline approaching", description: "Semester 1 deadline in 5 days", user: "System", time: "2 hours ago", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { id: "a5", action: "Weekly statistics compiled", user: "System", time: "3 hours ago", icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
];

const clearanceTableData = [
  { id: "1", name: "John Smith", sid: "CSC2021001", dept: "CS", officer: "Finance", status: "APPROVED", date: "2025-01-15" },
  { id: "2", name: "Jane Doe", sid: "ENG2022005", dept: "ENG", officer: "Lab", status: "PENDING", date: "2025-01-14" },
  { id: "3", name: "Bob Johnson", sid: "BUS2023010", dept: "BUS", officer: "Library", status: "REJECTED", date: "2025-01-14" },
  { id: "4", name: "Alice Brown", sid: "MED2020003", dept: "MED", officer: "Sports", status: "APPROVED", date: "2025-01-13" },
  { id: "5", name: "Charlie Wilson", sid: "LAW2022008", dept: "LAW", officer: "Dept", status: "APPROVED", date: "2025-01-12" },
  { id: "6", name: "Diana Lee", sid: "CSC2021007", dept: "CS", officer: "Finance", status: "IN_PROGRESS", date: "2025-01-11" },
];

export default function SupervisorDashboard() {
  const [timeRange, setTimeRange] = useState("7d");

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["supervisor-dashboard-stats"],
    queryFn: async () => {
      const response = await apiService.analytics?.getDashboardStats();
      return response?.data?.data || response?.data || {
        totalClearances: 280, approvedClearances: 145, pendingClearances: 65,
        rejectedClearances: 28, totalStudents: 1056, approvalRate: "67.8", totalOfficers: 32
      };
    },
  });

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Supervisor Dashboard"
        description="Monitor clearance system performance and generate analytical reports."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-foreground-muted" />
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-none outline-none text-sm cursor-pointer">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <Link href="/supervisor/reports" className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all">
              <FileText className="w-4 h-4" /> Reports
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-[120px] rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard title="Clearances" value={stats?.totalClearances || 0} icon={ClipboardCheck} gradient="from-cyan-500 to-cyan-600" href="/supervisor/reports" delay={0} />
          <StatsCard title="Approved" value={stats?.approvedClearances || 0} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-600" href="/supervisor/reports?status=APPROVED" delay={0.05} />
          <StatsCard title="Pending" value={stats?.pendingClearances || 0} icon={Clock} gradient="from-yellow-500 to-yellow-600" delay={0.1} />
          <StatsCard title="Approval Rate" value={stats?.approvalRate || "0"} icon={Activity} gradient="from-indigo-500 to-indigo-600" suffix="%" delay={0.15} />
          <StatsCard title="Students" value={stats?.totalStudents || 0} icon={GraduationCap} gradient="from-green-500 to-green-600" delay={0.2} />
          <StatsCard title="Officers" value={stats?.totalOfficers || 0} icon={Users} gradient="from-purple-500 to-purple-600" delay={0.25} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Clearance Trend - Weekly Overview
          </h2>
          <AreaChart data={weeklyTrend} dataKeys={[{ key: "submitted", color: "#6366f1", label: "Submitted" }, { key: "approved", color: "#22c55e", label: "Approved" }, { key: "rejected", color: "#ef4444", label: "Rejected" }]} height={280} />
        </div>
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            Status Distribution
          </h2>
          <PieChart data={statusData} donut outerRadius={85} height={280} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-foreground-secondary">{d.name}</span>
                <span className="font-medium ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            Officer Performance
          </h2>
          <BarChart data={officerPerformanceData} dataKeys={[{ key: "processed", color: "#6366f1", label: "Processed" }, { key: "approved", color: "#22c55e", label: "Approved" }]} height={250} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Clearances</h2>
          <DataTable
            columns={[
              { key: "name", label: "Student", sortable: true },
              { key: "sid", label: "ID", sortable: true },
              { key: "dept", label: "Dept", sortable: true, hideable: true },
              { key: "officer", label: "Officer", sortable: true, hideable: true },
              { key: "status", label: "Status", sortable: true, render: (v: string) => (
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium",
                  v === "APPROVED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                  v === "PENDING" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  v === "REJECTED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400")}>{v.replace(/_/g, " ")}</span>
              )},
              { key: "date", label: "Date", sortable: true, hideable: true },
            ]}
            data={clearanceTableData}
            pageSize={5}
            searchPlaceholder="Search clearances..."
          />
        </div>
      </div>

      <ActivityFeed activities={recentActivities} title="Recent Activity" />
    </div>
  );
}
