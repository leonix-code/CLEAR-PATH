"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/providers";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      const roleMap: Record<string, string> = {
        ADMINISTRATOR: "/admin",
        STUDENT: "/student",
        FINANCE_OFFICER: "/officer",
        LIBRARY_OFFICER: "/officer",
        LABORATORY_OFFICER: "/officer",
        SPORTS_OFFICER: "/officer",
        DEPARTMENT_OFFICER: "/officer",
        INVIGILATOR: "/invigilator",
        ICT_SUPPORT: "/ict-support",
        PARENT: "/parent",
        SUPERVISOR: "/supervisor",
        REGISTRAR: "/registrar",
      };

      const targetRoute = roleMap[user.role] || "/login";
      router.push(targetRoute);
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
