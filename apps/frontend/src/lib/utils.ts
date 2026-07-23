import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    CONDITIONALLY_APPROVED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    ELIGIBLE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    NOT_ELIGIBLE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    PENDING_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
}

export function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    IN_PROGRESS: "bg-blue-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    CONDITIONALLY_APPROVED: "bg-purple-500",
    ELIGIBLE: "bg-green-500",
    NOT_ELIGIBLE: "bg-red-500",
    PENDING_REVIEW: "bg-yellow-500",
  };
  return colors[status] || "bg-gray-500";
}

const CLEARANCE_STEPS = [
  { key: "FINANCE_OFFICER", label: "Finance", icon: "💰" },
  { key: "LIBRARY_OFFICER", label: "Library", icon: "📚" },
  { key: "LABORATORY_OFFICER", label: "Laboratory", icon: "🔬" },
  { key: "SPORTS_OFFICER", label: "Sports", icon: "🏆" },
  { key: "DEPARTMENT_OFFICER", label: "Department", icon: "🏛️" },
];

export { CLEARANCE_STEPS };
