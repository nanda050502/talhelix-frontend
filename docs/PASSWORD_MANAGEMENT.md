# TalHelix Password Management — Design & Implementation

> **Scope:** Replaces manual SQL-script workflow for resetting login access before/after assessments. Lives under **Students → Student Management (Candidate Management)**.

---

## 1. API Endpoint Design

### Auth
- **All endpoints Admin-only.** Go middleware extracts HS256 JWT (`Authorization: Bearer <token>`) → `user_role` must be `admin` / `super_admin` / `university_admin`. Returns `403 Forbidden` otherwise.
- Rate-limited / idempotency-ready for batch bursts.

### Routes

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST` | `/api/admin/students/passwords/reset-custom` | Set custom plaintext → bcrypt hash for selected students | Admin JWT |
| `POST` | `/api/admin/students/passwords/reset-default` | Reset selected to shared fallback `srmpassword26` (bcrypt-hashed same path) | Admin JWT |
| `POST` | `/api/admin/students/passwords/reset` | Unified: `{action: "set-custom"|"reset-default"}` | Admin JWT |
| `GET`  | `/api/admin/password-audits?limit=50` | List audit entries (no plaintext/hash) | Admin JWT |
| Legacy aliases `POST /api/admin/students/reset-password` and `/reset-password-default` kept for backward compat. |

### Request Shapes

**Reset Custom — `POST .../reset-custom`**
```json
{
  "student_ids": [1, 2, 99],
  "emails": ["Alice@Stanford.edu", "bob@mit.edu"],
  "password": "plaintext-never-logged",
  "batch_id": "batch-cs-26a"
}
```
- `student_ids` **or** `emails` required (at least one entry). `batch_id` optional audit context.
- `emails` matched case-insensitively via `LOWER(email)=LOWER($1)` in Go.
- `password` required.

**Reset Default — `POST .../reset-default`**
```json
{
  "student_ids": [1, 2],
  "emails": ["alice@stanford.edu"],
  "batch_id": "batch-cs-26a"
}
```
- No `password` field — server injects `DEFAULT_FALLBACK_PASSWORD = "srmpassword26"` internally.

**Unified — `POST .../reset`**
```json
{
  "student_ids": [1],
  "emails": ["alice@stanford.edu"],
  "action": "set-custom",
  "password": "S3cure!Pass2026",
  "batch_id": "batch-cs-26a"
}
```

### Response Shape (never returns plaintext or hash)

```json
{
  "success": true,
  "action": "set-custom",
  "total_requested": 156,
  "updated_count": 154,
  "failed_count": 2,
  "failures": [
    { "studentId": 9999, "email": "notfound@stanford.edu", "error": "Student not found (LOWER(email) mismatch)" }
  ],
  "audit_log_id": "audit-lkb9x2-a1b2",
  "message": "154 updated, 2 failed — view details"
}
```
- Success case: `failed_count===0` → `"154 passwords updated successfully."`
- Transaction mismatch (strict mode): `500` with `code: "TX_ROW_COUNT_MISMATCH"`, roll back, `updated_count: 0`.

### Error Codes
- `400 WEAK_PASSWORD` — strength validation failed (see §2).
- `400` — no selection provided.
- `409 CONCURRENT_RESET` — per-student lock held (concurrent reset in progress).
- `403` — non-admin role.
- `500 TX_ROW_COUNT_MISMATCH` — affected rows != expected, rolled back.

---

## 2. Backend Handler Logic (Go/Gin parity — mirrored in `server.ts`)

### File Reference
- Mock impl: `server.ts:1214-1450` (Express, mirrors Go).
- Production Go: `backend/handlers/password_reset.go` (see snippet below) + `backend/services/password_service.go`.

### Validation (before hashing)

```go
// password_policy.go
func validatePasswordStrength(pw string) error {
    if len(pw) == 0 { return errors.New("Password must not be empty") }
    if len(pw) < 8 { return errors.New("Password must be at least 8 characters") }
    if len(pw) > 128 { return errors.New("Password must be at most 128 characters") }
    cats := 0
    if regexp.MustCompile(`[A-Z]`).MatchString(pw) { cats++ }
    if regexp.MustCompile(`[a-z]`).MatchString(pw) { cats++ }
    if regexp.MustCompile(`[0-9]`).MatchString(pw) { cats++ }
    if regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(pw) { cats++ }
    if cats < 3 { return errors.New("Must contain at least 3 of: uppercase, lowercase, digit, special") }
    if regexp.MustCompile(`(.)\1\1`).MatchString(pw) { return errors.New("Must not contain 3 identical consecutive characters") }
    weak := map[string]bool{"password":true, "password123":true, "12345678":true, "srmpassword26":true, "talhelix":true}
    if weak[strings.ToLower(pw)] { return errors.New("Password is too weak") }
    if pw == DEFAULT_FALLBACK_PASSWORD { return errors.New(`Use Reset to Default button for fallback`) }
    return nil
}
```

### Worker Pool (cap `min(runtime.NumCPU(),8)`)

```go
// Go production
func hashPasswordsWithPool(ctx context.Context, plaintext string, count int) ([]string, error) {
    workers := min(runtime.NumCPU(), 8)
    if workers > count { workers = count }
    sem := make(chan struct{}, workers)
    results := make([]string, count)
    errs := make([]error, count)
    var wg sync.WaitGroup
    for i:=0; i<count; i++ {
        wg.Add(1); sem <- struct{}{}
        go func(idx int){
            defer wg.Done(); defer func(){ <-sem }()
            h, err := bcrypt.GenerateFromPassword([]byte(plaintext), bcrypt.DefaultCost)
            results[idx] = string(h); errs[idx] = err
        }(i)
    }
    wg.Wait()
    for _, e := range errs { if e != nil { return nil, e } }
    return results, nil
}
```
- JS mock in `server.ts:hashPasswordsWithPool` uses `Promise` pool with concurrency 8, `simulatedBcryptHash` (40–100ms delay, fake `$2a$10$` hash) to avoid blocking event loop.

### Transaction Flow

```
POST /reset-custom {ids, emails, password}
 1. requireAdmin(c) -> 403 if not admin
 2. normalize selection: dedupe emails via ToLower, dedupe ids; totalRequested = len(ids)+len(emails)
 3. validatePasswordStrength(password) -> 400 if fails
 4. concurrency guard: per-student lock Set[LOWER(email) / id:<id>]; if locked -> 409
 5. BEGIN TX  (db.BeginTx(ctx, nil))
 6. hashes := hashPasswordsWithPool(ctx, password, totalRequested)
 7. FOR each target:
        // case-insensitive match — critical to avoid silent skip
        res := tx.ExecContext(ctx, `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE LOWER(email)=LOWER($2) OR id=$3`, hash, email, id)
        affected, _ := res.RowsAffected()
        // collect per-row failures (e.g., not found -> affected 0)
 8. // Verify row count before commit
    if affectedTotal != totalRequested {
        tx.Rollback()
        // strict mode: rollback all; non-strict: commit partial and report failures
        return 500 TX_ROW_COUNT_MISMATCH or 200 with failures[]
    }
 9. tx.Commit()
10. INSERT audit log (see §4) — never plaintext/hash
11. return JSON {updated_count, failed_count, failures, audit_log_id}
    // finally: release locks
```

- Default path identical, but `plaintext = DEFAULT_FALLBACK_PASSWORD` and skips `validatePasswordStrength` for that exact value (allow-listed).

### LOWER(email) Correctness
- All lookups use `LOWER(email)=LOWER($1)`; Go normalizes input via `strings.ToLower(strings.TrimSpace(email))` AND SQL uses `LOWER()`, so `Alice@Stanford.edu` matches `alice@stanford.edu` — no silent skip.

---

## 3. Frontend Component Changes

### Files Changed
- `src/components/students/PasswordResetModals.tsx` (new) — 3 modals: `ResetCustomPasswordModal`, `ResetDefaultConfirmModal`, `ResetResultModal`.
- `src/components/students/StudentsPage.tsx` — integrated buttons + state + handlers.
- `src/api/services.ts` — added `validatePasswordStrengthClient`, `resetPasswordsCustom`, `resetPasswordsDefault`, `resetPasswordsUnified`, `fetchPasswordAudits` types.

### Button Placement
- **Batch bar** (`StudentsPage.tsx:746` — visible when `selectedStudentIds.length>0`): after `Assign Assessment` / `Record Flag`, divider, then:
  - `Reset TalHelix Password` (indigo, `KeyRound` icon) — opens custom form.
  - `Reset to Default Password` (white/slate, `RotateCcw`) — opens batch confirmation.
  - Both `disabled={resetPending}` to prevent duplicate submissions.
- **Per-row Actions** (`StudentsPage.tsx:1131` desktop table; mobile card `~904`): two icon buttons beside `Profile`:
  - `KeyRound` indigo — single-student custom reset.
  - `RotateCcw` slate — single-student default reset.
  - Clicking per-row does **not** clear bulk selection; handler prioritizes `singleResetStudentId` over `selectedStudentIds` via `getPasswordResetTargets()`.

### Form & Confirmation Dialog
- **Custom modal** (`PasswordResetModals.tsx:ResetCustomPasswordModal`):
  - Inputs: `New Password` + `Confirm Password` with show/hide toggles (`Eye`/`EyeOff`).
  - Live strength meter (weak/fair/good/strong) + validation feedback (3/4 categories, no 3 repeats, deny-list).
  - Target summary: shows count + truncated IDs/emails, note about bcrypt + transaction + audit (never logs secret).
  - Policy callout with amber `ShieldCheck`, includes **recommendation**: unique per-student temps > shared default (non-blocking).
  - Submit disabled until `validation.valid && confirm === password && !isPending && count>0`.
  - On submit: `handleConfirmResetCustom(password)` → `POST /reset-custom` with `student_ids` + `emails` (both sent, server dedupes).
- **Default confirmation** (`ResetDefaultConfirmModal`):
  - Amber warning card with `AlertTriangle`, headline `"This will reset passwords for 156 students. Continue?"` when `isBatch` (count>1).
  - Shows truncated target list, notes `LOWER(email)` handling, transaction verification, audit.
  - Single case shows `email · ID` line.
  - `Cancel` / `Reset to Default (N)` buttons, pending shows `Loader2` spinner.

### Result Feedback
- **Result modal** (`ResetResultModal`):
  - Header: `Passwords Updated` (all success, emerald) vs `Password Reset — Partial Result` (amber).
  - Chips: `Total: N`, `✓ updated`, `✗ failed`, `audit: id`.
  - Failures table (scroll, sticky header) — `failures[]` with per-student error.
  - Success note: transaction verified, audit logged without secret.
  - `Done` closes. Toast also shown via `showToast`: success (`success`) or warning (`warning`) with `"154 updated, 2 failed — view details"`.

### Disable-While-Pending
- `resetPending` state toggled around `await resetPasswords*` (try/finally). Disables:
  - Batch bar buttons, per-row icon buttons (`disabled:opacity-40`), modal Cancel/Submit (`disabled:opacity-50` + `cursor-not-allowed`), and backdrop close (`onClose` noop when pending).
  - Prevents double-submit race and respects per-student server lock (`409` if concurrent).

---

## 4. Audit Log Schema

### SQL Migration
```sql
-- migrations/20260901_password_audit_logs.sql
CREATE TABLE IF NOT EXISTS password_reset_audits (
  id              TEXT PRIMARY KEY,           -- audit-xxx
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_email     TEXT NOT NULL,              -- who performed it (from JWT)
  actor_role      TEXT NOT NULL,              -- admin / super_admin etc.
  actor_ip        TEXT NOT NULL,
  user_agent      TEXT NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('set-custom','reset-default')),
  batch_id        TEXT,                       -- optional batch context e.g. batch-cs-26a
  student_count_requested INT NOT NULL,
  student_ids     JSONB NOT NULL DEFAULT '[]', -- array of ids (numbers/strings)
  student_emails  JSONB NOT NULL DEFAULT '[]', -- lowercased emails (for case-insensitive audit)
  success_count   INT NOT NULL,
  failure_count   INT NOT NULL,
  failures        JSONB NOT NULL DEFAULT '[]', -- [{studentId,email,error}]
  -- NEVER store plaintext or hash: enforced by application layer + column absence
  CONSTRAINT chk_no_secret CHECK (true) -- app-level guarantee: code never inserts password/hash
);

CREATE INDEX IF NOT EXISTS idx_password_audits_actor ON password_reset_audits(actor_email);
CREATE INDEX IF NOT EXISTS idx_password_audits_created_at ON password_reset_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_audits_action ON password_reset_audits(action);
CREATE INDEX IF NOT EXISTS idx_password_audits_batch ON password_reset_audits(batch_id) WHERE batch_id IS NOT NULL;

-- Example RLS (if using Supabase/Postgres RLS): admin-only read
-- ALTER TABLE password_reset_audits ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY admin_read ON password_reset_audits FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin','super_admin'));
```

### Mock Store (`server.ts`)
```ts
type PasswordAuditAction = 'set-custom' | 'reset-default';
interface PasswordAuditEntry {
  id: string; timestamp: string; actor: string; actorRole: string;
  action: PasswordAuditAction; batchId?: string;
  studentCountRequested: number; studentIds: (number|string)[];
  studentEmails: string[]; successCount: number; failureCount: number;
  failures: Array<{studentId?:..., email?:..., error:string}>;
  ipAddress: string; userAgent: string;
}
const passwordAuditLog: PasswordAuditEntry[] = []; // capped 500, GET /password-audits
```

### What Is Logged
- `actor` (JWT email), `actorRole`, `timestamp`, `IP`, `User-Agent`, `action` (`set-custom` vs `reset-default`), `batchId`, `studentCountRequested`, `studentIds`, `studentEmails` (lowercased), `successCount`, `failureCount`, `failures[]` with per-student error.
- **Never** plaintext/password_hash — enforced by handler (no column, no log of `password` param).

---

## 5. Edge Cases to Handle

| Case | Detection | Handling |
|------|-----------|----------|
| **Partial batch failure** (e.g., 2 of 156 not found) | Per-row `RowsAffected()==0` → collect in `failures[]`; `updated_count < total` | Non-strict mode: commit partial, return `success: false` with `updated/failed` counts + failures table; strict query `?strict=true` rolls back all (0 updated). UI shows Result modal with warning. Audit logs both counts. |
| **Concurrent reset requests** (same student, two admins) | In-mem `passwordResetLocks` Set keyed by `LOWER(email)` / `id:<id>`; Go would use `SELECT ... FOR UPDATE` or advisory lock | `409 CONCURRENT_RESET` with `"Concurrent reset already in progress for ..."`, client keeps button disabled + toast. Lock released in `finally`. |
| **Invalid/weak password input** | `validatePasswordStrength` (empty, <8, >128, <3 categories, 3 repeats, deny-list, equals default) | `400 WEAK_PASSWORD` with field error; client-side pre-validation blocks submit, shows inline `AlertTriangle` + strength meter; server is source of truth. |
| **Email case mismatch** | Input `Alice@Stanford.edu` vs DB `alice@stanford.edu` | Both Go `strings.ToLower` + SQL `LOWER(email)=LOWER($1)`; mock normalizes `uniqueEmails` via `.toLowerCase()`. Prevents silent skip. |
| **Empty selection** | `totalRequested===0` | `400 No students selected` — toast, no modal submit. |
| **Transaction row-count mismatch** | `affectedTotal != totalRequested` | Rollback + `500 TX_ROW_COUNT_MISMATCH` (no passwords changed) or partial commit path; surfaced as Result modal error + audit. |
| **Duplicate submission (double-click)** | `resetPending` flag + button `disabled` + per-student lock | Frontend disables buttons + modal actions while `isPending`; backend lock returns `409` if race slips through. |
| **Network timeout / bcrypt CPU spike** | Worker pool cap 8 + 30s Axios timeout (`apiClient`) | `hashPasswordsWithPool` `Promise` with 8-way concurrency; on error return `500 worker pool error`; UI shows error toast, keeps selection. |
| **Hash never leaked** | No `password_hash` in JSON (`json:"-"`), handler never appends hash to response | Response type explicitly omits field; tests assert `!res.body.hash && !res.body.password`. |
| **Batch of 0 or filtered empty** | `filteredStudents.length===0` → Select All disabled | Button bar not rendered when `selectedIds.length===0`; per-row single still works. |
| **Mixed id+email selection** | Unified list `[...emails, ...ids]` with dedupe | Hashes array indexed to unified list; audit stores both arrays. |

---

## 6. Recommendation Flag

> **Note (non-blocking):** The current workflow reuses a shared default password (`srmpassword26`) across all students for convenience. This is retained for scope parity, but **unique per-student temporary passwords** (e.g., `Temp-<random>-<batch>`) would be a stronger long-term alternative — reducing blast radius if the default leaks, enabling per-student expiry and safer bulk distribution. Consider migrating to one-time temp passwords with forced reset on next login, without changing current deliverable.

---

## 7. Files Touched

- `server.ts` — added worker-pool, validation, transactional handlers, audit store, 4 POST routes + GET audit.
- `src/api/services.ts` — added `PasswordReset*` types, `validatePasswordStrengthClient`, `resetPasswordsCustom/Default/Unified`, `fetchPasswordAudits`.
- `src/components/students/PasswordResetModals.tsx` *(new)* — policy-hinted modals + result feedback.
- `src/components/students/StudentsPage.tsx` — batch bar + per-row actions, pending guard, handlers, modals integration.
- `docs/PASSWORD_MANAGEMENT.md` *(this file)* — spec + Go snippets + schema.
- `migrations/20260901_password_audit_logs.sql` *(see §4 SQL)*.

---

## 8. Manual Test Plan

1. Select 1 candidate → `Reset TalHelix Password` → try weak `abc123` → inline error, submit blocked → enter `S3cure!Pass2026` + confirm → success toast, audit via `GET /password-audits`.
2. Select 3 via checkboxes → `Reset TalHelix Password` → enter valid → verify `3 updated, 0 failed`.
3. Select 2 → `Reset to Default` → confirmation shows count → confirm → success.
4. Batch 156: Select All → `Reset to Default` → dialog shows `"This will reset passwords for 156 students. Continue?"` → cancel keeps selection, confirm shows result.
5. During pending, buttons disabled — try rapid double-click → no duplicate request, second attempt gets `409` if race.
6. Try `Alice@Stanford.edu` uppercase → verify matched (no skip) via audit `studentEmails` lowercased.
7. Check Network response → no `password` or `hash` field.

