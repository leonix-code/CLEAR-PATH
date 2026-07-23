import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const apiService = {
  auth: {
    login: (data: { email: string; password: string; rememberMe?: boolean }) => api.post("/auth/login", data),
    register: (data: any) => api.post("/auth/register", data),
    refresh: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }),
    logout: () => api.post("/auth/logout"),
    profile: () => api.get("/auth/profile"),
    forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
    resetPassword: (token: string, password: string) => api.post("/auth/reset-password", { token, password }),
    changePassword: (currentPassword: string, newPassword: string) => api.post("/auth/change-password", { currentPassword, newPassword }),
  },
  users: {
    getAll: (params?: any) => api.get("/users", { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    deactivate: (id: string) => api.patch(`/users/${id}/deactivate`),
    activate: (id: string) => api.patch(`/users/${id}/activate`),
  },
  students: {
    getAll: (params?: any) => api.get("/students", { params }),
    getById: (id: string) => api.get(`/students/${id}`),
    getMe: () => api.get("/students/me"),
    create: (data: any) => api.post("/students", data),
    update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  },
  clearance: {
    create: (semesterId: string) => api.post("/clearance", { semesterId }),
    getAll: (params?: any) => api.get("/clearance", { params }),
    getById: (id: string) => api.get(`/clearance/${id}`),
    getMyRequests: () => api.get("/clearance/my-requests"),
    getPending: () => api.get("/clearance/pending"),
    getStatistics: () => api.get("/clearance/statistics"),
    approve: (id: string, remarks?: string) => api.patch(`/clearance/${id}/approve`, { remarks }),
    reject: (id: string, remarks: string) => api.patch(`/clearance/${id}/reject`, { remarks }),
    bulkApprove: (ids: string[], remarks?: string) => api.post("/clearance/bulk-approve", { ids, remarks }),
  },
  workflow: {
    getTimeline: (id: string) => api.get(`/workflow/timeline/${id}`),
    approve: (id: string, remarks?: string) => api.patch(`/workflow/${id}/approve`, { remarks }),
    reject: (id: string, remarks: string) => api.patch(`/workflow/${id}/reject`, { remarks }),
    conditionalApprove: (id: string, remarks: string) => api.patch(`/workflow/${id}/conditional`, { remarks }),
    verifyQR: (data: string, signature: string) => api.get("/workflow/verify-qr", { params: { data, signature } }),
    notify: (id: string, template: string, channels?: string[]) => api.post(`/workflow/${id}/notify`, { template, channels }),
  },
  reports: {
    getData: (params: any) => api.get("/reports/data", { params }),
    getExportUrl: (format: string, type: string) => `${API_BASE_URL}/reports/export/${format}?type=${type}`,
  },
  departments: {
    getAll: (params?: any) => api.get("/departments", { params }),
    getById: (id: string) => api.get(`/departments/${id}`),
    create: (data: any) => api.post("/departments", data),
    update: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  },
  notifications: {
    getAll: (params?: any) => api.get("/notifications", { params }),
    getUnreadCount: () => api.get("/notifications/unread-count"),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch("/notifications/mark-all-read"),
  },
  analytics: {
    getDashboardStats: () => api.get("/analytics/dashboard"),
    getClearanceTrend: (days?: number) => api.get("/analytics/clearance-trend", { params: { days } }),
    getDepartmentStats: () => api.get("/analytics/departments"),
  },
  courses: {
    getAll: (params?: any) => api.get("/courses", { params }),
    getById: (id: string) => api.get(`/courses/${id}`),
    create: (data: any) => api.post("/courses", data),
    update: (id: string, data: any) => api.patch(`/courses/${id}`, data),
  },
  invigilator: {
    verifyQR: (code: string) => api.post("/invigilator/verify-qr", { code }),
    verifyStudent: (studentId: string) => api.get(`/invigilator/verify-student/${studentId}`),
    checkEligibility: (studentId: string) => api.get(`/invigilator/eligibility/${studentId}`),
  },
  ai: {
    chat: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
      api.post("/ai/chat", { messages }).then(r => r.data.data),
    search: (params: { q: string; type?: string; departmentId?: string; status?: string }) =>
      api.get("/ai/search", { params }).then(r => r.data.data),
    getRecommendations: () => api.get("/ai/recommendations").then(r => r.data.data),
    getPredictiveAnalytics: () => api.get("/ai/predictive").then(r => r.data.data),
    getSmartReports: (params?: { departmentId?: string; startDate?: string; endDate?: string }) =>
      api.get("/ai/smart-reports", { params }).then(r => r.data.data),
  },
};

