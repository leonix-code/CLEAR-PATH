"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, Lock, ArrowRight,
  DollarSign, BookOpen, FlaskConical, Trophy, Building2, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stage {
  stage: string;
  role: string;
  order: number;
  status: string;
  officer?: { name: string; role: string } | null;
  remarks?: string | null;
  approvedAt?: string | null;
  isActive: boolean;
  isComplete: boolean;
  isRejected: boolean;
}

interface WorkflowTimelineProps {
  stages: Stage[];
  progress: { total: number; completed: number; rejected: number; percentage: number };
  className?: string;
}

const roleIcons: Record<string, any> = {
  FINANCE_OFFICER: DollarSign,
  LIBRARY_OFFICER: BookOpen,
  LABORATORY_OFFICER: FlaskConical,
  SPORTS_OFFICER: Trophy,
  DEPARTMENT_OFFICER: Building2,
  REGISTRAR: GraduationCap,
};

export function WorkflowTimeline({ stages, progress, className }: WorkflowTimelineProps) {
  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Approval Workflow
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-foreground-secondary">{progress.completed}/{progress.total} stages</span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
            progress.percentage === 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            progress.rejected > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}>
            {progress.percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2.5 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: progress.percentage + '%' }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all",
            progress.percentage === 100 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
            progress.rejected > 0 ? "bg-gradient-to-r from-red-500 to-rose-500" :
            "bg-gradient-to-r from-brand-500 to-purple-500")}
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-glass-border" />
        <div className="space-y-6">
          {stages.map((stage, i) => {
            const Icon = roleIcons[stage.role] || Clock;

            return (
              <motion.div
                key={stage.role}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative pl-12"
              >
                {/* Dot */}
                <div className={cn(
                  "absolute left-[12px] top-1 w-[15px] h-[15px] rounded-full border-[3px] bg-card-bg z-10 flex items-center justify-center",
                  stage.isComplete ? "border-green-500" :
                  stage.isRejected ? "border-red-500" :
                  stage.isActive ? "border-primary" :
                  "border-foreground-muted"
                )}>
                  {stage.isActive && <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />}
                  {stage.isComplete && <CheckCircle2 className="w-5 h-5 text-green-500 absolute -left-[3px] -top-[3px]" />}
                  {stage.isRejected && <XCircle className="w-5 h-5 text-red-500 absolute -left-[3px] -top-[3px]" />}
                </div>

                {/* Content */}
                <div className={cn(
                  "glass p-4 rounded-xl transition-all",
                  stage.isActive && "ring-2 ring-primary/30",
                  stage.isRejected && "ring-2 ring-red-500/30"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4",
                        stage.isComplete ? "text-green-500" :
                        stage.isRejected ? "text-red-500" :
                        stage.isActive ? "text-primary" : "text-foreground-muted"
                      )} />
                      <h4 className="font-medium text-sm">{stage.stage}</h4>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium",
                      stage.isComplete ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      stage.isRejected ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      stage.isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    )}>
                      {stage.isComplete ? "Approved" : stage.isRejected ? "Rejected" : stage.isActive ? "In Progress" : stage.status === 'LOCKED' ? 'Locked' : 'Pending'}
                    </span>
                  </div>
                  {stage.officer && (
                    <p className="text-xs text-foreground-secondary">
                      by {stage.officer.name}
                      {stage.approvedAt && (
                        <span className="text-foreground-muted"> · {new Date(stage.approvedAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  )}
                  {stage.remarks && (
                    <p className="text-xs text-foreground-muted mt-1.5 italic">"{stage.remarks}"</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
