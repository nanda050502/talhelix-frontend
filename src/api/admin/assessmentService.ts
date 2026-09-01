/**
 * Admin-only Assessment Service — isolated from student/institution bundles
 * All endpoints require RoleGuard(allow=['admin','super_admin']) and backend authorize('admin')
 * Never imported by student or institution routes — enforced by eslint no-restricted-imports
 */
import { apiClient } from '../apiClient';
import { BackendAssessment, SEBSettings } from '../../types/backend';
import { mapAssessmentToBackend, mapBackendToAssessment } from '../mappers';
import { Assessment } from '../../types';

// Admin: cross-tenant, full fields including assignedCount, assignedStudentIds
export async function fetchAdminAssessments(): Promise<Assessment[]> {
  const { data } = await apiClient.get('/api/admin/assessments');
  const items = Array.isArray(data) ? data : data.assessments || [];
  return items.map(mapBackendToAssessment);
}

export async function fetchAdminAssessmentById(id: string): Promise<Assessment> {
  const { data } = await apiClient.get(`/api/admin/assessments/${id}`);
  return mapBackendToAssessment(data);
}

export async function createAdminAssessment(assessment: Assessment): Promise<Assessment> {
  const payload = mapAssessmentToBackend(assessment);
  const { data } = await apiClient.post('/api/admin/assessments', payload);
  return mapBackendToAssessment(data);
}

export async function updateAdminAssessment(id: string, assessment: Assessment): Promise<Assessment> {
  const payload = mapAssessmentToBackend(assessment);
  const { data } = await apiClient.put(`/api/admin/assessments/${id}`, payload);
  return mapBackendToAssessment(data);
}

export async function deleteAdminAssessment(id: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/api/admin/assessments/${id}`);
  return data;
}

export async function getAdminSEBSettings(assessmentId: string): Promise<SEBSettings> {
  const { data } = await apiClient.get(`/api/admin/assessments/${assessmentId}/seb-status`);
  return data;
}

export async function updateAdminSEBSettings(assessmentId: string, settings: Partial<SEBSettings>): Promise<SEBSettings> {
  const { data } = await apiClient.patch(`/api/admin/assessments/${assessmentId}/seb-settings`, settings);
  return data;
}

// Admin-only bulk operations — must never be available to student bundle
export async function assignAdminAssessmentToStudents(assessmentId: string, emails: string[]): Promise<{ assigned_count: number }> {
  const { data } = await apiClient.post(`/api/admin/assessments/${assessmentId}/assignments`, { student_emails: emails });
  return data;
}
