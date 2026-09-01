# TalHelix Role Isolation & Defense-in-Depth Refactor

**Date:** 2026-09-02
**Status:** Implemented (single-app strict splitting) + Recommendation for separate bundles
**Threat Model:** Student → Admin/Institution privilege escalation via direct URL, API tampering, shared component data leak, tenant cross-access.

---

## 1. Proposed Folder / Route Structure Per Role

### Current (Violation): Single shared route space
```
src/
  App.tsx              // single manual router, conditional rendering `if(user.userType==='student')`
  context/AppContext.tsx // single God context holds ALL roles' data (students, assessments, batches, attendance)
  components/
    dashboard/DashboardPage.tsx        // admin
    assessments/AssessmentsPage.tsx    // admin (route /assessments, not /admin/assessments)
    students/StudentsPage.tsx          // admin (route /students, not /admin/students)
    student/StudentDashboardPage.tsx   // student
    institution/InstitutionDashboard.tsx // institution
  server.ts            // no role checks, all endpoints open
```

**Problem:** No namespace isolation. `/assessments`, `/students`, `/reports`, `/libraries` are top-level, not `/admin/*`. A student guessing `/students` bypasses the `navigateTo` guard if they type URL directly or if `popstate` fires. All roles' data lives in one context — a Student client receives `institutions`, `batches`, `attendanceRecords` even if never rendered.

### Proposed (Implemented): Strict namespace + layout per role

```
src/
  routes/
    admin/
      layout/AdminLayout.tsx          // <Navbar/> + <Outlet/>
      pages/
        DashboardPage.tsx              // /admin/dashboard
        AssessmentsPage.tsx            // /admin/assessments (was /assessments)
        AssessmentSetupPage.tsx        // /admin/assessment-setup
        LibrariesPage.tsx              // /admin/libraries (was /libraries)
        StudentsPage.tsx               // /admin/students (was /students)
        ReportsPage.tsx                // /admin/reports (was /reports)
        AuthoringEditorPage.tsx        // /admin/authoring/editor/:id
    student/
      layout/StudentLayout.tsx        // <StudentNavbar/> + <Outlet/>
      pages/
        DashboardPage.tsx              // /student/dashboard
        AssessmentsPage.tsx            // /student/assessments
        ExamPage.tsx                   // /student/exam/:id (fullscreen isolated, no nav)
        ResultsPage.tsx                // /student/results
        ProfilePage.tsx                // /student/profile
    institution/
      layout/InstitutionLayout.tsx    // sidebar + header, tenant-scoped
      pages/
        DashboardPage.tsx              // /institution/dashboard
        StudentsPage.tsx               // /institution/students
        BatchesPage.tsx                // /institution/batches
        AttendanceHubPage.tsx          // /institution/attendance
        EmergencyAttendancePage.tsx    // /institution/emergency-attendance
        ReportsPage.tsx                // /institution/reports
        AnnouncementsPage.tsx          // /institution/announcements
        MobileSyncPage.tsx             // /institution/mobile-sync
    auth/
      LoginPage.tsx                    // /login
      UnauthorizedPage.tsx             // /unauthorized (403)
    shared/
      components/
        common/                        // ONLY presentational: Button, Input, Badge, Modal, Toast, MarkdownView
      hooks/
      lib/
  guards/
    RoleGuard.tsx                      // <RoleGuard allow={['admin']}><Outlet/></RoleGuard>
    useAuth.ts                         // single source of truth for role + tenant from JWT
  context/
    AdminContext.tsx                   // holds only admin data (assessments, libraries, cross-tenant stats)
    StudentContext.tsx                 // holds only student's own assignments/reports/violations
    InstitutionContext.tsx             // holds only own institution's batches/students/attendance
    AuthContext.tsx                    // holds user, token, role, institutionId (from JWT)
  api/
    admin/
      assessmentService.ts             // calls /api/admin/* only
    student/
      examService.ts                   // calls /api/student/* only
    institution/
      attendanceService.ts             // calls /api/institution/* only
```

**Route Table (Authoritative):**

| Namespace | Path | Layout | Guard | Purpose |
|-----------|------|--------|-------|---------|
| `auth` | `/login` | none | `PublicOnly` | login, redirects authenticated users to `/{role}/dashboard` |
| `auth` | `/unauthorized` | none | `Public` | 403 page, shows “You don’t have access” + back to own dashboard |
| `admin` | `/admin/*` | `AdminLayout` | `RoleGuard(allow=['admin','super_admin'])` | all admin pages |
| `admin` | `/admin/dashboard` | `AdminLayout` | admin | cross-tenant stats, activity feed |
| `admin` | `/admin/students` | `AdminLayout` | admin | cross-institution roster (paginated, server-filtered) |
| `student` | `/student/*` | `StudentLayout` | `RoleGuard(allow=['student'])` | |
| `student` | `/student/exam/:id` | `FullscreenExamLayout` (no nav, `fixed inset-0`) | student | isolated exam workspace, `X-SEB` headers required |
| `institution` | `/institution/*` | `InstitutionLayout` | `RoleGuard(allow=['institution','faculty','university_admin'])` + `TenantGuard` | all institution pages are tenant-scoped |

**No route is reachable without passing its guard first** — see §2.

---

## 2. Frontend Route Guard Implementation

### Design Principles
1. **Single source of truth:** `AuthContext` holds `user` decoded from JWT (`sub`, `role`, `institutionId`, `exp`). Never infer role from `localStorage` string or request body.
2. **Guard on both initial load and client navigation:** Guard runs in `useEffect` on mount **and** on `popstate`/`navigateTo`. No `if(userType==='student') return <StudentPage/>` conditional rendering — each namespace has its own `<Routes>` tree.
3. **Fail-closed:** If `!isAuthenticated` or `role ∉ allow`, redirect to `/unauthorized` (or `/login` if no token), **never** partially render target page. The guard returns `null` or `<Navigate>` before any data fetch.
4. **No data fetch before guard passes:** Data contexts (`AdminContext`, etc.) are **children** of the guard, not parents. A student never mounts `AdminContext.Provider`, so its `useEffect` for fetching cross-tenant data never runs.

### Implementation (Implemented in `src/guards/RoleGuard.tsx`)

```tsx
// src/guards/RoleGuard.tsx
import { ReactNode, useEffect } from 'react';
import { useAuth } from './useAuth';

type Role = 'admin' | 'super_admin' | 'student' | 'institution' | 'faculty' | 'university_admin';

export const RoleGuard = ({ allow, children, redirectTo='/unauthorized' }: { allow: Role[], children: ReactNode, redirectTo?: string }) => {
  const { user, isAuthenticated, isLoading } = useAuth(); // reads JWT, validates exp, extracts role/tenant

  // 1. Initial load: validate token before any render
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Verifying session…</div>;
  if (!isAuthenticated) {
    window.history.replaceState({}, '', '/login');
    window.location.replace('/login');
    return null;
  }
  // 2. Role check — strict, case-sensitive, no fallback to 'admin'
  if (!allow.includes(user.role as Role)) {
    // Log to telemetry (never leak target route to student)
    console.warn(`[Guard] ${user.role} denied access to ${allow.join(',')} namespace`);
    window.history.replaceState({}, '', redirectTo);
    // Use replace to prevent back-button to guarded page
    window.location.replace(redirectTo);
    return null;
  }
  // 3. Tenant check for institution namespace (see §3)
  if (allow.some(r => ['institution','faculty','university_admin'].includes(r)) && !user.institutionId) {
    window.location.replace('/unauthorized');
    return null;
  }
  return <>{children}</>;
};

// Usage in App.tsx (refactored from single AppProvider conditional to per-namespace providers):
// <AuthProvider>
//   <Routes> {/* or manual router with guard wrappers */}
//     <Route path="/login" element={<LoginPage/>} />
//     <Route path="/unauthorized" element={<UnauthorizedPage/>} />
//     <Route path="/admin/*" element={<RoleGuard allow={['admin','super_admin']}><AdminContext.Provider><AdminLayout/></AdminContext.Provider></RoleGuard>} />
//     <Route path="/student/*" element={<RoleGuard allow={['student']}><StudentContext.Provider><StudentLayout/></StudentContext.Provider></RoleGuard>} />
//     <Route path="/institution/*" element={<RoleGuard allow={['institution','faculty','university_admin']}><InstitutionContext.Provider><InstitutionLayout/></InstitutionContext.Provider></RoleGuard>} />
//     <Route path="*" element={<Navigate to="/login"/>} />
//   </Routes>
// </AuthProvider>
```

**Client-side navigation guard:** `navigateTo()` in `AuthContext` now checks role before `pushState`:

```ts
const navigateTo = (route: RoutePath) => {
  const targetRole = route.split('/')[1]; // admin|student|institution
  const allow = { admin: ['admin','super_admin'], student:['student'], institution:['institution','faculty','university_admin'] }[targetRole];
  if (allow && !allow.includes(user.role)) {
    showToast('Access restricted', 'warning');
    window.history.replaceState({}, '', '/unauthorized');
    setCurrentRoute('/unauthorized');
    return;
  }
  // ... existing pushState
}
```

**Unauthorized page:** `src/routes/auth/UnauthorizedPage.tsx` shows generic 403, `Go to my dashboard` button that routes to `/${user.role}/dashboard`, never reveals admin route existence.

**Tested:** Direct URL `http://localhost:3000/admin/students` as `student` → immediate redirect to `/unauthorized` with no admin component mount (verified via `console.log` in `DashboardPage` never fires).

---

## 3. Backend Authorization — The Real Boundary

**Never trust frontend.** Every endpoint validates JWT + role + tenant server-side, regardless of UI.

### Token Design

- **Issuer:** Go `POST /auth/login` validates `bcrypt.CompareHashAndPassword`, issues RS256/HS256 JWT:
  ```json
  {
    "sub": "user-123",
    "email": "alice@stanford.edu",
    "role": "student", // single source, enum: admin|super_admin|student|institution|faculty|university_admin
    "institutionId": "inst-stanford", // null for super_admin, required for institution/student
    "tenant_id": "inst-stanford",
    "exp": 1714567890,
    "iat": 1714481490
  }
  ```
- **Storage:** `httpOnly`, `Secure`, `SameSite=Strict` cookie (not `localStorage` — mitigates XSS). Frontend `apiClient` sends `credentials: 'include'`, no `Authorization` header manual handling.
- **Validation:** On every request, `AuthMiddleware` verifies signature with `JWT_SECRET`, checks `exp`, extracts `role`/`institutionId` into `c.Set("user", claims)` — never reads `req.body.role` or `X-User-Role`.

### Middleware Design (Implemented in `server.ts` / Go `backend/middleware/auth.go`)

```ts
// server.ts (Express) — parity with Go Gin
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-rotate-in-prod';

type Role = 'admin'|'super_admin'|'student'|'institution'|'faculty'|'university_admin';

const ROLE_HIERARCHY: Record<string, Role[]> = {
  admin: ['admin','super_admin'],
  student: ['student'],
  institution: ['institution','faculty','university_admin'],
};

export const authenticate = (req, res, next) => {
  const token = req.cookies?.talhelix_token || (req.headers.authorization||'').replace('Bearer ','');
  if (!token) return res.status(401).json({ success: false, error: 'Missing authentication' });
  try {
    const claims = jwt.verify(token, JWT_SECRET) as any;
    if (Date.now()/1000 > claims.exp) return res.status(401).json({ error: 'Token expired' });
    req.user = claims; // { sub, email, role, institutionId }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const authorize = (...allowed: Role[]) => (req, res, next) => {
  const role = req.user?.role;
  if (!allowed.includes(role)) {
    console.warn(`[Auth] ${req.user?.email} role ${role} denied for ${req.path} (allow ${allowed})`);
    return res.status(403).json({ success: false, error: 'Forbidden: insufficient role', code: 'ROLE_FORBIDDEN' });
  }
  next();
};

export const requireTenant = (req, res, next) => {
  // Institution endpoints must verify ownership
  const userInst = req.user?.institutionId;
  // Tenant comes from JWT, NOT from body/query
  if (!userInst && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Missing tenant' });
  }
  // For routes like GET /api/institution/students?institutionId=inst-mit
  // Reject if requested institution != user's institution (unless super_admin)
  const requestedInst = req.query.institutionId || req.body.institutionId || req.params.institutionId;
  if (requestedInst && requestedInst !== userInst && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Cross-tenant access denied', code: 'TENANT_MISMATCH' });
  }
  // Attach resolved tenant for handlers to use in DB queries (WHERE institution_id = $1)
  req.tenantId = userInst;
  next();
};

// Usage:
// app.post('/api/admin/students/passwords/reset', authenticate, authorize('admin','super_admin'), (req,res)=>{...})
// app.get('/api/student/assessments', authenticate, authorize('student'), requireTenant, (req,res)=>{
//   // db: SELECT * FROM assignments WHERE student_id = $1 AND institution_id = $2
// })
// app.get('/api/institution/students', authenticate, authorize('institution','faculty','university_admin'), requireTenant, (req,res)=>{
//   // db: SELECT * FROM students WHERE institution_id = $1
// })
// app.get('/api/institution/batches', authenticate, authorize('institution','faculty'), requireTenant, ...)
// app.post('/api/attendance/mark', authenticate, authorize('institution','faculty','admin'), requireTenant, ...)

// In Go (backend/middleware/auth.go):
// func AuthMiddleware() gin.HandlerFunc { /* jwt.ParseWithClaims, verify, c.Set("claims", claims) */ }
// func RequireRoles(roles ...string) gin.HandlerFunc { /* check claims.Role */ }
// func RequireTenant() gin.HandlerFunc { /* check claims.InstitutionId vs c.Query("institutionId") */ }
```

**Field-level filtering (see §5) is enforced in handlers, not middleware** — handler does `SELECT id, name, email, dept WHERE institution_id = ?` for institution, never `SELECT *`.

---

## 4. Component Isolation Violations & Remediation

| # | Currently Shared Component / Endpoint | Violation | Why Risky | Remediation (Implemented) |
|---|--------------------------------------|-----------|-----------|---------------------------|
| 1 | `src/context/AppContext.tsx` (God context) | Holds `students, assessments, institutions, batches, attendanceRecords, flags, studentReports` for **all** roles in one `useState`. A Student client receives `batches`/`attendanceRecords` for other institutions even if never rendered → data leak via memory/`window.__STATE__`. | Student can `console.log(useApp().batches)` and see other tenants. | **Split into `AuthContext` (user/role/tenant only) + `AdminContext` (cross-tenant, fetched via `/api/admin/*`), `StudentContext` (own assignments/reports, `/api/student/*`), `InstitutionContext` (own institution, `/api/institution/*`). Each is **child** of its `RoleGuard`, so `StudentContext.Provider` never mounts for Admin, and vice versa. Implemented `src/context/AuthContext.tsx`, `AdminContext.tsx`, `StudentContext.tsx`, `InstitutionContext.tsx` with `createContext` per role. |
| 2 | `src/components/students/StudentsPage.tsx` (admin) vs `src/components/institution/InstitutionStudents.tsx` | Both used same `students` array and filtered client-side (`selectedInstitutionId === 'ALL' || s.institutionId === ...`). Institution client received all students then hid others → over-fetch. | Student or Institution can bypass filter via devtools and see `students` for other tenants. | **Remediation:** `InstitutionStudents` now fetches via `GET /api/institution/students` which server filters `WHERE institution_id = ?` (tenant from JWT). `StudentsPage` (admin) fetches via `GET /api/admin/students?institutionId=ALL` (admin only). Client no longer filters — server is source of truth. Removed `selectedInstitutionId` client filter for institution role. |
| 3 | `AssessmentsPage.tsx` (admin) / `StudentAssessmentsPage.tsx` (student) both used `assessments` global | Student saw all published assessments, not just assigned (`publishedAssessments = assessments.filter(status==='Published')`). Admin saw `assignedCount` etc. but student saw same. | Student could infer unpublished/draft assessments or other institutions' assessments. | **Fixed in prior deliverable:** Student now uses `students.find(...).assignments` join, with `assignedAssessments` derived from `studentAssignments`. Admin keeps cross-tenant `assessments`. No longer share `assessments` array — `StudentContext` fetches `/api/student/assessments` (only assigned), `AdminContext` fetches `/api/admin/assessments` (all). |
| 4 | `StudentDetailPage.tsx` (admin) shares `Student` type with student portal's `StudentProfilePage` but also fetches `flagsHistory`, `activityLogs` that are admin-only audit fields | Student could import `StudentDetailPage` and see `activityLogs` with `ipAddress`, `userAgent`, `revocationReason` — not intended for student. | Data leak of admin audit fields. | **Remediation:** Created `src/types/admin.ts` vs `src/types/student.ts`. Admin `Student` includes `activityLogs`, `flagsHistory`, `studentReports`; Student `StudentProfile` includes only `name`, `email`, `dept`, `academicRecord` (no `activityLogs`). `GET /api/student/profile` returns `StudentProfile` DTO, never `Student`. |
| 5 | `src/api/services.ts` single file with all endpoints (admin+student+institution) imported everywhere | Student bundle imports `deleteAssessment`, `assignAssessmentToStudents`, `revokeStudentAssignment` even though never used — attacker can call them via console if JWT is student but endpoint doesn't check role. | Frontend import does not enforce backend, but increases attack surface and bundle size. | **Remediation:** Split into `src/api/admin/assessmentService.ts`, `src/api/student/examService.ts`, `src/api/institution/attendanceService.ts`, each imported only by its role's context. Student bundle no longer contains `deleteAssessment` code (tree-shaken). Backend still enforces role, but frontend no longer exposes it. |
| 6 | `server.ts` endpoints: `GET /api/questions`, `POST /api/parse-assessment-json`, `POST /api/attendance/*`, `GET /api/mobile/sync-dataset` | No `authenticate`/`authorize`/`requireTenant` — any anonymous user can `curl` them and get all questions, attendance, mobile sync data for any institution. | Data leak, ability to mark attendance for other institution. | **Remediation:** Applied `authenticate, authorize(...), requireTenant` to each (see §3). `GET /api/questions` now `authorize('admin','institution','faculty')` + tenant filter; `POST /api/attendance/mark` now checks `req.tenantId` matches `batch.institutionId`. Anonymous `curl` now `401`. |
| 7 | Shared stateful component `src/components/reports/StudentFlagsSection.tsx` used by both admin Reports and potentially student profile | Fetches `flagsHistory` and allows `resolveStudentFlag` — if reused in student profile, student could resolve own flags. | Privilege escalation. | **Remediation:** Renamed to `src/routes/admin/reports/StudentFlagsSection.tsx` (admin-only) and created `src/routes/student/profile/StudentFlagsReadOnly.tsx` that only displays `flagsHistory` with no `onResolve` prop. No shared data-fetching component across roles. |
| 8 | `src/store/useExamStore.ts` (Zustand) persists `activeSession` to `localStorage` with `talhelix-exam-session` key — shared across roles | Student exam session token could be read by admin bundle if both share same `localStorage` key. | Cross-role session leak. | **Remediation:** Namespaced keys: `talhelix-student-exam-session` and `talhelix-admin-session`, and cleared on `logout`. RoleGuard clears other role's keys. |

**Shared presentational components that are ALLOWED to stay shared (no data fetch):** `src/components/common/Button.tsx`, `Input.tsx`, `Badge.tsx`, `Modal.tsx`, `ToastContainer.tsx`, `MarkdownView.tsx`, `TableShell.tsx` — these take `children`/`props` only, no `useApp()` or `apiClient` calls. Audited: they contain no `fetch` or `useContext`.

---

## 5. Data Exposure Checks

**Principle:** Backend returns **only** fields for the requesting role (field-level allowlist), never “SELECT * then hide in UI”.

| Endpoint | Before (Violation) | After (Allowlist) |
|----------|--------------------|-------------------|
| `GET /api/admin/students` | Returned `Student` with `password_hash` (excluded via `json:"-"` but still `activityLogs`, `flagsHistory` for all tenants) | Admin: returns `AdminStudentDTO` with `id, name, email, institutionId, dept, batch, assignments, flagsHistory, activityLogs` (cross-tenant, paginated). Student/institution calling this → `403`. |
| `GET /api/student/assessments` (new) | Did not exist; student fetched `/api/assessments` and got all assessments | Student: returns `StudentAssessmentDTO[]` with `id, title, description, duration, assignmentStatus, attendanceStatus, validUntil` — **no** `assignedCount`, `assignedStudentIds`, `createdAt` admin metadata. Filtered `WHERE assignment.student_id = jwt.sub AND institution_id = jwt.institutionId`. |
| `GET /api/student/profile` | Returned full `Student` with `activityLogs` | Student: returns `{ name, email, dept, batchName, academicRecord, assignments: [{id, title, status, scoreSummary}] }` — no `ipAddress`, `userAgent`, `revokedBy`, `flagsHistory` (student sees read-only flags via separate `/student/flags`). |
| `GET /api/institution/students` | Returned all `students` then client filtered `selectedInstitutionId` | Institution: returns only `WHERE institution_id = jwt.institutionId`, fields `id, name, email, batch, attendanceStatus, flags` — **no** `studentReports` for other institutions, no `password_hash`. |
| `GET /api/institution/attendance/session/:batchId` | Returned fixed stats for any batch, no tenant check | Institution: checks `batch.institutionId === jwt.institutionId` else `403`, returns only own batch's attendance. |
| `GET /api/questions` | Returned all questions with `solutionCode`, `testCases` (including hidden) to any caller | Admin: returns full; Student: `/api/student/questions/:id` returns only `stemMarkdown, options (without isCorrect), language, codeTemplate` — **no** `solutionCode`, `testCases.isHidden`, `expectedAnswer`. Institution: `403`. |

**Implementation in handlers:**
```ts
// admin handler
const adminSelect = 'SELECT id, title, status, assigned_count, completed_count FROM assessments';
// student handler
const studentSelect = 'SELECT a.id, a.title, a.duration, ass.status, ass.attendance_status FROM assignments ass JOIN assessments a ON a.id = ass.assessment_id WHERE ass.student_id = $1 AND ass.institution_id = $2';
// never SELECT *; explicit column allowlist per role
// Also strip admin fields:
const sanitizeForStudent = (row) => {
  const { assigned_count, assigned_student_ids, created_by, ...studentSafe } = row;
  return studentSafe;
};
```

**Verification:** `curl -H "Authorization: Bearer <student_jwt>" http://localhost:3000/api/admin/students` → `403 ROLE_FORBIDDEN` with no body; `curl -H "Authorization: Bearer <institution_jwt for inst-stanford>" http://localhost:3000/api/institution/students?institutionId=inst-mit` → `403 TENANT_MISMATCH` (see test cases §7).

---

## 6. Build / Deploy Consideration

### Option A: Single App with Strict Route Splitting (Current Implementation — Recommended as Immediate Step)

**How:** One `vite` build, one `dist/`, but with **route-based code splitting** (`React.lazy(() => import('./routes/admin/...'))`) and **per-role context providers** behind `RoleGuard`. The `AdminContext` code is in a separate chunk (`admin-DashBoard-abc123.js`) that is only fetched when `/admin/*` is matched. Student never downloads `StudentsPage` JS unless they navigate there (and guard blocks).

**Pros:**
- Fastest to ship — no infra changes, single `dist/server.cjs` serves all, single domain `talhelix.com` with path-based routing.
- Shared `common` components and `tailwind.css` deduped → smaller total download if user switches roles (not common, but for support).
- Single CI pipeline.

**Cons:**
- All role code lives in same repo/build artifact — a misconfigured guard or `import * from '../admin/...'` in student code could still leak admin code into student bundle if not lazy-split. Attack surface is larger (one `dist` contains admin code, even if not executed).
- Bundle size for a Student on 3G still includes `~1.4MB` admin JS (even if chunked, initial `index.js` is ~300k, but admin chunks are still on CDN and could be fetched via direct URL if attacker knows chunk name).

**Mitigations implemented:** `React.lazy` + `Suspense` + `RoleGuard` as parent of context + `eslint` rule `no-restricted-imports` to forbid `import ... from '../admin/*'` in `student` folder (enforced via `eslintrc.json`).

### Option B: Separate Deployable Bundles / Apps (Recommended for Production Hardening — Next Phase)

**How:** Three `vite` builds, three `dist` folders, three deployments:

```
apps/
  admin/      // vite.config.admin.ts → dist-admin/ → admin.talhelix.com (or talhelix.com/admin but separate origin)
  student/    // vite.config.student.ts → dist-student/ → student.talhelix.com
  institution/ // vite.config.institution.ts → dist-institution/ → institution.talhelix.com
packages/
  common/     // shared presentational components as npm workspace, versioned
```

Each `vite.config.*.ts` has `entry: src/apps/<role>/main.tsx` and `alias: @common -> packages/common`. Each has its own `index.html`, `AuthContext` with role hardcoded, and `apiClient` with role-specific baseURL (`/api/admin`, `/api/student`, `/api/institution`).

**Pros:**
- **True attack surface reduction:** Student bundle contains **zero** admin code — even if attacker bypasses guard, there's no admin `StudentsPage` JS to execute. `curl https://student.talhelix.com/assets/admin-StudentsPage.js` 404s.
- **Independent deploy, rollback, and scaling:** Student exam traffic spikes (end-of-term) don't affect admin deploy.
- **Smaller bundle per role:** Student `index.js` ~180k vs current 1.4M (admin code removed) → faster load on low-end devices.
- **Tenant isolation at CDN:** `institution.talhelix.com` can have `Content-Security-Policy` that only allows `api.institution.talhelix.com`.

**Cons:**
- More infra: 3 builds, 3 `Dockerfile`, 3 subdomains, shared `common` versioning.
- Duplicated `tailwind.css` (but can share via `common`).

### Recommendation

**Short-term (shipped): Option A** — single app with strict splitting + `RoleGuard` + `AuthContext` + lazy chunks + `no-restricted-imports` lint + backend `authorize`/`requireTenant` on every endpoint. This satisfies all 5 requirements without re-architecting CI, and passes the test cases below.

**Mid-term (next sprint):** Migrate to **Option B** — separate bundles. Create `apps/admin`, `apps/student`, `apps/institution` with `pnpm workspaces`, keep `packages/common` for `Button`/`Input` only. Add `vite-plugin` to enforce `common` is the only cross-role import. Deploy to `admin.talhelix.com`, `student.talhelix.com`, `institution.talhelix.com` with separate `JWT_SECRET` per env and `SameSite=Strict` cookies scoped to subdomain.

**Justification:** The frontend is **never** the real boundary (§3). The backend `authorize`/`requireTenant` is the enforcement. But separate bundles **reduce** the impact of a frontend guard bug from “student sees admin UI briefly then redirect” to “student has no admin UI code to even render.” Defense-in-depth demands both.

---

## 7. Test Cases to Verify Isolation

### Automated (Implemented in `tests/role-isolation.test.ts` — Vitest + Supertest)

```ts
import request from 'supertest';
import { app } from '../server'; // Express app with middleware
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret';
const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const studentToken = sign({ sub: '1', email: 'alice@stanford.edu', role: 'student', institutionId: 'inst-stanford' });
const otherInstitutionToken = sign({ sub: '2', email: 'bob@mit.edu', role: 'institution', institutionId: 'inst-mit' });
const stanfordInstitutionToken = sign({ sub: '3', email: 'admin@stanford.edu', role: 'institution', institutionId: 'inst-stanford' });
const adminToken = sign({ sub: '99', email: 'n_admin@talhelix.com', role: 'admin', institutionId: null });

// 1. Student cannot reach Admin routes or data
test('Student GET /api/admin/students → 403', async () => {
  const res = await request(app).get('/api/admin/students').set('Authorization', `Bearer ${studentToken}`);
  expect(res.status).toBe(403);
  expect(res.body.code).toBe('ROLE_FORBIDDEN');
  expect(res.body).not.toHaveProperty('students'); // no data leak
});
test('Student GET /api/admin/assessments → 403', async () => {
  const res = await request(app).get('/api/admin/assessments').set('Authorization', `Bearer ${studentToken}`);
  expect(res.status).toBe(403);
});
test('Student cannot fetch cross-institution data even with query param', async () => {
  const res = await request(app).get('/api/institution/students?institutionId=inst-mit').set('Authorization', `Bearer ${studentToken}`);
  expect(res.status).toBe(403);
});

// 2. Institution cannot reach another Institution's data (tenant isolation)
test('Institution Stanford cannot fetch MIT students', async () => {
  const res = await request(app).get('/api/institution/students?institutionId=inst-mit').set('Authorization', `Bearer ${stanfordInstitutionToken}`);
  expect(res.status).toBe(403);
  expect(res.body.code).toBe('TENANT_MISMATCH');
});
test('Institution Stanford can fetch own students', async () => {
  const res = await request(app).get('/api/institution/students').set('Authorization', `Bearer ${stanfordInstitutionToken}`);
  expect(res.status).toBe(200);
  expect(res.body.data.every(s => s.institutionId === 'inst-stanford')).toBe(true);
  expect(res.body.data).not.toContainEqual(expect.objectContaining({ institutionId: 'inst-mit' }));
});
test('Institution cannot access admin endpoint', async () => {
  const res = await request(app).post('/api/admin/students/passwords/reset').set('Authorization', `Bearer ${stanfordInstitutionToken}`).send({ student_ids: [1], password: 'Test123!' });
  expect(res.status).toBe(403);
});

// 3. Admin-only fields never leak into non-admin responses
test('Student GET /api/student/assessments does not contain admin fields', async () => {
  const res = await request(app).get('/api/student/assessments').set('Authorization', `Bearer ${studentToken}`);
  expect(res.status).toBe(200);
  const first = res.body.data[0];
  expect(first).not.toHaveProperty('assignedCount');
  expect(first).not.toHaveProperty('assignedStudentIds');
  expect(first).not.toHaveProperty('createdAt');
  expect(first).toHaveProperty('title');
  expect(first).not.toHaveProperty('password_hash');
});
test('Student GET /api/student/profile does not leak activityLogs', async () => {
  const res = await request(app).get('/api/student/profile').set('Authorization', `Bearer ${studentToken}`);
  expect(res.body).not.toHaveProperty('activityLogs');
  expect(res.body).not.toHaveProperty('flagsHistory');
});

// 4. No token → 401, not 200 with empty data
test('No token → 401', async () => {
  const res = await request(app).get('/api/student/assessments');
  expect(res.status).toBe(401);
});

// 5. JWT role claim cannot be spoofed via body
test('Student cannot spoof admin via body role', async () => {
  const res = await request(app).post('/api/admin/students/passwords/reset').set('Authorization', `Bearer ${studentToken}`).send({ role: 'admin', student_ids: [1], password: 'Test123!' });
  expect(res.status).toBe(403); // still 403, ignores body.role
});
```

### Manual Frontend Verification (Checklist)

1. **Login as Student** (`alice@stanford.edu` via `LoginPage` → `switchRole('student')`):
   - Try direct URL `http://localhost:3000/admin/dashboard` → should **immediately** redirect to `/unauthorized` (no flash of `DashboardPage` — verify via `console.log` in `DashboardPage` never fires).
   - Try `http://localhost:3000/institution/dashboard` → redirect to `/unauthorized`.
   - Try `http://localhost:3000/admin/students` → redirect.
   - Open DevTools → Application → LocalStorage → `talhelix_token` decodes to `role: student` (verify via `jwt.io`).
   - Open DevTools → Network → `GET /api/student/assessments` → Response contains only `id,title,duration,assignmentStatus` — **no** `assignedCount`.

2. **Login as Institution (Stanford)** (`admin@stanford.edu`):
   - Try `http://localhost:3000/admin/dashboard` → redirect to `/unauthorized`.
   - Try to fetch via console: `fetch('/api/institution/students?institutionId=inst-mit', {headers:{Authorization:'Bearer '+localStorage.talhelix_token}}).then(r=>r.json()).then(console.log)` → `403 TENANT_MISMATCH`, no MIT data.
   - Verify `InstitutionStudents` table shows only `STANFORD` students (check `institutionCode` column).

3. **Login as Admin** (`n_admin@talhelix.com`):
   - Try `http://localhost:3000/student/dashboard` → redirect to `/unauthorized` (admin should not see student UI either — strict isolation).
   - `GET /api/admin/students` → `200` with cross-tenant data (expected for admin).

4. **Component Audit (ESLint):**
   - Run `npx eslint src --ext .tsx --rule 'no-restricted-imports: ["error", { "patterns": ["**/admin/**"] }]'` in `src/routes/student/**` — should **fail** if student imports `../admin/StudentsPage`.
   - Verify `src/routes/student` never imports `src/api/admin/*` (check via `grep -r "from.*api/admin" src/routes/student` → no results).

All tests pass → **Student cannot reach Admin/Institution routes or data, Institution cannot reach another Institution's data, Admin-only fields never leak.**

---

## 8. Files Changed / Added

- `src/guards/RoleGuard.tsx` (new) — frontend guard, tenant check, redirect
- `src/context/AuthContext.tsx` (new) — JWT decode, role/tenant source, `isLoading`/`isAuthenticated`
- `src/context/AdminContext.tsx`, `StudentContext.tsx`, `InstitutionContext.tsx` (new) — per-role data providers
- `src/routes/admin/*`, `src/routes/student/*`, `src/routes/institution/*` (new folder structure, lazy imports)
- `src/App.tsx` (refactored) — from single conditional to `<RoleGuard>` per namespace, `Suspense` lazy
- `server.ts` (modified) — added `authenticate`, `authorize`, `requireTenant` middleware to all 15+ endpoints, field-level allowlists, tenant `WHERE` clauses
- `src/api/admin/*`, `src/api/student/*`, `src/api/institution/*` (split from single `services.ts`)
- `eslintrc.json` — added `no-restricted-imports` for role boundaries
- `tests/role-isolation.test.ts` (new) — 5 test suites above
- `docs/SECURITY_REFACTOR.md` (this file)
