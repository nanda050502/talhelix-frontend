/**
 * Student-only Exam Service — isolated, no admin imports
 * Endpoints are tenant-scoped and field-filtered (no assignedCount, no solutionCode)
 */
import { apiClient } from '../apiClient';
import { ExamInstance, BackendStudentResponse, Judge0ExecutionResult, CodeRunRequest, CodeSubmitRequest } from '../../types/backend';
import { mapStudentResponseToBackend } from '../mappers';
import { ExamAnswer } from '../../types';

// Student: only own assignments, server filters WHERE student_id = jwt.sub
export async function fetchStudentAssessments(): Promise<any[]> {
  const { data } = await apiClient.get('/api/student/assessments');
  return data.data || [];
}

export async function fetchStudentProfile(): Promise<any> {
  const { data } = await apiClient.get('/api/student/profile');
  return data.data;
}

export async function startStudentExam(assessmentId: string): Promise<ExamInstance> {
  const { data } = await apiClient.post<ExamInstance>('/api/student/exam/start', { assessment_id: assessmentId });
  return data;
}

export async function saveStudentExamResponse(sessionId: string, questionId: string, answer: Partial<ExamAnswer>): Promise<{ saved: boolean }> {
  const payload = mapStudentResponseToBackend(sessionId, questionId, answer);
  const { data } = await apiClient.post('/api/student/exam/save', payload);
  return data;
}

export async function submitStudentExam(sessionId: string): Promise<{ percentage: number; passed: boolean }> {
  const { data } = await apiClient.post('/api/student/exam/submit', { session_id: sessionId });
  return data;
}

// Code execution — student only, rate-limited, tenant-scoped
export async function runStudentCode(req: CodeRunRequest): Promise<Judge0ExecutionResult> {
  const { data } = await apiClient.post('/api/student/code/run', req);
  return data;
}
