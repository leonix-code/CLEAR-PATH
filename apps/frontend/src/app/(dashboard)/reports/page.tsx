"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, PieChart, BarChart3, Calendar,
  RefreshCw, Loader2, Search, FileSpreadsheet,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DataTable } from "@/components/dashboard/data-table";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart as PieChartComponent } from "@/components/charts/pie-chart";
import { BarChart as BarChartComponent } from "@/components/charts/bar-chart";
import { cn } from "@/lib/utils";

const reportTypes = [
  { id: "clearances", label: "Clearance Requests", icon: FileText },
  { id: "students", label: "Students", icon: BarChart3 },
  { id: "approvals", label: "Approvals", icon: PieChart },
  { id: "audit", label: "Audit Logs", icon: RefreshCw },
];

const trendData = [
  { name: "Mon", submitted: 12, approved: 8 },
  { name: "Tue", submitted: 19, approved: 15 },
  { name: "Wed", submitted: 8, approved: 6 },
  { name: "Thu", submitted: 15, approved: 12 },
  { name: "Fri", submitted: 22, approved: 18 },
  { name: "Sat", submitted: 5, approved: 4 },
  { name: "Sun", submitted: 3, approved: 3 },
];

const deptData = [
  { name: "CS", clearances: 85, approved: 72 },
  { name: "ENG", clearances: 72, approved: 60 },
  { name: "BUS", clearances: 65, approved: 55 },
  { name: "MED", clearances: 90, approved: 82 },
  { name: "LAW", clearances: 48, approved: 40 },
];

const statusData = [
  { name: "Approved", value: 145, color: "#22c55e" },
  { name: "Pending", value: 65, color: "#f59e0b" },
  { name: "Rejected", value: 28, color: "#ef4444" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("clearances");
  const [timeRange, setTimeRange] = useState("7d");

  const exportReport = useCallback((format: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    const params = new URLSearchParams({ type: reportType, _t: Date.now().toString() });
    window.open(baseUrl + "/" + format + "?" + params.toString(), "_blank");
  }, [reportType]);

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Reports & Analytics"
        description="Generate, view, and export system reports."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-foreground-muted" />
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
                className="bg-transparent border-none outline-none text-sm cursor-pointer">
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {reportTypes.map(type => (
          <button key={type.id} onClick={() => setReportType(type.id)}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              reportType === type.id ? "gradient-primary text-white shadow-lg shadow-primary/25" : "glass hover:bg-glass-bg")}>
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            Clearance Trend
          </h2>
          <AreaChart data={trendData} dataKeys={[{ key: "submitted", color: "#6366f1", label: "Submitted" }, { key: "approved", color: "#22c55e", label: "Approved" }]} height={280} />
        </div>
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            Distribution
          </h2>
          <PieChartComponent data={statusData} donut outerRadius={85} height={280} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {statusData.map(d => (
              <div key={d.name} className="text-center">
                <p className="text-sm font-bold">{d.value}</p>
                <p className="text-[10px] text-foreground-muted">{d.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          Department Clearance Comparison
        </h2>
        <BarChartComponent data={deptData} dataKeys={[{ key: "clearances", color: "#6366f1", label: "Clearances" }, { key: "approved", color: "#22c55e", label: "Approved" }]} height={250} />
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Export {reportTypes.find(t => t.id === reportType)?.label} Report</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => exportReport("reports/export/csv")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-glass-bg transition-all text-sm font-medium hover:-translate-y-0.5">
            <FileText className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => exportReport("reports/export/excel")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-glass-bg transition-all text-sm font-medium hover:-translate-y-0.5">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={() => exportReport("reports/export/pdf")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-glass-bg transition-all text-sm font-medium hover:-translate-y-0.5">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "student", label: "Student", sortable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "date", label: "Date", sortable: true, hideable: true },
        ]}
        data={[
          { id: "1", student: "John Smith", status: "APPROVED", date: "2025-01-15" },
          { id: "2", student: "Jane Doe", status: "PENDING", date: "2025-01-14" },
          { id: "3", student: "Bob Johnson", status: "REJECTED", date: "2025-01-13" },
          { id: "4", student: "Alice Brown", status: "APPROVED", date: "2025-01-12" },
          { id: "5", student: "Charlie Wilson", status: "IN_PROGRESS", date: "2025-01-11" },
        ]}
        pageSize={5}
        searchable
        searchPlaceholder="Search reports..."
        exportable
      />
    </div>
  );
}
