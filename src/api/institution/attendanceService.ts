/**
 * Institution-only Attendance Service — tenant-scoped, never cross-institution
 * All endpoints require RoleGuard(allow=['institution','faculty']) + backend requireTenant
 */
import { apiClient } from '../apiClient';
import { AttendanceRecord, Batch } from '../../types';

export async function fetchInstitutionStudents(): Promise<any[]> {
  const { data } = await apiClient.get('/api/institution/students');
  return data.data || [];
}

export async function fetchInstitutionBatches(): Promise<Batch[]> {
  const { data } = await apiClient.get('/api/institution/batches');
  return data.data || [];
}

export async function markInstitutionAttendance(payload: {
  batchId: string;
  studentId: number;
  status: AttendanceRecord['status'];
  source?: AttendanceRecord['source'];
}): Promise<{ success: boolean; record: AttendanceRecord }> {
  const { data } = await apiClient.post('/api/attendance/mark', payload);
  return data;
}

export async function bulkMarkInstitutionAttendance(payload: {
  batchId: string;
  records: Array<{ studentId: number; status: AttendanceRecord['status'] }>;
}): Promise<{ success: boolean; markedCount: number }> {
  const { data } = await apiClient.post('/api/attendance/bulk-mark', payload);
  return data;
}

export async function getInstitutionLiveBatch(facultyId?: string): Promise<any> {
  const { data } = await apiClient.get('/api/attendance/live-batch', { params: { facultyId } });
  return data;
}

export async function getInstitutionMobileSync(facultyId?: string): Promise<any> {
  const { data } = await apiClient.get('/api/mobile/sync-dataset', { params: { facultyId } });
  return data.data;
}
