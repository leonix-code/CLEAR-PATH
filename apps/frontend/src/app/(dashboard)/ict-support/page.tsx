"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Building2, BookOpen, Settings, Database, Server,
  Shield, Activity, Bell, Search, Loader2, UserPlus,
  HardDrive, Terminal, Monitor, Wrench, Calendar,
  RefreshCw, CheckCircle2, AlertTriangle, Clock, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Timeline } from "@/components/dashboard/timeline";
import { BarChart } from "@/components/charts/bar-chart";

interface SystemMetrics {
  totalUsers: number; totalStudents: number; totalDepartments: number; totalCourses: number;
  activeSessions: number; storageUsedGB: number; uptime: string; lastBackup: string; pendingIssues: number;
}

const quickActions = [
  { title: "Manage Users", description: "Create, edit, or deactivate accounts", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", link: "/ict-support/users" },
  { title: "Departments", description: "Manage departments and assign heads", icon: Building2, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", link: "/ict-support/departments" },
  { title: "Courses", description: "Manage course offerings", icon: BookOpen, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20", link: "/ict-support/courses" },
  { title: "System Settings", description: "Configure system parameters", icon: Settings, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20", link: "/ict-support/settings" },
  { title: "Academic Years", description: "Manage academic years and semesters", icon: Calendar, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", link: "/ict-support/academic-years" },
];

const systemServices = [
  { label: "PostgreSQL Database", icon: Database, status: "healthy", uptime: "99.9%", color: "text-green-500" },
  { label: "Redis Cache", icon: Server, status: "healthy", uptime: "100%", color: "text-green-500" },
  { label: "Storage Volume", icon: HardDrive, status: "healthy", usage: "64%", color: "text-green-500" },
  { label: "Email Service", icon: Terminal, status: "healthy", uptime: "99.5%", color: "text-green-500" },
  { label: "API Gateway", icon: Cpu, status: "warning", uptime: "98.2%", color: "text-amber-500" },
  { label: "CDN Cache", icon: Monitor, status: "healthy", uptime: "100%", color: "text-green-500" },
];

const userGrowthData = [
  { name: "Jan", users: 1200, students: 980 },
  { name: "Feb", users: 1350, students: 1050 },
  { name: "Mar", users: 1420, students: 1100 },
  { name: "Apr", users: 1480, students: 1120 },
  { name: "May", users: 1550, students: 1180 },
  { name: "Jun", users: 1620, students: 1240 },
];

const systemLogs = [
  { id: "l1", action: "Database backup completed", user: "System", time: "2 hours ago", icon: Database, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  { id: "l2", action: "User session cleanup", description: "12 stale sessions removed", user: "System", time: "4 hours ago", icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "l3", action: "New department added", user: "Admin", time: "6 hours ago", icon: Building2, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { id: "l4", action: "Cache cleared", user: "System", time: "8 hours ago", icon: Server, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  { id: "l5", action: "SSL certificate renewed", user: "System", time: "1 day ago", icon: Shield, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
];

const timelineItems = [
  { id: "t1", title: "Database Backup Completed", description: "Full backup: 2.4GB compressed, 45s duration", time: "2 hours ago", icon: Database, color: "text-green-500", status: "complete" as const },
  { id: "t2", title: "Server Health Check", description: "All services operational. Response time: 125ms", time: "3 hours ago", icon: Server, color: "text-blue-500", status: "complete" as const },
  { id: "t3", title: "Scheduled Maintenance", description: "Redis cluster upgrade scheduled for Saturday", time: "5 hours ago", icon: Wrench, color: "text-purple-500", status: "current" as const },
  { id: "t4", title: "User Import", description: "45 new student accounts imported from CSV", time: "1 day ago", icon: Users, color: "text-amber-500", status: "pending" as const },
];

export default function ICTSupportDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: metrics, isLoading } = useQuery<SystemMetrics>({
    queryKey: ["ict-support-stats"],
    queryFn: async () => ({
      totalUsers: 1620, totalStudents: 1240, totalDepartments: 12, totalCourses: 48,
      activeSessions: 234, storageUsedGB: 64, uptime: "99.97%", lastBackup: "2 hours ago", pendingIssues: 2
    }),
  });

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="ICT Support Dashboard"
        description="System administration, user management, and infrastructure monitoring."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
              <Search className="w-4 h-4 text-foreground-muted" />
              <input type="text" placeholder="Quick search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-32" />
            </div>
            <button className="glass p-2.5 rounded-xl hover:bg-glass-bg transition-colors relative">
              <Bell className="w-4 h-4" />
              {metrics?.pendingIssues ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {metrics.pendingIssues}
                </span>
              ) : null}
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-[100px] rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={metrics?.totalUsers || 0} icon={Users} gradient="from-blue-500 to-blue-600" delay={0} />
          <StatsCard title="Students" value={metrics?.totalStudents || 0} icon={Monitor} gradient="from-green-500 to-green-600" delay={0.05} />
          <StatsCard title="Departments" value={metrics?.totalDepartments || 0} icon={Building2} gradient="from-purple-500 to-purple-600" delay={0.1} />
          <StatsCard title="Active Sessions" value={metrics?.activeSessions || 0} icon={Activity} gradient="from-cyan-500 to-cyan-600" delay={0.15} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-primary" />
            System Services
          </h2>
          <div className="space-y-3">
            {systemServices.map((svc) => (
              <div key={svc.label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-glass-bg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-glass-bg flex items-center justify-center">
                    <svc.icon className={cn("w-4 h-4", svc.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{svc.label}</p>
                    <p className="text-[10px] text-foreground-muted">{svc.uptime ? `Uptime: ${svc.uptime}` : `Usage: ${svc.usage}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", svc.status === "healthy" ? "bg-green-500" : "bg-amber-500")} />
                  <span className={cn("text-xs font-medium", svc.color)}>
                    {svc.status === "healthy" ? "Healthy" : "Warning"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            User Growth - 6 Month Trend
          </h2>
          <BarChart data={userGrowthData} dataKeys={[{ key: "users", color: "#6366f1", label: "Users" }, { key: "students", color: "#22c55e", label: "Students" }]} height={280} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityFeed activities={systemLogs} title="System Logs" />
        <QuickActions actions={quickActions} className="lg:col-span-2" />
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          Recent Operations
        </h2>
        <Timeline items={timelineItems} />
      </div>
    </div>
  );
}
