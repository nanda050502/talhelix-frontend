import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Get base URL from environment or default to current origin API
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom event dispatcher for central navigation triggers outside React tree
 */
export const apiEvents = {
  onUnauthorized: () => {
    window.dispatchEvent(new CustomEvent('talhelix:auth:unauthorized'));
  },
  onSEBRequired: (assessmentId?: string) => {
    window.dispatchEvent(
      new CustomEvent('talhelix:seb:required', { detail: { assessmentId } })
    );
  },
};

/**
 * Configure central Axios client with SEB headers and JWT Bearer tokens
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR:
 * 1. Appends HS256 JWT Bearer Token
 * 2. Injects Safe Exam Browser (SEB) validation headers if available
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('talhelix_token') || sessionStorage.getItem('talhelix_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // DEV/BACKWARD-COMPAT: Send role + tenant headers for backend dev bypass (x-mock-role)
    // In production, backend will ignore these and require real JWT; frontend RoleGuard is the first line, backend is the real boundary
    try {
      const rawUser = localStorage.getItem('talhelix_user') || sessionStorage.getItem('talhelix_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        // Map frontend UserProfile role to backend role enum
        const roleMap: Record<string, string> = {
          'Super Admin': 'super_admin',
          Admin: 'admin',
          Student: 'student',
          'Institution Admin': 'institution',
          'Faculty / Staff Proctor': 'faculty',
          'Faculty/Staff': 'faculty',
        };
        const backendRole = roleMap[u.role] || (u.userType === 'admin' ? 'admin' : u.userType === 'student' ? 'student' : u.userType === 'institution' ? 'institution' : u.userType);
        if (backendRole && config.headers) {
          (config.headers as any)['X-Mock-Role'] = backendRole;
          (config.headers as any)['X-Mock-Email'] = u.email || '';
          if (u.institutionId) (config.headers as any)['X-Mock-Institution'] = u.institutionId;
        }
      } else {
        // Fallback: try to infer from AppContext's userType stored elsewhere (e.g., legacy)
        const legacyRole = localStorage.getItem('talhelix_role') || sessionStorage.getItem('talhelix_role');
        if (legacyRole && config.headers) {
          (config.headers as any)['X-Mock-Role'] = legacyRole;
        }
      }
    } catch {}

    // Append Safe Exam Browser (SEB) security headers
    const sebConfigKey = sessionStorage.getItem('talhelix_seb_ck');
    const sebRequestHash = sessionStorage.getItem('talhelix_seb_req_hash');

    if (config.headers) {
      if (sebConfigKey) {
        config.headers['X-SEB-CK'] = sebConfigKey;
      }
      if (sebRequestHash) {
        config.headers['X-SafeExamBrowser-RequestHash'] = sebRequestHash;
      }
      config.headers['X-SEB-Page-URL'] = window.location.href;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR:
 * 1. Intercepts 401 Unauthorized -> Clears token and triggers logout
 * 2. Intercepts 403 Forbidden with SEB requirement -> Dispatches SEB lock event
 * 3. Formats backend error messages
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string; require_seb?: boolean; assessment_id?: string }>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // 1. Token Expired or Invalid (401)
      if (status === 401) {
        localStorage.removeItem('talhelix_token');
        sessionStorage.removeItem('talhelix_token');
        localStorage.removeItem('talhelix_user');
        apiEvents.onUnauthorized();
      }

      // 2. Safe Exam Browser Required (403 with require_seb flag)
      if (status === 403 && data?.require_seb) {
        apiEvents.onSEBRequired(data.assessment_id);
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('[API Timeout] Backend request timed out after 30s.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
