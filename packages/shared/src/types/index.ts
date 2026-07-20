export enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  STUDENT = 'STUDENT',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  LIBRARY_OFFICER = 'LIBRARY_OFFICER',
  LABORATORY_OFFICER = 'LABORATORY_OFFICER',
  SPORTS_OFFICER = 'SPORTS_OFFICER',
  DEPARTMENT_OFFICER = 'DEPARTMENT_OFFICER',
  INVIGILATOR = 'INVIGILATOR',
  ICT_SUPPORT = 'ICT_SUPPORT',
  PARENT = 'PARENT',
  SUPERVISOR = 'SUPERVISOR',
}

export enum ClearanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONDITIONALLY_APPROVED = 'CONDITIONALLY_APPROVED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONDITIONAL = 'CONDITIONAL',
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum SemesterType {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  SUMMER = 'SUMMER',
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  phone?: string;
  student?: StudentProfile;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  departmentId: string;
  courseId?: string;
  currentLevel: number;
  department?: { id: string; name: string; code: string };
  course?: { id: string; name: string; code: string };
}

export interface ClearanceRequest {
  id: string;
  studentId: string;
  semesterId: string;
  status: ClearanceStatus;
  remarks?: string;
  submittedAt: Date;
  completedAt?: Date;
  student?: any;
  semester?: any;
  approvals?: ClearanceApproval[];
}

export interface ClearanceApproval {
  id: string;
  clearanceRequestId: string;
  officerId: string;
  status: ApprovalStatus;
  remarks?: string;
  approvedAt?: Date;
  officer?: { firstName: string; lastName: string; role: string };
}
