"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Building2,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  Bell,
  Settings,
  FileText,
  Database,
  Activity,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Announcements } from "@/components/dashboard/announcements";
import { DataTable } from "@/components/dashboard/data-table";
import { Timeline } from "@/components/dashboard/timeline";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { BarChart } from "@/components/charts/bar-chart";

interface DashboardStats {
  totalUsers: number; totalStudents: number; totalDepartments: number;
  totalClearances: number; approvedClearances: number; pendingClearances: number;
  rejectedClearances: number; totalOfficers: number; approvalRate: string;
}

const trendData = [
  { name: "Mon", submitted: 12, approved: 8 },
  { name: "Tue", submitted: 19, approved: 15 },
  { name: "Wed", submitted: 8, approved: 6 },
  { name: "Thu", submitted: 15, approved: 12 },
  { name: "Fri", submitted: 22, approved: 18 },
  { name: "Sat", submitted: 5, approved: 4 },
  { name: "Sun", submitted: 3, approved: 3 },
];

const departmentData = [
  { name: "Computer Science", students: 120, clearances: 85 },
  { name: "Engineering", students: 95, clearances: 72 },
  { name: "Business", students: 88, clearances: 65 },
  { name: "Medicine", students: 110, clearances: 90 },
  { name: "Law", students: 65, clearances: 48 },
];

const clearancePieData = [
  { name: "Approved", value: 145, color: "#22c55e" },
  { name: "Pending", value: 65, color: "#f59e0b" },
  { name: "Rejected", value: 28, color: "#ef4444" },
  { name: "In Progress", value: 42, color: "#3b82f6" },
];

const quickActions = [
  { title: "Manage Users", description: "Create, edit, or deactivate accounts", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", link: "/admin/users" },
  { title: "Departments", description: "Manage departments and assign heads", icon: Building2, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", link: "/admin/departments" },
  { title: "Reports", description: "View and export system reports", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", link: "/admin/reports" },
  { title: "System Settings", description: "Configure system parameters", icon: Settings, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20", link: "/admin/settings" },
  { title: "Backup Database", description: "Create or restore database backups", icon: Database, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", link: "/admin/backup" },
  { title: "Audit Logs", description: "View system audit trail", icon: Shield, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", link: "/admin/audit-logs" },
];

const announcements = [
  { id: "a1", title: "New Academic Year", message: "Registration for the 2025/2026 academic year is now open. Clearance deadlines have been updated.", time: "2 hours ago", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/5", dismissible: true },
  { id: "a2", title: "System Maintenance", message: "Scheduled maintenance this Saturday from 2-4 AM. The system will be temporarily unavailable.", time: "1 day ago", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/5", dismissible: true },
  { id: "a3", title: "Bulk Clearance Update", message: "Finance officers can now process batch clearances. Check the new bulk approval feature.", time: "3 days ago", icon: Megaphone, color: "text-purple-500", bg: "bg-purple-500/5", dismissible: false },
];

const recentClearances = [
  { id: "1", student: "John Smith", studentId: "CSC2021001", dept: "CS", level: "400", submitted: "2025-01-15", status: "APPROVED" },
  { id: "2", student: "Jane Doe", studentId: "ENG2022005", dept: "ENG", level: "300", submitted: "2025-01-14", status: "PENDING" },
  { id: "3", student: "Bob Johnson", studentId: "BUS2023010", dept: "BUS", level: "200", submitted: "2025-01-14", status: "REJECTED" },
  { id: "4", student: "Alice Brown", studentId: "MED2020003", dept: "MED", level: "500", submitted: "2025-01-13", status: "IN_PROGRESS" },
  { id: "5", student: "Charlie Wilson", studentId: "LAW2022008", dept: "LAW", level: "300", submitted: "2025-01-12", status: "APPROVED" },
];

const timelineItems = [
  { id: "t1", title: "System Backup Completed", description: "Full database backup completed successfully. 2.4GB compressed.", time: "2 hours ago", icon: Database, color: "text-green-500", status: "complete" as const },
  { id: "t2", title: "Bulk Approval Processed", description: "15 clearance requests approved by Finance Officer.", time: "4 hours ago", icon: CheckCircle2, color: "text-blue-500", status: "complete" as const },
  { id: "t3", title: "New Student Registrations", description: "23 new students registered through the portal.", time: "6 hours ago", icon: UserPlus, color: "text-purple-500", status: "current" as const },
  { id: "t4", title: "Department Review Pending", description: "3 departments pending head assignment for new term.", time: "1 day ago", icon: Building2, color: "text-amber-500", status: "pending" as const },
];

const activities = [
  { id: "act1", action: "New clearance request submitted", description: "John Smith submitted clearance for Semester 1", user: "John Smith", time: "10 mins ago", icon: ClipboardCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "act2", action: "Bulk approval completed", description: "15 clearances approved by Finance Officer", user: "Finance Officer", time: "25 mins ago", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  { id: "act3", action: "New user registered", user: "Admin", time: "1 hour ago", icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { id: "act4", action: "System backup completed", user: "System", time: "2 hours ago", icon: Database, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  { id: "act5", action: "Department updated", description: "Computer Science department details updated", user: "Admin", time: "3 hours ago", icon: Building2, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
];

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("7d");

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const response = await apiService.analytics?.getDashboardStats();
      return response?.data?.data || response?.data || {
        totalUsers: 1248, totalStudents: 1056, totalDepartments: 12,
        totalClearances: 280, approvedClearances: 145, pendingClearances: 65,
        rejectedClearances: 28, totalOfficers: 32, approvalRate: "67.8"
      };
    },
  });

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Admin Dashboard"
        description="Welcome back! Here's a comprehensive overview of your clearance system."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
              <RefreshCw className="w-4 h-4 text-foreground-muted" />
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-none outline-none text-sm cursor-pointer">
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <button className="glass p-2.5 rounded-xl hover:bg-glass-bg transition-colors">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="skeleton h-[120px] rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} gradient="from-blue-500 to-blue-600" href="/admin/users" delay={0} trend={{ value: 12, positive: true }} />
          <StatsCard title="Students" value={stats?.totalStudents || 0} icon={GraduationCap} gradient="from-green-500 to-green-600" href="/admin/students" delay={0.05} trend={{ value: 8, positive: true }} />
          <StatsCard title="Departments" value={stats?.totalDepartments || 0} icon={Building2} gradient="from-purple-500 to-purple-600" href="/admin/departments" delay={0.1} />
          <StatsCard title="Clearances" value={stats?.totalClearances || 0} icon={ClipboardCheck} gradient="from-cyan-500 to-cyan-600" href="/admin/clearance" delay={0.15} trend={{ value: 23, positive: true }} />
          <StatsCard title="Approved" value={stats?.approvedClearances || 0} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-600" href="/admin/clearance?status=APPROVED" delay={0.2} />
          <StatsCard title="Pending" value={stats?.pendingClearances || 0} icon={Clock} gradient="from-yellow-500 to-yellow-600" href="/admin/clearance?status=PENDING" delay={0.25} />
          <StatsCard title="Rejected" value={stats?.rejectedClearances || 0} icon={XCircle} gradient="from-red-500 to-red-600" href="/admin/clearance?status=REJECTED" delay={0.3} />
          <StatsCard title="Approval Rate" value={stats?.approvalRate || "0"} icon={Activity} gradient="from-indigo-500 to-indigo-600" href="/admin/reports" delay={0.35} suffix="%" trend={{ value: 5, positive: true }} />
        </div>
      )}

      <Announcements announcements={announcements} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Clearance Trend
          </h2>
          <AreaChart data={trendData} dataKeys={[{ key: "submitted", color: "#6366f1", label: "Submitted" }, { key: "approved", color: "#22c55e", label: "Approved" }]} height={280} />
        </div>
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            Distribution
          </h2>
          <PieChart data={clearancePieData} donut outerRadius={90} height={280} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {clearancePieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-foreground-secondary">{d.name}</span>
                <span className="font-medium ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            Department Overview
          </h2>
          <BarChart data={departmentData} dataKeys={[{ key: "students", color: "#6366f1", label: "Students" }, { key: "clearances", color: "#22c55e", label: "Clearances" }]} height={220} />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Clearances</h2>
          <DataTable
            columns={[
              { key: "student", label: "Student", sortable: true },
              { key: "studentId", label: "ID", sortable: true },
              { key: "dept", label: "Dept", sortable: true, hideable: true },
              { key: "level", label: "Level", sortable: true, hideable: true },
              { key: "submitted", label: "Submitted", sortable: true, hideable: true },
              { key: "status", label: "Status", sortable: true, render: (v: string) => (
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium",
                  v === "APPROVED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                  v === "PENDING" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  v === "REJECTED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                )}>{v.replace(/_/g, " ")}</span>
              )},
            ]}
            data={recentClearances}
            pageSize={5}
            searchPlaceholder="Search clearances..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityFeed activities={activities} />
        <QuickActions actions={quickActions} className="lg:col-span-2" />
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          System Timeline
        </h2>
        <Timeline items={timelineItems} />
      </div>
    </div>
  );
}
