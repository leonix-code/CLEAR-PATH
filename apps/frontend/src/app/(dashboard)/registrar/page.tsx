"use client";

import { useState } from "react";
import {
  Users, GraduationCap, BookOpen, Calendar, CheckCircle2,
  Clock, TrendingUp, Activity, FileText, Bell, UserPlus, Award,
  ClipboardCheck,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Announcements } from "@/components/dashboard/announcements";
import { DataTable } from "@/components/dashboard/data-table";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { cn } from "@/lib/utils";
import Link from "next/link";

const semesterTrend = [
  { name: "2019/20", enrolled: 450, registered: 420, cleared: 380 },
  { name: "2020/21", enrolled: 520, registered: 490, cleared: 450 },
  { name: "2021/22", enrolled: 580, registered: 550, cleared: 510 },
  { name: "2022/23", enrolled: 610, registered: 580, cleared: 540 },
  { name: "2023/24", enrolled: 650, registered: 620, cleared: 580 },
  { name: "2024/25", enrolled: 700, registered: 665, cleared: 620 },
];

const departmentEnrollment = [
  { name: "CS", enrolled: 180, registered: 165 },
  { name: "ENG", enrolled: 145, registered: 132 },
  { name: "BUS", enrolled: 130, registered: 118 },
  { name: "MED", enrolled: 155, registered: 148 },
  { name: "LAW", enrolled: 90, registered: 82 },
];

const genderData = [
  { name: "Male", value: 420, color: "#6366f1" },
  { name: "Female", value: 380, color: "#ec4899" },
];

const recentEnrollments = [
  { id: "1", name: "John Smith", sid: "CSC2025001", dept: "CS", level: "100", date: "2025-01-15", status: "REGISTERED" },
  { id: "2", name: "Jane Doe", sid: "ENG2025002", dept: "ENG", level: "100", date: "2025-01-14", status: "REGISTERED" },
  { id: "3", name: "Bob Johnson", sid: "BUS2025003", dept: "BUS", level: "100", date: "2025-01-14", status: "PENDING" },
  { id: "4", name: "Alice Brown", sid: "MED2025004", dept: "MED", level: "100", date: "2025-01-13", status: "REGISTERED" },
  { id: "5", name: "Charlie Wilson", sid: "LAW2025005", dept: "LAW", level: "100", date: "2025-01-12", status: "REGISTERED" },
];

const activities = [
  { id: "a1", action: "New student enrollment", description: "John Smith - CSC2025001", user: "System", time: "10 mins ago", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "a2", action: "Bulk registration completed", description: "45 students registered for Semester 1", user: "Registrar", time: "25 mins ago", icon: ClipboardCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  { id: "a3", action: "Academic calendar updated", user: "Admin", time: "1 hour ago", icon: Calendar, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { id: "a4", action: "Transcript request processed", user: "System", time: "2 hours ago", icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  { id: "a5", action: "Department report generated", user: "System", time: "3 hours ago", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
];

const announcements = [
  { id: "a1", title: "Registration Deadline Extended", message: "The registration deadline for the 2025/2026 academic year has been extended to February 15th.", time: "1 day ago", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/5", dismissible: true },
  { id: "a2", title: "New Academic Year", message: "Academic records from the previous year are now archived. New enrollment is open.", time: "3 days ago", icon: Award, color: "text-green-500", bg: "bg-green-500/5", dismissible: true },
];

export default function RegistrarDashboard() {
  const [timeRange, setTimeRange] = useState("year");

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Registrar Dashboard"
        description="Student enrollment, registration management, and academic records oversight."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-foreground-muted" />
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
                className="bg-transparent border-none outline-none text-sm cursor-pointer">
                <option value="semester">This Semester</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <Link href="/registrar/reports" className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all">
              <FileText className="w-4 h-4" /> Export
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Students" value={800} icon={Users} gradient="from-blue-500 to-blue-600" delay={0} trend={{ value: 12, positive: true }} />
        <StatsCard title="Enrolled This Year" value={245} icon={GraduationCap} gradient="from-green-500 to-green-600" delay={0.05} trend={{ value: 8, positive: true }} />
        <StatsCard title="Registered" value={665} icon={ClipboardCheck} gradient="from-cyan-500 to-cyan-600" delay={0.1} suffix="/800" />
        <StatsCard title="Cleared" value={620} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-600" delay={0.15} suffix="/800" />
      </div>

      <Announcements announcements={announcements} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Enrollment & Registration Trend
          </h2>
          <AreaChart data={semesterTrend} dataKeys={[{ key: "enrolled", color: "#6366f1", label: "Enrolled" }, { key: "registered", color: "#22c55e", label: "Registered" }, { key: "cleared", color: "#06b6d4", label: "Cleared" }]} height={280} />
        </div>
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            Student Demographics
          </h2>
          <PieChart data={genderData} donut outerRadius={85} height={280} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {genderData.map(d => (
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
            <BookOpen className="w-5 h-5 text-primary" />
            Department Enrollment
          </h2>
          <BarChart data={departmentEnrollment} dataKeys={[{ key: "enrolled", color: "#6366f1", label: "Enrolled" }, { key: "registered", color: "#22c55e", label: "Registered" }]} height={250} />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Enrollments</h2>
          <DataTable
            columns={[
              { key: "name", label: "Name", sortable: true },
              { key: "sid", label: "ID", sortable: true },
              { key: "dept", label: "Dept", sortable: true, hideable: true },
              { key: "level", label: "Level", sortable: true, hideable: true },
              { key: "date", label: "Date", sortable: true, hideable: true },
              { key: "status", label: "Status", sortable: true, render: (v: string) => (
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium",
                  v === "REGISTERED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400")}>{v}</span>
              )},
            ]}
            data={recentEnrollments}
            pageSize={5}
            searchPlaceholder="Search students..."
          />
        </div>
      </div>

      <ActivityFeed activities={activities} title="Recent Activity" />
    </div>
  );
}
