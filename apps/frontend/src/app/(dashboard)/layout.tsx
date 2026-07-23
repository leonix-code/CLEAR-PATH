"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/providers";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { useTheme } from "next-themes";
import { apiService } from "@/lib/api";
import {
  GraduationCap, LayoutDashboard, Users, Building2, BookOpen,
  ClipboardCheck, Bell, Settings, LogOut, Menu, X,
  Sun, Moon, FileText, Shield, QrCode, Award, BarChart3, Loader2,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "", roles: ["ADMINISTRATOR", "STUDENT", "FINANCE_OFFICER", "LIBRARY_OFFICER", "LABORATORY_OFFICER", "SPORTS_OFFICER", "DEPARTMENT_OFFICER", "INVIGILATOR", "ICT_SUPPORT", "PARENT", "SUPERVISOR", "REGISTRAR"] },
  { label: "Clearance", icon: ClipboardCheck, href: "/clearance", roles: ["ADMINISTRATOR", "STUDENT", "FINANCE_OFFICER", "LIBRARY_OFFICER", "LABORATORY_OFFICER", "SPORTS_OFFICER", "DEPARTMENT_OFFICER"] },
  { label: "Students", icon: Users, href: "/students", roles: ["ADMINISTRATOR", "DEPARTMENT_OFFICER", "ICT_SUPPORT", "REGISTRAR"] },
  { label: "Departments", icon: Building2, href: "/departments", roles: ["ADMINISTRATOR", "ICT_SUPPORT"] },
  { label: "Courses", icon: BookOpen, href: "/courses", roles: ["ADMINISTRATOR", "ICT_SUPPORT"] },
  { label: "Verification", icon: QrCode, href: "/verification", roles: ["INVIGILATOR", "ADMINISTRATOR"] },
  { label: "Certificates", icon: Award, href: "/certificates", roles: ["STUDENT", "ADMINISTRATOR"] },
  { label: "Reports", icon: BarChart3, href: "/reports", roles: ["ADMINISTRATOR", "SUPERVISOR", "REGISTRAR"] },
  { label: "Notifications", icon: Bell, href: "/notifications", roles: ["ADMINISTRATOR", "STUDENT", "FINANCE_OFFICER", "LIBRARY_OFFICER", "LABORATORY_OFFICER", "SPORTS_OFFICER", "DEPARTMENT_OFFICER", "INVIGILATOR", "ICT_SUPPORT", "PARENT", "SUPERVISOR", "REGISTRAR"] },
  { label: "Audit Logs", icon: Shield, href: "/audit-logs", roles: ["ADMINISTRATOR"] },
  { label: "Settings", icon: Settings, href: "/settings", roles: ["ADMINISTRATOR", "ICT_SUPPORT"] },
];

const getRolePrefix = (role: string): string => {
  const prefixes: Record<string, string> = {
    ADMINISTRATOR: "/admin", STUDENT: "/student",
    FINANCE_OFFICER: "/officer", LIBRARY_OFFICER: "/officer",
    LABORATORY_OFFICER: "/officer", SPORTS_OFFICER: "/officer",
    DEPARTMENT_OFFICER: "/officer", INVIGILATOR: "/invigilator",
    ICT_SUPPORT: "/ict-support", PARENT: "/parent",
    SUPERVISOR: "/supervisor", REGISTRAR: "/registrar",
  };
  return prefixes[role] || "/dashboard";
};

const roleLabels: Record<string, string> = {
  ADMINISTRATOR: "Administrator", STUDENT: "Student",
  FINANCE_OFFICER: "Finance Officer", LIBRARY_OFFICER: "Library Officer",
  LABORATORY_OFFICER: "Lab Officer", SPORTS_OFFICER: "Sports Officer",
  DEPARTMENT_OFFICER: "Dept. Officer", INVIGILATOR: "Invigilator",
  ICT_SUPPORT: "ICT Support", PARENT: "Parent",
  SUPERVISOR: "Supervisor", REGISTRAR: "Registrar",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return null;

  const rolePrefix = getRolePrefix(user.role);
  const filteredNavItems = navItems.filter((item) => !item.roles || item.roles.includes(user.role));

  const handleLogout = async () => {
    try { await apiService.auth.logout(); } catch {}
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed lg:static inset-y-0 left-0 z-30 w-[280px] glass-sidebar flex flex-col ${sidebarOpen ? "block" : "hidden lg:flex"}`}>
          <div className="p-5 border-b border-glass-border">
            <Link href={rolePrefix} className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg gradient-text">ClearPath</h1>
                <p className="text-xs text-foreground-muted">{roleLabels[user.role] || user.role}</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === `${rolePrefix}${item.href}` || (item.href && pathname.startsWith(`${rolePrefix}${item.href}`));
              return (
                <div key={item.label}>
                  <Link href={`${rolePrefix}${item.href}`} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground-muted hover:bg-glass-bg hover:text-foreground"
                    }`}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
          <div className="p-4 border-t border-glass-border">
            <div className="flex items-center gap-3 glass p-3 rounded-xl">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-medium">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-foreground-muted truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-glass-bg rounded-lg transition-colors text-foreground-muted hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="glass-navbar px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-glass-bg rounded-lg transition-colors">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-glass-bg rounded-lg transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
        <PWAInstallBanner />
      </div>
    </div>
  );
}
