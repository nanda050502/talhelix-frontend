// ==========================================
// TALHELIX PRODUCTION BACKEND API TYPES (Go/Gin)
// ==========================================

export type BackendUserRole = 'student' | 'mentor' | 'admin' | 'super_admin' | 'university_admin';

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: BackendUserRole;
  tenant_id: string;
  department?: string;
  roll_number?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthLoginResponse {
  token: string;
  user: BackendUser;
  tenant_id: string;
  expires_in: number;
}

export interface SEBSettings {
  require_seb: boolean;
  seb_exam_key?: string;
  seb_config_key?: string;
  quit_password_hash?: string;
  allowed_urls?: string[];
  enable_reload?: boolean;
}

export interface BackendTestCase {
  id?: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  weight?: number;
  explanation?: string;
}

export interface BackendQuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface BackendQuestion {
  id: string;
  assessment_id?: string;
  section_id?: string;
  title: string;
  type: 'MCQ' | 'MSQ' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'SCENARIO' | 'CODING';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  negative_marks: number;
  require_reasoning: boolean;
  stem_markdown: string;
  options?: BackendQuestionOption[];
  language?: string;
  code_template?: string;
  code_templates?: Record<string, string>;
  solution_code?: string;
  test_cases?: BackendTestCase[];
  time_limit_ms?: number;
  memory_limit_kb?: number;
  expected_answer?: string;
  acceptable_answers?: string[];
  is_case_sensitive?: boolean;
  rubric?: string;
  tags?: string[];
}

export interface BackendAssessmentSection {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_minutes?: number;
  questions: BackendQuestion[];
}

export interface BackendAssessment {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  instructions: string;
  duration_minutes: number;
  passing_score: number;
  category: string;
  status: 'draft' | 'published' | 'archived';
  is_published: boolean;
  require_seb: boolean;
  seb_settings?: SEBSettings;
  sections?: BackendAssessmentSection[];
  questions_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface ExamInstance {
  session_id: string;
  assessment_id: string;
  assessment_title: string;
  duration_minutes: number;
  started_at: string;
  ends_at: string;
  require_seb: boolean;
  sections: BackendAssessmentSection[];
  responses: Record<string, BackendStudentResponse>;
  remaining_seconds: number;
}

export interface BackendStudentResponse {
  session_id: string;
  question_id: string;
  selected_option_ids?: string[];
  text_response?: string;
  code_response?: string;
  language?: string;
  is_marked_for_review?: boolean;
  time_spent_seconds?: number;
  updated_at?: string;
}

export interface CodeRunRequest {
  problem_id: string;
  source_code: string;
  language: string;
  session_id?: string;
  custom_input?: string;
}

export interface CodeSubmitRequest {
  problem_id: string;
  source_code: string;
  language: string;
  session_id: string;
}

export interface CodeTokenResponse {
  submission_id: string;
  status: 'processing' | 'queued';
  tokens: string[];
  submissions_remaining: number;
}

export interface Judge0ExecutionResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  overall_status: 'Passed' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error';
  passed_cases: number;
  total_cases: number;
  score_obtained: number;
  max_score: number;
  execution_time_ms: number;
  memory_kb: number;
  stdout: string;
  stderr: string;
  compile_output: string;
  test_case_results: {
    test_case_id?: string;
    is_sample: boolean;
    passed: boolean;
    input: string;
    expected_output: string;
    actual_output: string;
    execution_time_ms: number;
    error_message?: string;
  }[];
}

export interface SubmissionsRemainingResponse {
  problem_id: string;
  submissions_remaining: number;
  max_submissions: number;
}

export interface AssessmentSummaryMetrics {
  assessment_id: string;
  title: string;
  total_assigned: number;
  total_completed: number;
  pass_rate: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  score_distribution: { bin: string; count: number }[];
  question_accuracy: { question_id: string; title: string; accuracy: number }[];
}

export interface ClientTelemetryPayload {
  session_id?: string;
  assessment_id?: string;
  user_email?: string;
  event_type: 'violation' | 'javascript_error' | 'network_timeout' | 'seb_blocked';
  message: string;
  stack_trace?: string;
  url: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
