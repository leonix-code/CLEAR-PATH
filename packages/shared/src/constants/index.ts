export const ROLES = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  STUDENT: 'STUDENT',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
  LIBRARY_OFFICER: 'LIBRARY_OFFICER',
  LABORATORY_OFFICER: 'LABORATORY_OFFICER',
  SPORTS_OFFICER: 'SPORTS_OFFICER',
  DEPARTMENT_OFFICER: 'DEPARTMENT_OFFICER',
  INVIGILATOR: 'INVIGILATOR',
  ICT_SUPPORT: 'ICT_SUPPORT',
  PARENT: 'PARENT',
  SUPERVISOR: 'SUPERVISOR',
} as const;

export const OFFICER_ROLES = [
  ROLES.FINANCE_OFFICER,
  ROLES.LIBRARY_OFFICER,
  ROLES.LABORATORY_OFFICER,
  ROLES.SPORTS_OFFICER,
  ROLES.DEPARTMENT_OFFICER,
] as const;

export const CLEARANCE_STEPS = [
  { key: 'department', label: 'Department', icon: 'Building2' },
  { key: 'finance', label: 'Finance', icon: 'Wallet' },
  { key: 'library', label: 'Library', icon: 'BookOpen' },
  { key: 'laboratory', label: 'Laboratory', icon: 'Flask' },
  { key: 'sports', label: 'Sports', icon: 'Trophy' },
] as const;

export const STATUS_COLORS = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
} as const;

export const ITEMS_PER_PAGE = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
