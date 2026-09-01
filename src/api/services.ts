import { apiClient } from './apiClient';
import {
  AuthLoginResponse,
  BackendUser,
  BackendAssessment,
  ExamInstance,
  BackendStudentResponse,
  CodeRunRequest,
  CodeSubmitRequest,
  CodeTokenResponse,
  Judge0ExecutionResult,
  SubmissionsRemainingResponse,
  AssessmentSummaryMetrics,
  ClientTelemetryPayload,
  SEBSettings,
} from '../types/backend';
import {
  mapAssessmentToBackend,
  mapBackendToAssessment,
  mapQuestionToBackend,
  mapBackendToQuestion,
  mapStudentResponseToBackend,
  capTerminalOutput,
} from './mappers';
import { Assessment, Question, ExamAnswer, MalpracticeFlag } from '../types';

// ==========================================
// 1. PUBLIC & HEALTH SERVICES
// ==========================================

export async function checkSystemHealth(): Promise<{ status: string; postgres: boolean; redis: boolean }> {
  const { data } = await apiClient.get('/health');
  return data;
}

export async function checkJudge0Health(): Promise<{ status: string; compiler_ready: boolean }> {
  const { data } = await apiClient.get('/api/health/judge0');
  return data;
}

export async function downloadSEBConfig(assessmentId: string): Promise<Blob> {
  const response = await apiClient.get(`/api/assessments/${assessmentId}/seb-config`, {
    responseType: 'blob',
  });
  return response.data;
}

// ==========================================
// 2. AUTHENTICATION SERVICES
// ==========================================

export async function loginUser(email: string, password: string): Promise<AuthLoginResponse> {
  const { data } = await apiClient.post<AuthLoginResponse>('/auth/login', { email, password });
  return data;
}

// ==========================================
// 3. USER MANAGEMENT SERVICES (Admin / Super Admin)
// ==========================================

export async function fetchUsers(params?: { role?: string; page?: number; limit?: number }): Promise<{ users: BackendUser[]; total: number }> {
  const { data } = await apiClient.get('/api/users', { params });
  return data;
}

export async function fetchUserById(userId: string): Promise<BackendUser> {
  const { data } = await apiClient.get(`/api/users/${userId}`);
  return data;
}

export async function createUser(user: Partial<BackendUser>): Promise<BackendUser> {
  const { data } = await apiClient.post('/api/users', user);
  return data;
}

export async function updateUser(userId: string, user: Partial<BackendUser>): Promise<BackendUser> {
  const { data } = await apiClient.put(`/api/users/${userId}`, user);
  return data;
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/api/users/${userId}`);
  return data;
}

export async function updateUserRole(userId: string, role: string): Promise<{ success: boolean; user: BackendUser }> {
  const { data } = await apiClient.patch(`/api/users/${userId}/role`, { role });
  return data;
}

export async function importUsersCSV(file: File): Promise<{ imported_count: number; errors?: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/api/users/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ==========================================
// 4. QUESTION & LIBRARY SERVICES
// ==========================================

export async function fetchQuestions(params?: { type?: string; difficulty?: string; tag?: string }): Promise<Question[]> {
  const { data } = await apiClient.get('/api/questions', { params });
  return (data.questions || data || []).map(mapBackendToQuestion);
}

export async function fetchQuestionById(id: string): Promise<Question> {
  const { data } = await apiClient.get(`/api/questions/${id}`);
  return mapBackendToQuestion(data);
}

export async function createQuestion(q: Question): Promise<Question> {
  const payload = mapQuestionToBackend(q);
  const { data } = await apiClient.post('/api/questions', payload);
  return mapBackendToQuestion(data);
}

export async function updateQuestion(id: string, q: Question): Promise<Question> {
  const payload = mapQuestionToBackend(q);
  const { data } = await apiClient.put(`/api/questions/${id}`, payload);
  return mapBackendToQuestion(data);
}

export async function deleteQuestion(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/api/questions/${id}`);
  return data;
}

export async function importQuestionsJSON(questionsPayload: any): Promise<{ imported_count: number }> {
  const { data } = await apiClient.post('/api/questions/import', questionsPayload);
  return data;
}

// ==========================================
// 5. ASSESSMENT ORCHESTRATION SERVICES
// ==========================================

export async function fetchAssessments(): Promise<Assessment[]> {
  const { data } = await apiClient.get('/api/assessments');
  const items = Array.isArray(data) ? data : data.assessments || [];
  return items.map(mapBackendToAssessment);
}

export async function fetchAssessmentById(id: string): Promise<Assessment> {
  const { data } = await apiClient.get(`/api/assessments/${id}`);
  return mapBackendToAssessment(data);
}

export async function createAssessment(assessment: Assessment): Promise<Assessment> {
  const payload = mapAssessmentToBackend(assessment);
  const { data } = await apiClient.post('/api/assessments', payload);
  return mapBackendToAssessment(data);
}

export async function setupGuidedAssessment(wizardPayload: any): Promise<Assessment> {
  const { data } = await apiClient.post('/api/assessments/setup', wizardPayload);
  return mapBackendToAssessment(data);
}

export async function setupAssessmentFromJSON(jsonPayload: any): Promise<Assessment> {
  const { data } = await apiClient.post('/api/assessments/setup-json', jsonPayload);
  return mapBackendToAssessment(data);
}

export async function updateAssessment(id: string, assessment: Assessment): Promise<Assessment> {
  const payload = mapAssessmentToBackend(assessment);
  const { data } = await apiClient.put(`/api/assessments/${id}`, payload);
  return mapBackendToAssessment(data);
}

export async function deleteAssessment(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/api/assessments/${id}`);
  return data;
}

export async function togglePublishAssessment(id: string, isPublished: boolean): Promise<Assessment> {
  const { data } = await apiClient.patch(`/api/assessments/${id}/publish`, { is_published: isPublished });
  return mapBackendToAssessment(data);
}

export async function assignStudentsToAssessment(
  assessmentId: string,
  emails: string[],
  overrides?: { duration_minutes?: number; grace_minutes?: number }
): Promise<{ assigned_count: number }> {
  const { data } = await apiClient.post(`/api/assessments/${assessmentId}/assignments`, {
    student_emails: emails,
    ...overrides,
  });
  return data;
}

export async function resetStudentAssessment(assessmentId: string, studentEmail: string): Promise<{ reset: boolean }> {
  const { data } = await apiClient.post(`/api/assessments/${assessmentId}/assignments/reset`, {
    student_email: studentEmail,
  });
  return data;
}

export async function getSEBSettings(assessmentId: string): Promise<SEBSettings> {
  const { data } = await apiClient.get(`/api/assessments/${assessmentId}/seb-status`);
  return data;
}

export async function updateSEBSettings(assessmentId: string, settings: Partial<SEBSettings>): Promise<SEBSettings> {
  const { data } = await apiClient.patch(`/api/assessments/${assessmentId}/seb-settings`, settings);
  return data;
}

// ==========================================
// 6. STUDENT EXAM ENGINE SERVICES
// ==========================================

export async function startOrResumeExam(assessmentId: string): Promise<ExamInstance> {
  const { data } = await apiClient.post<ExamInstance>('/api/exam/start', { assessment_id: assessmentId });
  return data;
}

export async function saveExamResponse(
  sessionId: string,
  questionId: string,
  answer: Partial<ExamAnswer>
): Promise<{ saved: boolean; timestamp: string }> {
  const payload = mapStudentResponseToBackend(sessionId, questionId, answer);
  const { data } = await apiClient.post('/api/exam/save', payload);
  return data;
}

export async function checkExamSessionStatus(sessionId: string): Promise<{
  session_id: string;
  is_active: boolean;
  ends_at: string;
  remaining_seconds: number;
}> {
  const { data } = await apiClient.get(`/api/exam/session/${sessionId}/status`);
  return data;
}

export async function submitFinalExam(sessionId: string): Promise<{
  session_id: string;
  submitted_at: string;
  total_score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
}> {
  const { data } = await apiClient.post('/api/exam/submit', { session_id: sessionId });
  return data;
}

export async function fetchExamResult(sessionId: string): Promise<any> {
  const { data } = await apiClient.get(`/api/exam/result/${sessionId}`);
  return data;
}

// ==========================================
// 7. MONACO CODE EXECUTION & JUDGE0 POLLING
// ==========================================

export async function logCodeWorkspaceStart(problemId: string, sessionId?: string): Promise<void> {
  try {
    await apiClient.post('/api/code/start', { problem_id: problemId, session_id: sessionId });
  } catch {}
}

export async function saveCodeDraft(problemId: string, sourceCode: string, language: string, sessionId?: string): Promise<void> {
  try {
    await apiClient.post('/api/code/save', {
      problem_id: problemId,
      source_code: sourceCode,
      language: language,
      session_id: sessionId,
    });
  } catch {}
}

export async function getCodeDraft(problemId: string, sessionId?: string): Promise<{ source_code: string; language: string }> {
  const { data } = await apiClient.get('/api/code/draft', {
    params: { problem_id: problemId, session_id: sessionId },
  });
  return data;
}

export async function getSubmissionsRemaining(problemId: string, sessionId?: string): Promise<SubmissionsRemainingResponse> {
  const { data } = await apiClient.get('/api/code/submissions-remaining', {
    params: { problem_id: problemId, session_id: sessionId },
  });
  return data;
}

/**
 * Executes source code against visible sample test cases only (POST /api/code/run)
 * Uses Exponential Backoff Polling with Judge0 sandbox extraction
 */
export async function runCodeAgainstSampleCases(
  req: CodeRunRequest,
  onStatusUpdate?: (statusText: string) => void
): Promise<Judge0ExecutionResult> {
  // 1. Send run request to backend Go Gin endpoint
  const { data: initial } = await apiClient.post<CodeTokenResponse>('/api/code/run', req);
  const submissionId = initial.submission_id;

  if (onStatusUpdate) onStatusUpdate('Enqueued in Judge0 compiler sandbox...');

  // 2. Exponential Backoff Polling on GET /api/code/result/:id
  let delay = 500;
  const maxDelay = 8000;
  const maxAttempts = 12;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (onStatusUpdate) onStatusUpdate(`Executing in sandbox (attempt ${attempt})...`);

    const { data: result } = await apiClient.get<Judge0ExecutionResult>(`/api/code/result/${submissionId}`);

    if (result.status !== 'processing' && result.status !== 'queued') {
      // Cap output strings to 16KB
      result.stdout = capTerminalOutput(result.stdout);
      result.stderr = capTerminalOutput(result.stderr);
      result.compile_output = capTerminalOutput(result.compile_output);
      return result;
    }

    delay = Math.min(delay * 1.6, maxDelay);
  }

  throw new Error('Sandbox compilation timed out. Please try again.');
}

/**
 * Submits source code against ALL test cases (sample + hidden) (POST /api/code/submit)
 */
export async function submitCodeForGrading(
  req: CodeSubmitRequest,
  onStatusUpdate?: (statusText: string) => void
): Promise<Judge0ExecutionResult> {
  const { data: initial } = await apiClient.post<CodeTokenResponse>('/api/code/submit', req);
  const submissionId = initial.submission_id;

  if (onStatusUpdate) onStatusUpdate('Grading code against all automated test suites...');

  let delay = 500;
  const maxDelay = 8000;
  const maxAttempts = 14;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delay));

    const { data: result } = await apiClient.get<Judge0ExecutionResult>(`/api/code/result/${submissionId}`);

    if (result.status !== 'processing' && result.status !== 'queued') {
      result.stdout = capTerminalOutput(result.stdout);
      result.stderr = capTerminalOutput(result.stderr);
      result.compile_output = capTerminalOutput(result.compile_output);
      return result;
    }

    delay = Math.min(delay * 1.6, maxDelay);
  }

  throw new Error('Grading evaluation timed out. Please check your submission result later.');
}

// ==========================================
// 8. AI SCENARIO GRADING & BATCH JOBS
// ==========================================

export async function triggerGeminiScenarioGrading(assessmentId: string): Promise<{ job_id: string; status: string }> {
  const { data } = await apiClient.post(`/api/admin/scenario/assessments/${assessmentId}/grade`);
  return data;
}

export async function getScenarioGradingJobs(assessmentId: string): Promise<any[]> {
  const { data } = await apiClient.get(`/api/admin/scenario/assessments/${assessmentId}/jobs`);
  return data.jobs || data || [];
}

// ==========================================
// 9. ANALYTICS & TELEMETRY
// ==========================================

export async function fetchAssessmentAnalyticsSummary(assessmentId: string): Promise<AssessmentSummaryMetrics> {
  const { data } = await apiClient.get<AssessmentSummaryMetrics>(`/api/admin/analytics/assessment/${assessmentId}/summary`);
  return data;
}

export async function logClientTelemetry(payload: ClientTelemetryPayload): Promise<void> {
  try {
    await apiClient.post('/api/logs/client', payload);
  } catch (err) {
    console.warn('[Telemetry Logger failed]', err);
  }
}

// ==========================================
// 10. PASSWORD MANAGEMENT — ADMIN ONLY (replaces manual SQL workflow)
// ==========================================

export type PasswordResetAction = 'set-custom' | 'reset-default';

export interface PasswordResetRequest {
  student_ids?: (number | string)[];
  studentIds?: (number | string)[];
  emails?: string[];
  password?: string; // plaintext, only for set-custom; never log/return hash
  action?: PasswordResetAction;
  batch_id?: string;
  batchId?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  action: PasswordResetAction;
  total_requested: number;
  updated_count: number;
  failed_count: number;
  failures: Array<{ studentId?: number | string; email?: string; error: string }>;
  audit_log_id: string;
  message: string;
}

export interface PasswordAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: PasswordResetAction;
  batchId?: string;
  studentCountRequested: number;
  studentIds: (number | string)[];
  studentEmails: string[];
  successCount: number;
  failureCount: number;
  failures: Array<{ studentId?: number | string; email?: string; error: string }>;
  ipAddress: string;
  userAgent: string;
}

/**
 * Validate password strength client-side (mirrors Go server validation).
 * Go source of truth: validatePasswordStrength() in handlers/password_reset.go
 */
export function validatePasswordStrengthClient(password: string): { valid: boolean; error?: string } {
  if (!password || password.trim().length === 0) return { valid: false, error: 'Password must not be empty.' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters.' };
  if (password.length > 128) return { valid: false, error: 'Password must be at most 128 characters.' };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const categories = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (categories < 3) return { valid: false, error: 'Include at least 3 of: uppercase, lowercase, digit, special character.' };
  if (/(.)\1\1/.test(password)) return { valid: false, error: 'Must not contain 3 identical consecutive characters.' };
  const weak = new Set(['password', 'password123', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome', 'admin', 'admin123', 'srmpassword', 'srmpassword26', 'talhelix', 'talhelix123', 'student', 'student123']);
  if (weak.has(password.toLowerCase())) return { valid: false, error: 'Password is too weak — choose a stronger one.' };
  if (password === 'srmpassword26') return { valid: false, error: 'Use "Reset to Default" for the fallback password.' };
  return { valid: true };
}

/**
 * POST /api/admin/students/passwords/reset-custom
 * Admin-only. Hashes via Go worker pool (min(NCPU,8)), transactional row-count check, LOWER(email) match, audit logged.
 */
export async function resetPasswordsCustom(
  studentIds: (number | string)[],
  emails: string[],
  password: string,
  batchId?: string
): Promise<PasswordResetResponse> {
  const { data } = await apiClient.post<PasswordResetResponse>('/api/admin/students/passwords/reset-custom', {
    student_ids: studentIds,
    emails,
    password,
    batch_id: batchId,
  });
  return data;
}

export async function resetPasswordsDefault(
  studentIds: (number | string)[],
  emails: string[],
  batchId?: string
): Promise<PasswordResetResponse> {
  const { data } = await apiClient.post<PasswordResetResponse>('/api/admin/students/passwords/reset-default', {
    student_ids: studentIds,
    emails,
    batch_id: batchId,
  });
  return data;
}

export async function resetPasswordsUnified(req: PasswordResetRequest): Promise<PasswordResetResponse> {
  const { data } = await apiClient.post<PasswordResetResponse>('/api/admin/students/passwords/reset', req);
  return data;
}

export async function fetchPasswordAudits(limit = 50): Promise<{ success: boolean; count: number; data: PasswordAuditEntry[] }> {
  const { data } = await apiClient.get('/api/admin/password-audits', { params: { limit } });
  return data;
}

// ==========================================
// 11. MALPRACTICE FLAGS & PROCTORING AUDIT
// ==========================================

export async function fetchStudentFlags(studentId: number | string): Promise<MalpracticeFlag[]> {
  const { data } = await apiClient.get(`/api/students/${studentId}/flags`);
  return data.flags || data || [];
}

export async function createStudentFlag(
  studentId: number | string,
  payload: {
    reason: string;
    category: MalpracticeFlag['category'];
    sessionId?: string;
    flaggedBy?: string;
  }
): Promise<MalpracticeFlag> {
  const { data } = await apiClient.post(`/api/students/${studentId}/flags`, payload);
  return data;
}

export async function resolveStudentFlag(
  studentId: number | string,
  flagId: string,
  resolutionNotes: string,
  action: 'RESOLVE' | 'DISMISS' = 'RESOLVE'
): Promise<MalpracticeFlag> {
  const { data } = await apiClient.patch(`/api/students/${studentId}/flags/${flagId}/resolve`, {
    resolution_notes: resolutionNotes,
    action,
  });
  return data;
}

export async function deleteStudentFlag(
  studentId: number | string,
  flagId: string,
  reason: string
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/api/students/${studentId}/flags/${flagId}`, {
    data: { reason },
  });
  return data;
}

export async function batchCreateStudentFlags(
  studentIds: (number | string)[],
  payload: {
    reason: string;
    category: MalpracticeFlag['category'];
    flaggedBy?: string;
  }
): Promise<{ count: number; flags: MalpracticeFlag[] }> {
  const { data } = await apiClient.post('/api/students/flags/batch', {
    student_ids: studentIds,
    ...payload,
  });
  return data;
}

