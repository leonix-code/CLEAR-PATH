"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck, FileCheck, CheckCircle2, Clock, XCircle,
  Download, Award, Calendar, ChevronRight, Loader2, Send, FileText,
  TrendingUp, BookOpen, Star, AlertTriangle, Activity,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/providers/providers";
import { cn, getStatusColor, formatDate, CLEARANCE_STEPS } from "@/lib/utils";
import { toast } from "sonner";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Announcements } from "@/components/dashboard/announcements";
import { Timeline } from "@/components/dashboard/timeline";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart } from "@/components/charts/pie-chart";

interface ClearanceRequest {
  id: string; status: string; remarks?: string; submittedAt: string; completedAt?: string;
  semester?: { name: string; academicYear?: { year: string } };
  approvals?: { id: string; status: string; remarks?: string; approvedAt?: string; officer?: { firstName: string; lastName: string; role: string } }[];
}

interface StudentProfile {
  id: string; studentId: string; currentLevel: number; cgpa?: number;
  department?: { name: string; code: string }; course?: { name: string; code: string };
  clearanceRequests?: ClearanceRequest[];
}

const activityTrend = [
  { name: "Week 1", submitted: 1, approved: 0 },
  { name: "Week 2", submitted: 0, approved: 1 },
  { name: "Week 3", submitted: 0, approved: 0 },
  { name: "Week 4", submitted: 0, approved: 0 },
  { name: "Week 5", submitted: 1, approved: 1 },
  { name: "Week 6", submitted: 0, approved: 0 },
  { name: "Week 7", submitted: 1, approved: 1 },
];

const clearanceStatusData = [
  { name: "Approved", value: 3, color: "#22c55e" },
  { name: "Pending", value: 1, color: "#f59e0b" },
  { name: "In Progress", value: 2, color: "#3b82f6" },
];

const recentActivities = [
  { id: "a1", action: "Clearance approved by Finance Office", user: "Finance Officer", time: "2 days ago", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
  { id: "a2", action: "Clearance submitted for Semester 1", user: "You", time: "1 week ago", icon: Send, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "a3", action: "Certificate downloaded", user: "You", time: "2 weeks ago", icon: Download, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
];

const announcements = [
  { id: "a1", title: "Clearance Deadline Approaching", message: "Submit your clearance before December 15th to be eligible for exams.", time: "3 days ago", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/5", dismissible: true },
  { id: "a2", title: "New Semester Registration", message: "Registration for the next semester is now open. Complete clearance first.", time: "1 week ago", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/5", dismissible: true },
];

const timelineItems = [
  { id: "t1", title: "Clearance Submitted", description: "Your clearance request was submitted successfully", time: "2 weeks ago", icon: Send, color: "text-blue-500", status: "complete" as const },
  { id: "t2", title: "Finance Office Cleared", description: "Finance verification completed", time: "1 week ago", icon: CheckCircle2, color: "text-green-500", status: "complete" as const },
  { id: "t3", title: "Library Verification", description: "Pending library clearance review", time: "Current", icon: Clock, color: "text-amber-500", status: "current" as const },
  { id: "t4", title: "Department Approval", description: "Awaiting department officer review", time: "Upcoming", icon: BookOpen, color: "text-foreground-muted", status: "pending" as const },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState<ClearanceRequest | null>(null);

  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const res = await apiService.students.getMe();
      return res.data?.data || res.data;
    },
  });

  const student: StudentProfile | undefined = studentData;

  const submitMutation = useMutation({
    mutationFn: async (semesterId: string) => {
      const res = await apiService.clearance.create(semesterId);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Clearance request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      queryClient.invalidateQueries({ queryKey: ["clearance-stats"] });
      setShowSubmitModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit clearance");
    },
  });

  const clearances = student?.clearanceRequests || [];
  const latestClearance = clearances[0];
  const pendingCount = clearances.filter(c => c.status === "PENDING").length;
  const approvedCount = clearances.filter(c => c.status === "APPROVED").length;

  if (studentLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Student Dashboard"
        description={`Welcome back, ${user?.firstName || "Student"}! Track your clearance and exam eligibility.`}
        actions={(!latestClearance || latestClearance.status === "APPROVED" || latestClearance.status === "REJECTED") && (
          <Button onClick={() => setShowSubmitModal(true)}>
            <Send className="w-4 h-4" /> Submit New Clearance
          </Button>
        )}
      />

      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start gap-4 pt-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-foreground-secondary">{student?.studentId} | Level {student?.currentLevel} | {student?.department?.name}</p>
            <p className="text-sm text-foreground-secondary">{student?.course?.name} | CGPA: {student?.cgpa || "N/A"}</p>
          </div>
          <Badge variant="primary" size="lg">
            {student?.currentLevel ? `Level ${student.currentLevel}` : "Student"}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Clearances" value={clearances.length} icon={ClipboardCheck} gradient="from-brand-500 to-purple-500" delay={0} />
        <StatsCard title="Approved" value={approvedCount} icon={CheckCircle2} gradient="from-emerald-500 to-green-500" delay={0.05} />
        <StatsCard title="Pending" value={pendingCount} icon={Clock} gradient="from-amber-500 to-yellow-500" delay={0.1} />
        <StatsCard title="CGPA" value={student?.cgpa || "N/A"} icon={Star} gradient="from-indigo-500 to-purple-500" delay={0.15} subtitle={student?.cgpa ? "Current GPA" : undefined} />
      </div>

      <Announcements announcements={announcements} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Activity Overview
          </h2>
          <PieChart data={clearanceStatusData} donut outerRadius={75} height={250} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {clearanceStatusData.map(d => (
              <div key={d.name} className="text-center">
                <p className="text-sm font-bold">{d.value}</p>
                <p className="text-[10px] text-foreground-muted">{d.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Clearance Progress Timeline
          </h2>
          <AreaChart data={activityTrend} dataKeys={[{ key: "submitted", color: "#6366f1", label: "Submitted" }, { key: "approved", color: "#22c55e", label: "Approved" }]} height={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {latestClearance ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                  Current Clearance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("p-4 rounded-xl mb-6 flex items-center justify-between", getStatusColor(latestClearance.status))}>
                  <div className="flex items-center gap-3">
                    {latestClearance.status === "APPROVED" ? <CheckCircle2 className="w-6 h-6" /> :
                     latestClearance.status === "REJECTED" ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    <div>
                      <p className="font-semibold">
                        {latestClearance.status === "APPROVED" ? "Fully Cleared" :
                         latestClearance.status === "REJECTED" ? "Rejected" :
                         latestClearance.status === "IN_PROGRESS" ? "In Progress" : "Pending Review"}
                      </p>
                      <p className="text-sm opacity-75">Submitted {formatDate(latestClearance.submittedAt)}</p>
                    </div>
                  </div>
                  <Badge variant={latestClearance.status === "APPROVED" ? "success" : latestClearance.status === "REJECTED" ? "danger" : "warning"}>
                    {latestClearance.status}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {CLEARANCE_STEPS.map((step, i) => {
                    const approval = latestClearance.approvals?.find(a => a.officer?.role === step.key);
                    const status = approval?.status || "PENDING";
                    const isComplete = status === "APPROVED";
                    const isRejected = status === "REJECTED";
                    return (
                      <div key={step.key} className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-glass-bg transition-colors">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0",
                          isComplete ? "bg-emerald-500/20 text-emerald-600" :
                          isRejected ? "bg-red-500/20 text-red-600" : "bg-brand-500/20 text-brand-600")}>
                          {isComplete ? "✓" : isRejected ? "✗" : step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{step.label}</p>
                          {approval?.remarks && <p className="text-xs text-foreground-secondary mt-0.5">{approval.remarks}</p>}
                        </div>
                        <Badge variant={isComplete ? "success" : isRejected ? "danger" : "warning"} size="sm">
                          {status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <ClipboardCheck className="w-12 h-12 text-foreground-muted mx-auto mb-4 opacity-40" />
                <h3 className="font-semibold mb-2">No Clearance Requests</h3>
                <p className="text-sm text-foreground-secondary mb-6">You have not submitted any clearance requests yet.</p>
                <Button onClick={() => setShowSubmitModal(true)}>
                  <Send className="w-4 h-4" /> Submit Your First Clearance
                </Button>
              </CardContent>
            </Card>
          )}

          {clearances.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Clearance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clearances.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => setSelectedClearance(c)}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-lg hover:bg-glass-bg transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(c.status).split(" ")[0])} />
                        <span className="text-sm">{c.semester?.name || "Clearance"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={c.status === "APPROVED" ? "success" : c.status === "REJECTED" ? "danger" : "warning"} size="sm">{c.status}</Badge>
                        <ChevronRight className="w-4 h-4 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileCheck className="w-5 h-5 text-primary" />Exam Eligibility</CardTitle>
            </CardHeader>
            <CardContent>
              {latestClearance?.status === "APPROVED" ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">Eligible for Exams</p>
                  <p className="text-xs text-foreground-secondary mt-2">You have been cleared and are eligible to sit for examinations.</p>
                </div>
              ) : latestClearance ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">Pending Clearance</p>
                  <p className="text-xs text-foreground-secondary mt-2">Your clearance is still in progress.</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-neutral-500/20 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-foreground-muted" />
                  </div>
                  <p className="font-semibold">Not Yet Eligible</p>
                  <p className="text-xs text-foreground-secondary mt-2">Submit a clearance request to check your exam eligibility.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="glass-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              Journey Timeline
            </h3>
            <Timeline items={timelineItems} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {latestClearance?.status === "APPROVED" && (
                <Button variant="secondary" className="w-full justify-start"><Download className="w-4 h-4" /> Download Certificate</Button>
              )}
              <Button variant="secondary" className="w-full justify-start"><Calendar className="w-4 h-4" /> View Exam Schedule</Button>
              <Button variant="secondary" className="w-full justify-start"><FileText className="w-4 h-4" /> Requirements Checklist</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ActivityFeed activities={recentActivities} title="Recent Activity" />

      <Dialog open={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Clearance Request" description="Submit a new clearance request for the current semester." size="sm">
        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">By submitting, you agree to the clearance terms and conditions. Your request will be processed by the respective department officers.</p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
            <Button loading={submitMutation.isPending} onClick={() => submitMutation.mutate("current-semester")}>Submit Request</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!selectedClearance} onClose={() => setSelectedClearance(null)} title="Clearance Details" size="md">
        {selectedClearance && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={selectedClearance.status === "APPROVED" ? "success" : selectedClearance.status === "REJECTED" ? "danger" : "warning"} size="lg">{selectedClearance.status}</Badge>
              <span className="text-sm text-foreground-secondary">{formatDate(selectedClearance.submittedAt)}</span>
            </div>
            {selectedClearance.remarks && <p className="text-sm p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">{selectedClearance.remarks}</p>}
            <div className="space-y-2">
              <p className="text-sm font-medium">Approvals</p>
              {selectedClearance.approvals?.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-glass-bg">
                  <div><p className="text-sm font-medium">{a.officer?.role?.replace(/_/g, " ")}</p><p className="text-xs text-foreground-secondary">{a.officer?.firstName} {a.officer?.lastName}</p></div>
                  <Badge variant={a.status === "APPROVED" ? "success" : a.status === "REJECTED" ? "danger" : "warning"} size="sm">{a.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
