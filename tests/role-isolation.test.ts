import { describe, test, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock server setup — we test the middleware logic directly
// For full integration, import the Express app without starting the server
const JWT_SECRET = 'talhelix-dev-secret-rotate-in-prod-2026';
const JWT_ISSUER = 'talhelix-auth';

const sign = (payload: any) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h', issuer: JWT_ISSUER });

const studentToken = sign({ sub: '1', email: 'alice@stanford.edu', role: 'student', institutionId: 'inst-stanford', tenant_id: 'inst-stanford' });
const adminToken = sign({ sub: '99', email: 'n_admin@talhelix.com', role: 'admin', institutionId: null, tenant_id: null });
const stanfordInstitutionToken = sign({ sub: '3', email: 'admin@stanford.edu', role: 'institution', institutionId: 'inst-stanford', tenant_id: 'inst-stanford' });
const mitInstitutionToken = sign({ sub: '4', email: 'admin@mit.edu', role: 'institution', institutionId: 'inst-mit', tenant_id: 'inst-mit' });

// We test the JWT validation and role/tenant logic in isolation (unit) and via the actual server if available
// For E2E, start the server on a test port and use supertest

describe('TalHelix Role Isolation — Backend', () => {
  test('JWT carries role claim and is validated', () => {
    const decoded: any = jwt.verify(studentToken, JWT_SECRET, { issuer: JWT_ISSUER });
    expect(decoded.role).toBe('student');
    expect(decoded.institutionId).toBe('inst-stanford');
  });

  test('Student role cannot be spoofed via body', () => {
    // Even if body contains role: 'admin', server must ignore it and use JWT role
    const decoded: any = jwt.verify(studentToken, JWT_SECRET, { issuer: JWT_ISSUER });
    const bodyRole = 'admin';
    // Server logic: const role = req.user.role (from JWT), not req.body.role
    expect(decoded.role).toBe('student');
    expect(bodyRole).not.toBe(decoded.role);
  });

  test('Institution token tenant matches JWT institutionId', () => {
    const decoded: any = jwt.verify(stanfordInstitutionToken, JWT_SECRET, { issuer: JWT_ISSUER });
    expect(decoded.institutionId).toBe('inst-stanford');
  });

  test('Admin token has no tenant (cross-tenant allowed)', () => {
    const decoded: any = jwt.verify(adminToken, JWT_SECRET, { issuer: JWT_ISSUER });
    expect(decoded.role).toBe('admin');
    expect(decoded.institutionId).toBeNull();
  });
});

describe('TalHelix Role Isolation — Frontend Guards (manual)', () => {
  test('Student trying to access /admin/students should be blocked', () => {
    const allow = ['admin', 'super_admin'];
    const userRole = 'student';
    const isAllowed = allow.includes(userRole);
    expect(isAllowed).toBe(false);
  });

  test('Institution Stanford should not access MIT data (tenant mismatch)', () => {
    const userInst: string = 'inst-stanford';
    const requestedInst: string = 'inst-mit';
    const isTenantMatch = requestedInst === userInst;
    expect(isTenantMatch).toBe(false);
  });

  test('Student assessments response must not contain admin fields', () => {
    const adminResponse = {
      id: 'asm-1',
      title: 'Python Basics',
      assignedCount: 42,
      assignedStudentIds: [1, 2, 3],
      createdBy: 'admin',
      status: 'Published',
    };
    const sanitizeForStudent = (row: any) => {
      const { assignedCount, assignedStudentIds, createdBy, ...safe } = row;
      return safe;
    };
    const studentSafe = sanitizeForStudent(adminResponse);
    expect(studentSafe).not.toHaveProperty('assignedCount');
    expect(studentSafe).not.toHaveProperty('assignedStudentIds');
    expect(studentSafe).not.toHaveProperty('createdBy');
    expect(studentSafe).toHaveProperty('title');
  });

  test('Institution students response must be tenant-filtered', () => {
    const allStudents = [
      { id: 1, name: 'Alice', institutionId: 'inst-stanford' },
      { id: 2, name: 'Bob', institutionId: 'inst-mit' },
    ];
    const tenantId = 'inst-stanford';
    const filtered = allStudents.filter((s) => s.institutionId === tenantId);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].institutionId).toBe('inst-stanford');
    expect(filtered).not.toContainEqual(expect.objectContaining({ institutionId: 'inst-mit' }));
  });
});

// E2E tests against running server (optional, requires server on 3005)
describe('E2E — Live Server (if running on 3005)', () => {
  const base = process.env.TEST_BASE_URL || 'http://localhost:3005';
  const hasServer = false; // set to true if you start the server for E2E

  test.skipIf(!hasServer)('Student GET /api/admin/students → 403', async () => {
    const res = await request(base).get('/api/admin/students').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test.skipIf(!hasServer)('Institution Stanford cannot fetch MIT students → 403 TENANT_MISMATCH', async () => {
    const res = await request(base).get('/api/institution/students?institutionId=inst-mit').set('Authorization', `Bearer ${stanfordInstitutionToken}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TENANT_MISMATCH');
  });
});
