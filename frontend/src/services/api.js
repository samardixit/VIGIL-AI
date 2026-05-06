import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor — attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vigil_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vigil_token');
      localStorage.removeItem('vigil_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────
export const loginStudent = (studentId) =>
  api.post('/api/auth/login/student', { student_id: studentId });

export const loginFaculty = (email, password) =>
  api.post('/api/auth/login/faculty', { email, password });

export const registerFaculty = (data) =>
  api.post('/api/auth/register/faculty', data);

// ── Students API ──────────────────────────────────────────────
export const getStudents = () => api.get('/api/students/');
export const getStudent = (studentId) => api.get(`/api/students/${studentId}`);
export const getStudentAttendance = (studentId) =>
  api.get(`/api/students/${studentId}/attendance`);

// ── Sessions API ──────────────────────────────────────────────
export const startSession = (data) => api.post('/api/sessions/start', data);
export const endSession = (sessionId) => api.post(`/api/sessions/end/${sessionId}`);
export const getActiveSessions = () => api.get('/api/sessions/active');
export const getFacultySession = (facultyId) =>
  api.get(`/api/sessions/active/${facultyId}`);

// ── Attendance API ────────────────────────────────────────────
export const verifyLocation = (data) =>
  api.post('/api/attendance/verify-location', data);
export const scanAttendance = (data) =>
  api.post('/api/attendance/scan', data);
export const manualAttendance = (data) =>
  api.post('/api/attendance/manual', data);
export const getSessionAttendance = (sessionId) =>
  api.get(`/api/attendance/session/${sessionId}`);
export const getAttendanceStats = (studentId) =>
  api.get(`/api/attendance/stats/${studentId}`);

// ── Dashboard API ─────────────────────────────────────────────
export const getStudentDashboard = (studentId) =>
  api.get(`/api/dashboard/student/${studentId}`);
export const getTeacherDashboard = (facultyId) =>
  api.get(`/api/dashboard/teacher/${facultyId}`);

// ── Chat API ──────────────────────────────────────────────────
export const sendChatMessage = (message, history = []) =>
  api.post('/api/chat/', { message, history });

export default api;
