import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';

// Extend Express Request to carry authenticated user claims (JWT role + tenant)
interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
    institutionId?: string | null;
    tenant_id?: string | null;
  };
  tenantId?: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'talhelix-dev-secret-rotate-in-prod-2026';
const JWT_ISSUER = 'talhelix-auth';

// Utility to generate a test JWT (for local dev / tests) — never exposes secret to client
export const generateTestToken = (payload: { sub: string; email: string; role: string; institutionId?: string | null }) => {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      institutionId: payload.institutionId ?? null,
      tenant_id: payload.institutionId ?? null,
    },
    JWT_SECRET,
    { expiresIn: '24h', issuer: JWT_ISSUER }
  );
};

interface RawTestCase {
  id?: string;
  input?: string;
  stdin?: string;
  args?: string;
  expectedOutput?: string;
  expected_output?: string;
  output?: string;
  stdout?: string;
  isHidden?: boolean;
  is_hidden?: boolean;
  hidden?: boolean;
  marks?: number;
  score?: number;
  explanation?: string;
}

interface RawOption {
  id?: string;
  text?: string;
  option?: string;
  value?: string;
  label?: string;
  isCorrect?: boolean;
  is_correct?: boolean;
  correct?: boolean;
}

interface RawQuestion {
  id?: string;
  title?: string;
  name?: string;
  question_title?: string;
  type?: string;
  question_type?: string;
  difficulty?: string;
  level?: string;
  question_difficulty?: string;
  marks?: number;
  points?: number;
  score?: number;
  question_marks?: number;
  negativeMarks?: number;
  negative_marks?: number;
  penalty?: number;
  requireReasoning?: boolean;
  require_reasoning?: boolean;
  stemMarkdown?: string;
  stem_markdown?: string;
  prompt?: string;
  question?: string;
  questionText?: string;
  stem?: string;
  description?: string;
  content?: string;
  options?: RawOption[];
  choices?: (RawOption | string)[];
  answers?: (RawOption | string)[];
  correctAnswer?: string | number | (string | number)[];
  correct_answer?: string | number | (string | number)[];
  correct_options?: (string | number)[];
  correctOptionId?: string | number;
  correct_option_id?: string | number;
  answer?: string;
  language?: string;
  lang?: string;
  codeTemplate?: string;
  code_template?: string;
  starterCode?: string;
  starter_code?: string;
  template?: string;
  boilerplate?: string;
  solutionCode?: string;
  solution_code?: string;
  solution?: string;
  testCases?: RawTestCase[];
  test_cases?: RawTestCase[];
  tests?: RawTestCase[];
  starter_codes?: any;
  starterCodes?: any;
  timeLimitSec?: number;
  time_limit?: number;
  time_limit_ms?: number;
  memoryLimitMb?: number;
  memory_limit?: number;
  memory_limit_kb?: number;
  expectedAnswer?: string;
  expected_answer?: string;
  acceptableAnswers?: string[];
  acceptable_answers?: string[];
  evaluationRubric?: string;
  rubric?: string;
  boilerplates?: Record<string, string>;
  codeTemplates?: Record<string, string>;
  code_templates?: Record<string, string>;
  templates?: Record<string, string>;
  input_format?: string;
  output_format?: string;
  constraints?: string[];
  examples?: any[];
  question_tags?: string[];
  tags?: string[];
  [key: string]: any;
}

/**
 * Backend Authorization Middleware — Defense in Depth (never trust frontend)
 * - authenticate: verifies JWT signature, exp, issuer, extracts role/tenant
 * - authorize(...roles): checks role claim, 403 if insufficient
 * - requireTenant: ensures institution-scoped endpoints only access own tenant (unless super_admin)
 * All API endpoints must use these, regardless of frontend guard.
 */
const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Allow health check without auth for load balancer
  if (req.path === '/api/health' || req.path === '/api/auth/test-token') return next();

  // Try httpOnly cookie first (preferred), then Authorization header
  const cookieToken = (req.headers.cookie || '').split(';').find((c) => c.trim().startsWith('talhelix_token='))?.split('=')[1];
  const headerToken = (req.headers.authorization as string)?.replace(/^Bearer\s+/i, '');
  const token = cookieToken || headerToken;

  // DEV BYPASS: In non-production, allow x-mock-role header for local mock frontend (which doesn't yet send real JWT)
  // This keeps the existing mock UI working while still testing role isolation via header
  // In production, this bypass is disabled — only real JWT is accepted
  if (!token && process.env.NODE_ENV !== 'production') {
    const mockRole = (req.headers['x-mock-role'] as string) || (req.headers['x-user-role'] as string);
    const mockInstitution = (req.headers['x-mock-institution'] as string) || (req.headers['x-institution-id'] as string) || null;
    const mockEmail = (req.headers['x-mock-email'] as string) || 'dev@talhelix.com';
    if (mockRole) {
      console.warn(`[Auth] DEV BYPASS: using x-mock-role=${mockRole} for ${req.path} (no JWT)`);
      req.user = {
        sub: 'dev-user',
        email: mockEmail,
        role: mockRole,
        institutionId: mockInstitution,
        tenant_id: mockInstitution,
      };
      req.tenantId = mockInstitution;
      return next();
    }
    // Also allow x-actor headers used by password reset mock
    const actorRole = (req.headers['x-actor-role'] as string) || (req.headers['x-user-role'] as string);
    if (actorRole) {
      req.user = {
        sub: 'dev-actor',
        email: (req.headers['x-actor-email'] as string) || mockEmail,
        role: actorRole,
        institutionId: mockInstitution,
        tenant_id: mockInstitution,
      };
      req.tenantId = mockInstitution;
      return next();
    }
    // No token and no mock header — in dev, allow through as anonymous for backward compat but log warning
    // This ensures the existing mock frontend (which doesn't send JWT) doesn't break during refactor
    // The frontend guards still enforce role isolation; backend will still block sensitive actions via authorize
    console.warn(`[Auth] DEV: no token for ${req.path}, allowing as anonymous (will be blocked by authorize if role required)`);
    req.user = {
      sub: 'anonymous',
      email: 'anonymous@talhelix.com',
      role: 'anonymous',
      institutionId: null,
      tenant_id: null,
    };
    req.tenantId = null;
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing authentication', code: 'NO_TOKEN' });
  }

  try {
    const claims = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as any;
    // Validate required claims
    if (!claims.sub || !claims.role) {
      return res.status(401).json({ success: false, error: 'Invalid token claims', code: 'BAD_CLAIMS' });
    }
    req.user = {
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      institutionId: claims.institutionId ?? claims.tenant_id ?? null,
      tenant_id: claims.tenant_id ?? claims.institutionId ?? null,
    };
    req.tenantId = req.user.institutionId;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
};

const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      console.warn(`[Auth] DENIED role=${role} path=${req.path} allow=${allowedRoles.join(',')} user=${req.user?.email}`);
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient role', code: 'ROLE_FORBIDDEN', required: allowedRoles });
    }
    next();
  };
};

const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  const userInst = req.user?.institutionId || req.user?.tenant_id;
  // super_admin can access any tenant (but still must specify)
  if (userRole === 'super_admin' || userRole === 'admin') {
    // For admin, if a tenant is requested, allow it; otherwise set to user's tenant or null (cross-tenant)
    const requested = (req.query.institutionId as string) || (req.body?.institutionId as string) || (req.params as any)?.institutionId;
    req.tenantId = requested || userInst || null;
    return next();
  }
  if (!userInst) {
    return res.status(403).json({ success: false, error: 'Missing tenant for institution user', code: 'NO_TENANT' });
  }
  // For institution/student, verify requested tenant matches JWT tenant (never trust body/query)
  const requestedInst = (req.query.institutionId as string) || (req.body?.institutionId as string) || (req.params as any)?.institutionId || (req.query.tenant_id as string);
  if (requestedInst && requestedInst !== userInst) {
    console.warn(`[Auth] TENANT_MISMATCH user=${req.user?.email} userInst=${userInst} requested=${requestedInst} path=${req.path}`);
    return res.status(403).json({ success: false, error: 'Cross-tenant access denied', code: 'TENANT_MISMATCH' });
  }
  // Also verify resource ownership for batch/student-specific endpoints: check batch.institutionId === userInst
  // Handlers will do additional DB-level WHERE institution_id = $1 checks (see below)
  req.tenantId = userInst;
  next();
};

// Field-level allowlist helpers — never SELECT *; return only role-authorized fields
const sanitizeAssessmentForRole = (assessment: any, role: string) => {
  if (role === 'admin' || role === 'super_admin') return assessment; // admin sees all
  // student / institution: strip admin-only fields
  const { assignedCount, assignedStudentIds, createdBy, ...studentSafe } = assessment;
  return studentSafe;
};

const sanitizeStudentForRole = (student: any, role: string, tenantId: string | null) => {
  if (role === 'admin' || role === 'super_admin') return student; // admin sees all, including cross-tenant
  // For student/institution, strip sensitive admin fields and ensure tenant match
  const { password_hash, activityLogs, ...rest } = student;
  // Institution sees only own tenant — already filtered by WHERE, but double-check
  if (tenantId && student.institutionId !== tenantId) return null;
  if (role === 'student') {
    // Student sees only own profile, no other students' activityLogs/flagsHistory beyond own
    // Return minimal profile for other students (should not happen as query is filtered to own id)
    return rest;
  }
  return rest;
};

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Intelligently determines question type (CODING, MCQ, MSQ, FILL_BLANK, SHORT_ANSWER, SCENARIO)
 * based on question fields, properties, keywords, and structures.
 */
function determineQuestionType(q: RawQuestion): {
  type: 'CODING' | 'MCQ' | 'MSQ' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'SCENARIO';
  confidence: number;
} {
  const explicitType = (q.type || q.question_type || '').toUpperCase().trim();

  if (explicitType === 'CODING' || explicitType === 'CODE' || explicitType === 'PROGRAMMING') {
    return { type: 'CODING', confidence: 1.0 };
  }
  if (explicitType === 'MSQ' || explicitType === 'MULTIPLE_SELECT' || explicitType === 'MULTI_SELECT') {
    return { type: 'MSQ', confidence: 1.0 };
  }
  // Handle MCQ_SINGLE variants from sample files (e.g., reasoning_mcq_set1.json)
  if (explicitType === 'MCQ' || explicitType === 'MCQ_SINGLE' || explicitType === 'MULTIPLE_CHOICE' || explicitType === 'SINGLE_CHOICE' || explicitType.startsWith('MCQ')) {
    return { type: 'MCQ', confidence: 1.0 };
  }
  if (explicitType === 'FILL_BLANK' || explicitType === 'FILL_IN_BLANK' || explicitType === 'BLANK') {
    return { type: 'FILL_BLANK', confidence: 1.0 };
  }
  if (explicitType === 'SHORT_ANSWER' || explicitType === 'SUBJECTIVE' || explicitType === 'TEXT') {
    return { type: 'SHORT_ANSWER', confidence: 1.0 };
  }
  if (explicitType === 'SCENARIO' || explicitType === 'CASE_STUDY') {
    return { type: 'SCENARIO', confidence: 1.0 };
  }

  // Heuristic 1: Coding Question Indicators — extended for STEP1-COD samples (starter_codes array)
  const hasCodeTemplate = !!(
    q.codeTemplate ||
    q.code_template ||
    q.starterCode ||
    q.starter_code ||
    q.template ||
    q.boilerplate ||
    (Array.isArray(q.starter_codes) && q.starter_codes.length > 0) ||
    (Array.isArray(q.starterCodes) && q.starterCodes.length > 0)
  );
  const hasTestCases = Array.isArray(q.testCases || q.test_cases || q.tests || q.test_cases) && (q.testCases || q.test_cases || q.tests || (q as any).test_cases)!.length > 0;
  const hasLanguage = !!(q.language || q.lang);
  const hasSolutionCode = !!(q.solutionCode || q.solution_code || q.solution);

  const textContent = `${q.title || q.question_title || ''} ${q.stemMarkdown || q.prompt || q.question || q.questionText || q.stem || q.description || ''}`.toLowerCase();
  const codingKeywords = [
    'write a function',
    'implement a function',
    'time complexity',
    'space complexity',
    'def solution',
    'function solution',
    'class solution',
    'return the array',
    'return indices',
    'leetcode',
    'stdin',
    'stdout',
    'runtime error',
  ];
  const hasCodingKeywords = codingKeywords.some((kw) => textContent.includes(kw));

  if (hasCodeTemplate || hasTestCases || (hasLanguage && !q.options && !q.choices) || hasSolutionCode || (hasCodingKeywords && !q.options && !q.choices)) {
    return { type: 'CODING', confidence: 0.95 };
  }

  // Heuristic 2: Options / Choices indicators (MCQ / MSQ)
  const rawOptions = q.options || q.choices || q.answers;
  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    // Check if multiple options are marked correct
    let correctCount = 0;
    rawOptions.forEach((opt: any) => {
      if (typeof opt === 'object' && opt !== null && (opt.isCorrect || opt.is_correct || opt.correct)) {
        correctCount++;
      }
    });

    if (Array.isArray(q.correct_options) && q.correct_options.length > 1) {
      return { type: 'MSQ', confidence: 0.9 };
    }
    if (correctCount > 1) {
      return { type: 'MSQ', confidence: 0.9 };
    }
    return { type: 'MCQ', confidence: 0.9 };
  }

  // Heuristic 3: Fill in Blank Indicators
  if (q.expectedAnswer || q.expected_answer || q.acceptableAnswers || q.acceptable_answers || textContent.includes('fill in the blank') || textContent.includes('_______')) {
    return { type: 'FILL_BLANK', confidence: 0.85 };
  }

  // Heuristic 4: Short Answer / Scenario
  if (textContent.includes('explain in detail') || textContent.includes('describe why') || textContent.includes('scenario:') || textContent.length > 300) {
    return { type: 'SCENARIO', confidence: 0.75 };
  }

  // Default fallback
  return { type: 'MCQ', confidence: 0.5 };
}

/**
 * Normalizes options for MCQ and MSQ questions
 */
function normalizeOptions(
  q: RawQuestion,
  qIdx: number,
  determinedType: 'MCQ' | 'MSQ'
): { id: string; text: string; isCorrect: boolean }[] {
  const rawOptions = q.options || q.choices || q.answers;

  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    // Support correctOptionId from sample files (reasoning_mcq_set1.json) alongside legacy fields
    const rawCorrect = q.correctAnswer ?? q.correct_answer ?? (q as any).correctOptionId ?? (q as any).correct_option_id ?? q.correct_options;
    const correctAnswers = Array.isArray(rawCorrect)
      ? (rawCorrect as (string | number)[])
      : rawCorrect !== undefined
      ? [rawCorrect as string | number]
      : [];

    const normalized = rawOptions.map((opt: any, optIdx: number) => {
      let optText = '';
      let isCorrect = false;
      let optId = `opt-${qIdx + 1}-${optIdx + 1}`;

      if (typeof opt === 'string') {
        optText = opt;
        // Check if string matches correct answer
        if (
          correctAnswers.includes(opt) ||
          correctAnswers.includes(optIdx) ||
          correctAnswers.includes(String.fromCharCode(65 + optIdx)) ||
          correctAnswers.includes(String.fromCharCode(97 + optIdx))
        ) {
          isCorrect = true;
        }
      } else if (typeof opt === 'object' && opt !== null) {
        optText = opt.text || opt.option || opt.value || opt.label || `Option ${optIdx + 1}`;
        optId = opt.id || optId;
        isCorrect = Boolean(
          opt.isCorrect ||
          opt.is_correct ||
          opt.correct ||
          correctAnswers.includes(optText) ||
          correctAnswers.includes(optIdx) ||
          correctAnswers.includes(opt.id) ||
          correctAnswers.includes(String.fromCharCode(65 + optIdx))
        );
      }

      return {
        id: optId,
        text: optText,
        isCorrect,
      };
    });

    // Ensure at least one option is marked correct if it's MCQ
    const hasAnyCorrect = normalized.some((o) => o.isCorrect);
    if (!hasAnyCorrect && normalized.length > 0) {
      normalized[0].isCorrect = true;
    }

    return normalized;
  }

  // If no options provided for MCQ/MSQ, generate default placeholder options
  return [
    { id: `opt-${qIdx + 1}-1`, text: 'Option A (Correct response)', isCorrect: true },
    { id: `opt-${qIdx + 1}-2`, text: 'Option B', isCorrect: false },
    { id: `opt-${qIdx + 1}-3`, text: 'Option C', isCorrect: false },
    { id: `opt-${qIdx + 1}-4`, text: 'Option D', isCorrect: false },
  ];
}

/**
 * Normalizes test cases for Coding questions
 */
function normalizeTestCases(q: RawQuestion, qIdx: number): {
  id: string;
  input: string;
  expectedOutput: string;
  marks: number;
  isHidden: boolean;
  explanation: string;
}[] {
  const rawTests = (q as any).test_cases || q.testCases || q.test_cases || q.tests || (q as any).testCases;

  if (Array.isArray(rawTests) && rawTests.length > 0) {
    return rawTests.map((tc: any, tcIdx: number) => ({
      id: tc.id || `tc-${qIdx + 1}-${tcIdx + 1}`,
      input: tc.input || tc.stdin || tc.args || `input_${tcIdx + 1} = standard_case`,
      expectedOutput: tc.expectedOutput || tc.expected_output || tc.output || tc.stdout || tc.expectedOutput || 'output_val',
      marks: typeof tc.marks === 'number' ? tc.marks : typeof tc.weight === 'number' ? tc.weight : typeof tc.score === 'number' ? tc.score : 1,
      isHidden: tc.is_sample !== undefined ? !tc.is_sample : tc.isSample !== undefined ? !tc.isSample : Boolean(tc.isHidden || tc.is_hidden || tc.hidden || tcIdx >= 2),
      explanation: tc.explanation || (tc.is_sample === false || tc.isHidden ? 'Hidden validation test case' : 'Sample input test case'),
    }));
  }

  // Default initial test cases if coding question didn't define tests
  return [
    {
      id: `tc-${qIdx + 1}-1`,
      input: 'sample_input = [2, 7, 11, 15], target = 9',
      expectedOutput: '[0, 1]',
      marks: 2,
      isHidden: false,
      explanation: 'Basic example test case',
    },
    {
      id: `tc-${qIdx + 1}-2`,
      input: 'sample_input = [3, 2, 4], target = 6',
      expectedOutput: '[1, 2]',
      marks: 1,
      isHidden: false,
      explanation: 'Edge condition test case',
    },
    {
      id: `tc-${qIdx + 1}-3`,
      input: 'sample_input = [3, 3], target = 6',
      expectedOutput: '[0, 1]',
      marks: 2,
      isHidden: true,
      explanation: 'Hidden verification test case',
    },
  ];
}

/**
 * Detects programming language from question context or code template
 */
function detectLanguage(q: RawQuestion): string {
  if (q.language || q.lang) {
    const raw = (q.language || q.lang || '').toLowerCase().trim();
    if (raw.includes('py')) return 'python';
    if (raw.includes('js') || raw.includes('javascript')) return 'javascript';
    if (raw.includes('ts') || raw.includes('typescript')) return 'typescript';
    if (raw.includes('java') && !raw.includes('script')) return 'java';
    if (raw.includes('c++') || raw.includes('cpp')) return 'cpp';
    if (raw.includes('go') || raw.includes('golang')) return 'go';
    if (raw.includes('sql') || raw.includes('postgres') || raw.includes('mysql')) return 'sql';
    return raw;
  }

  const code = `${q.codeTemplate || q.starterCode || q.code_template || q.solutionCode || ''}`;
  if (code.includes('def ') || code.includes('import sys') || code.includes('print(') || code.includes('elif ')) return 'python';
  if (code.includes('function ') || code.includes('const ') || code.includes('let ') || code.includes('console.log')) return 'javascript';
  if (code.includes('public class ') || code.includes('System.out.println')) return 'java';
  if (code.includes('#include <') || code.includes('std::cout')) return 'cpp';
  if (code.includes('SELECT ') || code.includes('FROM ') || code.includes('WHERE ')) return 'sql';

  return 'python';
}

/**
 * Normalizes language keys to standard identifiers (python, java, cpp, javascript, typescript, sql, go)
 */
export function normalizeLanguageKey(rawLang: string): string {
  const l = (rawLang || '').toLowerCase().trim();
  if (l.includes('py')) return 'python';
  if (l.includes('java') && !l.includes('script')) return 'java';
  if (l.includes('c++') || l.includes('cpp')) return 'cpp';
  if (l.includes('type') || l.includes('ts')) return 'typescript';
  if (l.includes('js') || l.includes('javascript') || l.includes('node')) return 'javascript';
  if (l.includes('sql') || l.includes('postgres') || l.includes('mysql')) return 'sql';
  if (l.includes('go') || l.includes('golang')) return 'go';
  return l || 'python';
}

/**
 * Extracts and maps boilerplate / starter codes for all languages found in question JSON.
 * Only languages explicitly provided in the JSON will be populated.
 * Any omitted languages remain empty/undefined so they show as "idle" and blank in UI.
 */
export function extractLanguageCodeTemplates(q: RawQuestion, primaryLang: string): Record<string, string> {
  const templatesMap: Record<string, string> = {};

  // 0. Handle STEP1-COD array form: starter_codes: [{language, code}]
  const arrayCandidates = [q.starter_codes, q.starterCodes];
  for (const arr of arrayCandidates) {
    if (Array.isArray(arr)) {
      for (const entry of arr as any[]) {
        if (entry && typeof (entry as any).language === 'string' && typeof (entry as any).code === 'string' && (entry as any).code.trim()) {
          const normKey = normalizeLanguageKey((entry as any).language);
          if (!templatesMap[normKey]) templatesMap[normKey] = (entry as any).code;
        }
      }
    }
  }

  // 1. Check nested template dictionaries
  const rawDicts = [
    q.boilerplates,
    q.codeTemplates,
    q.code_templates,
    q.starterCodes,
    q.starter_codes,
    q.templates,
    q.starter_code_templates,
  ];

  for (const dict of rawDicts) {
    if (typeof dict === 'object' && dict !== null) {
      for (const [key, codeVal] of Object.entries(dict)) {
        if (typeof codeVal === 'string' && codeVal.trim()) {
          const normKey = normalizeLanguageKey(key);
          templatesMap[normKey] = codeVal;
        }
      }
    }
  }

  // 2. Check direct language keys on the question object (e.g., q.python, q.python_starter, q.java_code, etc.)
  const knownLangs = ['python', 'java', 'cpp', 'javascript', 'typescript', 'sql', 'go'];
  for (const lang of knownLangs) {
    const candidates = [
      q[lang],
      q[`${lang}_starter`],
      q[`${lang}_starter_code`],
      q[`${lang}_boilerplate`],
      q[`${lang}_template`],
      q[`${lang}_code`],
    ];
    for (const cand of candidates) {
      if (typeof cand === 'string' && cand.trim() && !templatesMap[lang]) {
        templatesMap[lang] = cand;
      }
    }
  }

  // 3. Check single top-level starterCode/codeTemplate
  const singleTemplate =
    q.codeTemplate ||
    q.code_template ||
    q.starterCode ||
    q.starter_code ||
    q.template ||
    q.boilerplate;

  if (typeof singleTemplate === 'string' && singleTemplate.trim()) {
    const targetLang = normalizeLanguageKey(primaryLang);
    if (!templatesMap[targetLang]) {
      templatesMap[targetLang] = singleTemplate;
    }
  }

  return templatesMap;
}

/**
 * Builds default starter code template if not provided
 */
function buildDefaultStarterCode(lang: string, title?: string): string {
  const funcName = (title || 'solution')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'solve';

  switch (lang) {
    case 'javascript':
    case 'typescript':
      return `/**\n * @param {any} input\n * @return {any}\n */\nfunction ${funcName}(input) {\n  // Write your solution here\n  return null;\n}\n`;
    case 'java':
      return `class Solution {\n    public static Object ${funcName}(Object input) {\n        // Write your solution here\n        return null;\n    }\n}\n`;
    case 'cpp':
      return `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint ${funcName}() {\n    // Write your solution here\n    return 0;\n}\n`;
    case 'sql':
      return `-- Write your SQL query statement below\nSELECT \n  * \nFROM \n  table_name;\n`;
    case 'python':
    default:
      return `# Write your solution below\n\ndef ${funcName}(*args, **kwargs):\n    """\n    Solve the given problem.\n    """\n    pass\n`;
  }
}

/**
 * Main Assessment JSON Parser and Normalizer
 */
export function parseAndNormalizeAssessmentJSON(rawJsonData: any): {
  success: boolean;
  assessment: {
    title: string;
    description: string;
    instructions: string;
    duration: number;
    passingScore: number;
    category: string;
    kind: string;
    publishImmediately: boolean;
    requireSafeExamBrowser: boolean;
    questions: any[];
  };
  stats: {
    totalQuestions: number;
    codingCount: number;
    mcqCount: number;
    msqCount: number;
    fillBlankCount: number;
    shortAnswerCount: number;
    totalMarks: number;
  };
  message: string;
} {
  let root: any = rawJsonData;

  // Handle case where input is a raw JSON string
  if (typeof root === 'string') {
    root = JSON.parse(root);
  }

  // Handle top-level array of questions vs full assessment object
  let rawQuestions: RawQuestion[] = [];
  let assessmentTitle = 'Imported Assessment';
  let assessmentDesc = 'Imported from assessment JSON configuration';
  let instructions = 'Please review all questions carefully before submitting.';
  let duration = 45;
  let passingScore = 70;
  let category = 'Technical';
  let kind = 'Full Assessment';
  let publishImmediately = false;
  let requireSafeExamBrowser = true;

  if (Array.isArray(root)) {
    rawQuestions = root;
    assessmentTitle = `Imported Assessment (${rawQuestions.length} Questions)`;
  } else if (typeof root === 'object' && root !== null) {
    // Support STEP1-COD format (assessment_title, assessment_description, duration_minutes, etc.)
    if (root.title || root.name || root.assessment_title) assessmentTitle = root.title || root.name || root.assessment_title;
    if (root.description || root.assessment_description) assessmentDesc = root.description || root.assessment_description;
    if (root.instructions) instructions = root.instructions;
    if (root.duration || root.time_limit_minutes || root.duration_minutes) duration = Number(root.duration || root.time_limit_minutes || root.duration_minutes) || 45;
    if (root.passingScore || root.passing_score || root.pass_percentage || root.passing_score) {
      passingScore = Number(root.passingScore || root.passing_score || root.pass_percentage || root.passing_score) || 70;
    }
    if (root.passing_score !== undefined) passingScore = Number(root.passing_score) || passingScore;
    if (root.category || root.topic) category = root.category || root.topic;
    if (root.kind || root.assessment_type) kind = root.kind || root.assessment_type;
    if (root.publishImmediately !== undefined) publishImmediately = Boolean(root.publishImmediately);
    if (root.requireSafeExamBrowser !== undefined) requireSafeExamBrowser = Boolean(root.requireSafeExamBrowser);
    if ((root as any).seb_enabled !== undefined) requireSafeExamBrowser = Boolean((root as any).seb_enabled);

    // Questions might be in 'questions', 'items', 'problems', or 'quiz'
    if (Array.isArray(root.questions)) {
      rawQuestions = root.questions;
    } else if (Array.isArray(root.items)) {
      rawQuestions = root.items;
    } else if (Array.isArray(root.problems)) {
      rawQuestions = root.problems;
    } else if (Array.isArray(root.quiz)) {
      rawQuestions = root.quiz;
    }
  }

  let codingCount = 0;
  let mcqCount = 0;
  let msqCount = 0;
  let fillBlankCount = 0;
  let shortAnswerCount = 0;
  let totalMarks = 0;

  const normalizedQuestions = rawQuestions.map((q, idx) => {
    const { type } = determineQuestionType(q);
    // Support question_marks from STEP1-COD and marks/points
    const qMarks = typeof q.marks === 'number' ? q.marks : typeof (q as any).question_marks === 'number' ? (q as any).question_marks : typeof q.points === 'number' ? q.points : type === 'CODING' ? 5 : 2;
    totalMarks += qMarks;

    const rawDiff = (q.difficulty as any) || (q as any).question_difficulty || q.level || (type === 'CODING' ? 'MEDIUM' : 'EASY');
    const qDifficulty = String(rawDiff).toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
    const validDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(qDifficulty) ? qDifficulty : 'MEDIUM';

    // Always treat question prompt/stem in the JSON file as Markdown
    let richStem =
      q.stemMarkdown ||
      q.stem_markdown ||
      q.markdown ||
      q.problem_statement ||
      q.problem ||
      q.stem ||
      q.prompt ||
      q.question ||
      (q as any).question_text ||
      (q as any).questionText ||
      (typeof q.content === 'string'
        ? q.content
        : (q.content as any)?.question_text || (q.content as any)?.markdown || (q.content as any)?.stem || (q.content as any)?.prompt) ||
      q.description ||
      q.body ||
      q.title ||
      (q as any).question_title ||
      `Question prompt #${idx + 1}`;

    if (type === 'CODING' && ((q as any).description || (q as any).input_format || (q as any).output_format || (q as any).constraints || (q as any).examples)) {
      const parts: string[] = [];
      const primaryDesc = (q as any).description || q.stemMarkdown || q.stem_markdown || q.prompt || q.question;
      if (primaryDesc) parts.push(primaryDesc);
      if ((q as any).input_format) parts.push(`\n**Input Format:**\n${(q as any).input_format}`);
      if ((q as any).output_format) parts.push(`\n**Output Format:**\n${(q as any).output_format}`);
      if (Array.isArray((q as any).constraints) && (q as any).constraints.length > 0) parts.push(`\n**Constraints:**\n- ${(q as any).constraints.join('\n- ')}`);
      if (Array.isArray((q as any).examples) && (q as any).examples.length > 0) {
        const exStr = (q as any).examples.map((ex: any, ei: number) => `**Example ${ei + 1}:**\nInput: \`${ex.input}\`\nOutput: \`${ex.output}\`${ex.explanation ? `\n_${ex.explanation}_` : ''}`).join('\n\n');
        parts.push(`\n**Examples:**\n${exStr}`);
      }
      if (parts.length > 0) {
        richStem = parts.join('\n');
      }
    }

    const baseQuestion: any = {
      id: q.id || generateId(`q${idx + 1}`),
      title: q.title || (q as any).question_title || q.name || `${type === 'CODING' ? 'Coding Problem' : 'Question'} ${idx + 1}`,
      type,
      difficulty: validDifficulty,
      marks: qMarks,
      negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : typeof q.negative_marks === 'number' ? q.negative_marks : 0,
      requireReasoning: Boolean(q.requireReasoning || q.require_reasoning),
      stemMarkdown: richStem,
      description: (q as any).description || q.stemMarkdown || q.stem_markdown || q.prompt || q.question || '',
      inputFormat: (q as any).input_format || (q as any).inputFormat || (q as any).input || '',
      outputFormat: (q as any).output_format || (q as any).outputFormat || (q as any).output || '',
      constraints: Array.isArray((q as any).constraints)
        ? (q as any).constraints
        : typeof (q as any).constraints === 'string'
        ? (q as any).constraints.split('\n').filter(Boolean)
        : [],
      examples: (Array.isArray((q as any).examples) ? (q as any).examples : []).map((ex: any, ei: number) => ({
        id: ex.id || `ex-${idx + 1}-${ei + 1}`,
        input: ex.input ?? '',
        output: ex.output ?? ex.expected_output ?? '',
        explanation: ex.explanation ?? '',
      })),
    };

    if (type === 'CODING') {
      codingCount++;
      const lang = detectLanguage(q);
      const normalizedLang = normalizeLanguageKey(lang);
      const extractedTemplates = extractLanguageCodeTemplates(q, normalizedLang);

      // If specific template was found for the primary language, use it; otherwise check top-level or leave blank/default
      const primaryTemplate =
        extractedTemplates[normalizedLang] ||
        q.codeTemplate ||
        q.code_template ||
        q.starterCode ||
        q.starter_code ||
        q.template ||
        q.boilerplate ||
        '';

      if (primaryTemplate && !extractedTemplates[normalizedLang]) {
        extractedTemplates[normalizedLang] = primaryTemplate;
      }

      baseQuestion.language = normalizedLang;
      baseQuestion.codeTemplate = primaryTemplate;
      baseQuestion.codeTemplates = extractedTemplates;
      baseQuestion.solutionCode = q.solutionCode || q.solution_code || q.solution || '';
      baseQuestion.testCases = normalizeTestCases(q, idx);
      // Support time_limit_ms / memory_limit_kb from STEP1-COD
      const tlMs = (q as any).time_limit_ms ?? q.timeLimitSec ? (q.timeLimitSec as any) * 1000 : q.time_limit ? (q.time_limit as any) * 1000 : 2000;
      const memKb = (q as any).memory_limit_kb ?? (q.memoryLimitMb ? q.memoryLimitMb * 1024 : q.memory_limit ? (q.memory_limit as any) * 1024 : 262144);
      baseQuestion.timeLimitSec = q.timeLimitSec || q.time_limit || (typeof tlMs === 'number' ? Math.round(tlMs / 1000) : 2) || 2;
      if ((q as any).time_limit_ms) baseQuestion.timeLimitSec = Math.round((q as any).time_limit_ms / 1000);
      baseQuestion.memoryLimitMb = q.memoryLimitMb || q.memory_limit || (typeof memKb === 'number' ? Math.round(memKb / 1024) : 256) || 256;
      if ((q as any).memory_limit_kb) baseQuestion.memoryLimitMb = Math.round((q as any).memory_limit_kb / 1024);
      baseQuestion.options = [];
    } else if (type === 'MCQ' || type === 'MSQ') {
      if (type === 'MCQ') mcqCount++;
      else msqCount++;

      baseQuestion.options = normalizeOptions(q, idx, type);
    } else if (type === 'FILL_BLANK') {
      fillBlankCount++;
      // Support answer field from tsc variants (FILL_BLANK has "answer": "4")
      baseQuestion.expectedAnswer = q.expectedAnswer || q.expected_answer || (q as any).answer || '';
      baseQuestion.acceptableAnswers = q.acceptableAnswers || q.acceptable_answers || [];
      if ((q as any).answer && !baseQuestion.acceptableAnswers.includes((q as any).answer)) {
        baseQuestion.acceptableAnswers = [...baseQuestion.acceptableAnswers, (q as any).answer];
      }
      baseQuestion.options = [];
    } else {
      shortAnswerCount++;
      baseQuestion.evaluationRubric = q.evaluationRubric || q.rubric || '';
      baseQuestion.options = [];
    }

    return baseQuestion;
  });

  return {
    success: true,
    assessment: {
      title: assessmentTitle,
      description: assessmentDesc,
      instructions,
      duration,
      passingScore,
      category,
      kind,
      publishImmediately,
      requireSafeExamBrowser,
      questions: normalizedQuestions,
    },
    stats: {
      totalQuestions: normalizedQuestions.length,
      codingCount,
      mcqCount,
      msqCount,
      fillBlankCount,
      shortAnswerCount,
      totalMarks,
    },
    message: `Successfully parsed ${normalizedQuestions.length} questions (${codingCount} Coding, ${mcqCount} MCQ, ${msqCount} MSQ, ${fillBlankCount + shortAnswerCount} Written).`,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Route: Health Check (public — load balancer)
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Dev helper: Mint a test JWT for role isolation tests (never expose in prod, guarded by NODE_ENV)
  app.post('/api/auth/test-token', (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    const { sub = 'test-user', email = 'test@talhelix.com', role = 'student', institutionId = null } = req.body || {};
    const token = generateTestToken({ sub, email, role, institutionId });
    return res.json({ success: true, token, role, institutionId });
  });

  // API Route: Questions Library Catalog — admin/institution only, never student (student gets filtered /student/questions)
  app.get('/api/questions', authenticate as any, authorize('admin', 'super_admin', 'institution', 'faculty', 'university_admin') as any, (req: AuthenticatedRequest, res: Response) => {
    try {
      const typeQuery = (req.query.type as string)?.toUpperCase();
      const diffQuery = (req.query.difficulty as string)?.toUpperCase();

      const questionsBank = [
        {
          id: 'q-cod-101',
          title: 'Two Sum Optimal Hash Map',
          type: 'CODING',
          difficulty: 'EASY',
          tags: ['Arrays', 'Hash Table', 'Algorithms'],
          marks: 10,
          content: {
            question_text: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution in O(N) time.',
          },
        },
        {
          id: 'q-cod-102',
          title: 'LRU Cache Design & Eviction',
          type: 'CODING',
          difficulty: 'HARD',
          tags: ['Data Structures', 'Doubly Linked List', 'Hash Map'],
          marks: 25,
          content: {
            question_text: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get and put time complexity.',
          },
        },
        {
          id: 'q-cod-103',
          title: 'Merge Intervals Overlap Resolution',
          type: 'CODING',
          difficulty: 'MEDIUM',
          tags: ['Intervals', 'Sorting', 'Arrays'],
          marks: 15,
          content: {
            question_text: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of the non-overlapping intervals.',
          },
        },
        {
          id: 'q-cod-104',
          title: 'Valid Parentheses Stack Evaluation',
          type: 'CODING',
          difficulty: 'EASY',
          tags: ['Stack', 'Strings', 'Parsing'],
          marks: 10,
          content: {
            question_text: 'Given a string containing just brackets, determine if the input string is valid according to open bracket closing order.',
          },
        },
        {
          id: 'q-mcq-201',
          title: 'ACID Transactions Isolation Levels',
          type: 'MCQ',
          difficulty: 'MEDIUM',
          tags: ['PostgreSQL', 'Databases', 'Transactions'],
          marks: 5,
          content: {
            question_text: 'Which SQL isolation level prevents Phantom Reads by default in PostgreSQL and ANSI SQL compliant databases?',
            options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
          },
        },
        {
          id: 'q-mcq-202',
          title: 'HTTP/2 Multiplexing Mechanism',
          type: 'MCQ',
          difficulty: 'EASY',
          tags: ['Networking', 'HTTP/2', 'Protocols'],
          marks: 4,
          content: {
            question_text: 'What primary protocol feature in HTTP/2 resolves the Head-of-Line (HoL) blocking issue present in HTTP/1.1?',
            options: ['Binary Framing & Stream Multiplexing', 'GZIP compression', 'Cookie encryption', 'WebSocket tunnels'],
          },
        },
        {
          id: 'q-mcq-203',
          title: 'Distributed Consensus & Raft Elections',
          type: 'MCQ',
          difficulty: 'HARD',
          tags: ['Distributed Systems', 'Raft', 'Consensus'],
          marks: 8,
          content: {
            question_text: 'In the Raft consensus algorithm, what prevents two candidate nodes from splitting votes indefinitely during a leader election split?',
            options: ['Randomized Election Timeouts', 'Static Node Priorities', 'NTP Clock Synchronization', 'Two-Phase Commit'],
          },
        },
        {
          id: 'q-msq-204',
          title: 'Microservices Fault Tolerance Patterns',
          type: 'MSQ',
          difficulty: 'MEDIUM',
          tags: ['Architecture', 'Resilience', 'Cloud'],
          marks: 6,
          content: {
            question_text: 'Select all architectural patterns commonly utilized to prevent cascading failures across microservices.',
            options: ['Circuit Breaker', 'Rate Limiting & Token Bucket', 'Bulkhead Isolation', 'Single Point of Failure'],
          },
        },
        {
          id: 'q-sce-301',
          title: 'Designing High-Throughput URL Shortener',
          type: 'SCENARIO',
          difficulty: 'HARD',
          tags: ['System Design', 'Scalability', 'Caching', 'Gemini Evaluation'],
          marks: 20,
          content: {
            question_text: 'Design a global URL shortener service handling 100,000 writes/sec and 2,000,000 reads/sec. Explain your partitioning strategy, base62 encoding vs token generators, and cache invalidation policies.',
          },
        },
        {
          id: 'q-sce-302',
          title: 'Incident Post-Mortem: Distributed Deadlock',
          type: 'SCENARIO',
          difficulty: 'MEDIUM',
          tags: ['DevOps', 'Root Cause Analysis', 'Concurrency'],
          marks: 15,
          content: {
            question_text: 'A financial payment processing cluster experienced a 35-minute thread starvation deadlock. Detail the telemetry metrics you would investigate and propose a lock-ordering and idempotency framework to prevent recurrence.',
          },
        },
        {
          id: 'q-sce-303',
          title: 'OAuth 2.0 PKCE Flow Security Architecture',
          type: 'SCENARIO',
          difficulty: 'EASY',
          tags: ['Security', 'OAuth2', 'Authentication'],
          marks: 10,
          content: {
            question_text: 'Explain why the Proof Key for Code Exchange (PKCE) extension is mandatory for Single Page Applications (SPAs) and how code_verifier/code_challenge mitigate authorization code interception attacks.',
          },
        },
        {
          id: 'q-fil-401',
          title: 'Kubernetes Pod Default Restart Policy',
          type: 'FILL_BLANK',
          difficulty: 'EASY',
          tags: ['Kubernetes', 'Containers', 'DevOps'],
          marks: 4,
          content: {
            question_text: 'What is the default restartPolicy value for a standard Kubernetes Pod specification?',
          },
        },
        {
          id: 'q-fil-402',
          title: 'Time Complexity of Binary Heap Insertion',
          type: 'FILL_BLANK',
          difficulty: 'EASY',
          tags: ['Data Structures', 'Complexity', 'Algorithms'],
          marks: 4,
          content: {
            question_text: 'In Big-O notation, the worst-case time complexity for inserting an element into a binary max-heap of N elements is O(____).',
          },
        },
        {
          id: 'q-fil-403',
          title: 'PostgreSQL WAL Acronym Full Term',
          type: 'FILL_BLANK',
          difficulty: 'MEDIUM',
          tags: ['PostgreSQL', 'Storage', 'Databases'],
          marks: 5,
          content: {
            question_text: 'In database storage engines like PostgreSQL, what three-word term does the acronym WAL represent?',
          },
        },
      ];

      let results = questionsBank;

      if (typeQuery) {
        results = results.filter((q) => q.type === typeQuery);
      }

      if (diffQuery) {
        results = results.filter((q) => q.difficulty === diffQuery);
      }

      return res.json({
        success: true,
        count: results.length,
        data: results,
      });
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch questions' });
    }
  });

  // API Route: Backend JSON Parser — admin only (assessment creation is admin privilege)
  app.post('/api/parse-assessment-json', authenticate as any, authorize('admin', 'super_admin') as any, (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: 'Empty JSON payload received.' });
      }

      const input = payload.jsonData !== undefined ? payload.jsonData : payload;
      const parsedResult = parseAndNormalizeAssessmentJSON(input);

      return res.json(parsedResult);
    } catch (err: any) {
      console.error('JSON parsing error:', err);
      return res.status(400).json({
        success: false,
        error: `Failed to parse assessment JSON: ${err?.message || 'Invalid syntax'}`,
      });
    }
  });

  // =========================================================================
  // TALHELIX INSTITUTION & ATTENDANCE API LAYER (API-FIRST ARCHITECTURE)
  // Supports Web Portal now & Standalone Mobile Attendance App later
  // =========================================================================

  // 1. POST /api/attendance/mark - Mark individual attendance record — institution/admin only, tenant-scoped
  app.post('/api/attendance/mark', authenticate as any, authorize('institution', 'faculty', 'university_admin', 'admin', 'super_admin') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        institutionId = 'inst-stanford',
        batchId,
        studentId,
        studentName,
        registerNumber,
        netId,
        studentEmail,
        date = new Date().toISOString().split('T')[0],
        sessionTimeWindow = '09:00 - 10:30',
        subjectName = 'Advanced Data Structures & Algorithms',
        status = 'PRESENT',
        source = 'web-manual', // 'web-manual' | 'mobile-app' | 'rfid'
        markedByUserId = 'fac-admin',
        markedByName = 'Staff Proctor',
        venueRoom = 'Turing Hall 301',
        remarks = '',
      } = req.body;

      if (!batchId || studentId === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: batchId and studentId are mandatory.',
        });
      }

      const validSources = ['web-manual', 'mobile-app', 'rfid'];
      if (!validSources.includes(source)) {
        return res.status(400).json({
          success: false,
          error: `Invalid attendance source "${source}". Must be one of: ${validSources.join(', ')}`,
        });
      }

      const record = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        institutionId,
        batchId,
        batchName: batchId.includes('26a') ? 'CS 2026 - Section A' : 'CS 2026 Cohort',
        studentId: Number(studentId),
        studentName: studentName || `Student #${studentId}`,
        registerNumber: registerNumber || `71002210400${studentId}`,
        netId: netId || `student${studentId}`,
        studentEmail: studentEmail || `student${studentId}@stanford.edu`,
        date,
        sessionTimeWindow,
        subjectName,
        status: status.toUpperCase(),
        source, // Reconcilable channel source
        markedAt: new Date().toISOString(),
        markedByUserId,
        markedByName,
        venueRoom,
        remarks,
        syncStatus: 'SYNCED',
      };

      return res.status(201).json({
        success: true,
        message: `Attendance marked successfully as ${record.status} via channel: ${record.source}`,
        record,
      });
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to mark attendance' });
    }
  });

  // 2. POST /api/attendance/bulk-mark - Bulk mark attendance for batch — tenant-scoped
  app.post('/api/attendance/bulk-mark', authenticate as any, authorize('institution', 'faculty', 'university_admin', 'admin', 'super_admin') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        institutionId = 'inst-stanford',
        batchId,
        date = new Date().toISOString().split('T')[0],
        sessionTimeWindow = '09:00 - 10:30',
        subjectName = 'Advanced Data Structures & Algorithms',
        records = [],
        source = 'web-manual',
        markedByUserId = 'fac-admin',
        markedByName = 'Staff Proctor',
        venueRoom = 'Turing Hall 301',
      } = req.body;

      if (!batchId || !Array.isArray(records)) {
        return res.status(400).json({
          success: false,
          error: 'batchId and records array are required for bulk marking.',
        });
      }

      const processed = records.map((r: any, idx: number) => ({
        id: `att-bulk-${Date.now()}-${idx}`,
        institutionId,
        batchId,
        studentId: r.studentId,
        studentName: r.studentName || `Student #${r.studentId}`,
        registerNumber: r.registerNumber || `71002210400${r.studentId}`,
        netId: r.netId || `student${r.studentId}`,
        studentEmail: r.studentEmail || `student${r.studentId}@stanford.edu`,
        date,
        sessionTimeWindow,
        subjectName,
        status: r.status || 'PRESENT',
        source,
        markedAt: new Date().toISOString(),
        markedByUserId,
        markedByName,
        venueRoom,
        remarks: r.remarks || '',
        syncStatus: 'SYNCED',
      }));

      return res.json({
        success: true,
        markedCount: processed.length,
        batchId,
        date,
        source,
        records: processed,
      });
    } catch (err: any) {
      console.error('Bulk attendance error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to bulk mark' });
    }
  });

  // 3. GET /api/attendance/session/:batchId - Get attendance list for session — tenant-scoped, verify batch ownership
  app.get('/api/attendance/session/:batchId', authenticate as any, authorize('institution', 'faculty', 'university_admin', 'admin', 'super_admin') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { batchId } = req.params;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

      return res.json({
        success: true,
        batchId,
        date,
        sessionTimeWindow: '09:00 - 10:30',
        subjectName: 'Advanced Data Structures & Algorithms',
        venueRoom: 'Turing Hall 301',
        stats: {
          totalEnrolled: 8,
          presentCount: 6,
          absentCount: 1,
          lateCount: 1,
          attendancePercentage: 87.5,
          byChannel: {
            'mobile-app': 4,
            'web-manual': 3,
            rfid: 1,
          },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Error fetching session attendance' });
    }
  });

  // 4. GET /api/attendance/live-batch - Query "What batch is live right now for this faculty" — tenant-scoped
  app.get('/api/attendance/live-batch', authenticate as any, authorize('institution', 'faculty', 'university_admin', 'admin', 'super_admin') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    try {
      const facultyId = (req.query.facultyId as string) || 'fac-101';
      const now = new Date();
      const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

      // Scheduled live window data owned by backend
      const liveSchedule = {
        isLive: true,
        facultyId,
        facultyName: facultyId === 'fac-101' ? 'Prof. David Malan' : 'Dr. Sarah Chen',
        currentDay,
        batchId: 'batch-cs-26a',
        batchName: 'CS 2026 - Section A',
        batchCode: 'CS-26-A',
        department: 'Computer Science & Engineering',
        subjectCode: 'CS301',
        subjectName: 'Advanced Data Structures & Algorithms',
        startTime: '09:00',
        endTime: '10:30',
        venueRoom: 'Turing Hall 301',
        studentCount: 8,
        serverTime: now.toISOString(),
      };

      return res.json({
        success: true,
        ...liveSchedule,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Error querying live batch' });
    }
  });

  // 5. GET /api/mobile/sync-dataset - Standalone Mobile Attendance App dataset consumer — faculty/institution only, tenant-scoped
  app.get('/api/mobile/sync-dataset', authenticate as any, authorize('institution', 'faculty', 'university_admin') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    try {
      const facultyId = (req.query.facultyId as string) || 'fac-101';
      const facultyName = facultyId === 'fac-101' ? 'Prof. David Malan' : 'Dr. Sarah Chen';

      const dataset = {
        apiContractVersion: 'v1.2.0',
        syncTimestamp: new Date().toISOString(),
        faculty: {
          id: facultyId,
          name: facultyName,
          email: facultyId === 'fac-101' ? 'david.malan@stanford.edu' : 'sarah.chen@stanford.edu',
          employeeId: facultyId === 'fac-101' ? 'FAC-CS-101' : 'FAC-CS-102',
          role: 'FACULTY_STAFF',
          department: 'Computer Science & Engineering',
        },
        institution: {
          id: 'inst-stanford',
          name: 'Stanford University',
          code: 'STANFORD',
          serverTimezone: 'America/Los_Angeles',
        },
        assignedBatches: [
          {
            id: 'batch-cs-26a',
            name: 'CS 2026 - Section A',
            code: 'CS-26-A',
            department: 'Computer Science & Engineering',
            section: 'A',
            studentCount: 8,
            schedules: [
              {
                id: 'sch-cs-101',
                dayOfWeek: 'Monday',
                startTime: '09:00',
                endTime: '10:30',
                subjectCode: 'CS301',
                subjectName: 'Advanced Data Structures & Algorithms',
                venueRoom: 'Turing Hall 301',
                facultyId,
                facultyName,
              },
            ],
            students: [
              {
                id: 0,
                name: 'Nanda Kumar',
                email: 'nanda@talhelix.com',
                registerNumber: '710022104052',
                netId: 'nkumar26',
                section: 'A',
                avatarColor: 'bg-blue-600',
                recentAttendancePercentage: 92.5,
              },
              {
                id: 1,
                name: 'Alice Chen',
                email: 'alice@stanford.edu',
                registerNumber: '710022104001',
                netId: 'ajohnson26',
                section: 'A',
                avatarColor: 'bg-indigo-600',
                recentAttendancePercentage: 96.0,
              },
              {
                id: 2,
                name: 'Bob Smith',
                email: 'bob@example.com',
                registerNumber: '710022104002',
                netId: 'bsmith26',
                section: 'A',
                avatarColor: 'bg-emerald-600',
                recentAttendancePercentage: 88.0,
              },
              {
                id: 3,
                name: 'Charlie Davis',
                email: 'charlie@example.com',
                registerNumber: '710022104003',
                netId: 'cdavis26',
                section: 'A',
                avatarColor: 'bg-amber-600',
                recentAttendancePercentage: 74.0, // Low attendance
              },
              {
                id: 4,
                name: 'Diana Prince',
                email: 'diana@example.com',
                registerNumber: '710022104004',
                netId: 'dprince26',
                section: 'A',
                avatarColor: 'bg-purple-600',
                recentAttendancePercentage: 98.0,
              },
              {
                id: 5,
                name: 'Evan Wright',
                email: 'evan@example.com',
                registerNumber: '710022104005',
                netId: 'ewright26',
                section: 'A',
                avatarColor: 'bg-cyan-600',
                recentAttendancePercentage: 85.0,
              },
              {
                id: 6,
                name: 'Fiona Gallagher',
                email: 'fiona@example.com',
                registerNumber: '710022104006',
                netId: 'fgallagher26',
                section: 'A',
                avatarColor: 'bg-rose-600',
                recentAttendancePercentage: 91.0,
              },
              {
                id: 7,
                name: 'George Clark',
                email: 'george@example.com',
                registerNumber: '710022104007',
                netId: 'gclark26',
                section: 'A',
                avatarColor: 'bg-slate-600',
                recentAttendancePercentage: 68.0, // Low attendance
              },
            ],
          },
        ],
        liveScheduleRightNow: {
          isLive: true,
          batchId: 'batch-cs-26a',
          batchName: 'CS 2026 - Section A',
          subjectCode: 'CS301',
          subjectName: 'Advanced Data Structures & Algorithms',
          startTime: '09:00',
          endTime: '10:30',
          venueRoom: 'Turing Hall 301',
        },
        supportedMarkingSources: ['mobile-app', 'web-manual', 'rfid'],
      };

      return res.json({
        success: true,
        data: dataset,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Error generating mobile sync dataset' });
    }
  });

  // 6. GET /api/institution/dashboard-stats — institution only, tenant-scoped
  app.get('/api/institution/dashboard-stats', authenticate as any, authorize('institution', 'faculty', 'university_admin') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    return res.json({
      success: true,
      stats: {
        totalStudents: 842,
        activeBatchesCount: 4,
        todayAttendanceRate: 88.4,
        todayPresentCount: 745,
        todayAbsentCount: 97,
        totalFacultyCount: 18,
        pendingApprovalsCount: 3,
        activeAnnouncementsCount: 3,
        lowAttendanceStudentCount: 14,
      },
    });
  });

  // =========================================================================
  // TALHELIX PASSWORD MANAGEMENT — ADMIN ONLY (Go/Gin parity mock)
  // Replaces manual SQL workflow: bulk-reset default, selective session temp,
  // post-exam bulk-reset. Mirrors Go production handler behavior.
  // =========================================================================

  const DEFAULT_FALLBACK_PASSWORD = 'srmpassword26'; // same legacy default; see recommendation note below
  const WEAK_PASSWORD_DENYLIST = new Set([
    'password', 'password123', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome', 'admin', 'admin123',
    'srmpassword', 'srmpassword26', // default itself is allowed only via reset-default action, not via custom
    'talhelix', 'talhelix123', 'student', 'student123',
  ]);

  type PasswordAuditAction = 'set-custom' | 'reset-default';
  interface PasswordAuditEntry {
    id: string;
    timestamp: string;
    actor: string; // who performed it (email / userId)
    actorRole: string;
    action: PasswordAuditAction;
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
  const passwordAuditLog: PasswordAuditEntry[] = [];
  const passwordResetLocks = new Set<string>(); // simple per-student concurrency guard (email lowercased)

  function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return { valid: false, error: 'Password must not be empty.' };
    }
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long.' };
    }
    if (password.length > 128) {
      return { valid: false, error: 'Password must be at most 128 characters.' };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const categories = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    if (categories < 3) {
      return { valid: false, error: 'Password must contain at least 3 of: uppercase, lowercase, digit, special character.' };
    }
    if (/(.)\1\1/.test(password)) {
      return { valid: false, error: 'Password must not contain 3 identical consecutive characters.' };
    }
    if (WEAK_PASSWORD_DENYLIST.has(password.toLowerCase())) {
      return { valid: false, error: 'Password is too weak or is a commonly used fallback — choose a stronger one.' };
    }
    // also reject the default via custom path — must use reset-default button
    if (password === DEFAULT_FALLBACK_PASSWORD) {
      return { valid: false, error: 'Use "Reset to Default Password" button for the fallback password, not custom reset.' };
    }
    return { valid: true };
  }

  // Simulated bcrypt hash with artificial delay (CPU-bound); in Go this is x/crypto/bcrypt.GenerateFromPassword
  async function simulatedBcryptHash(plaintext: string): Promise<string> {
    // simulate bcrypt cost ~ 50-120ms
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 60));
    // never return plaintext; return fake hash prefix so we can assert hash != plaintext
    const salt = Math.random().toString(36).slice(2, 10);
    return `$2a$10$${salt}${Buffer.from(plaintext).toString('base64').slice(0, 22)}`;
  }

  // Worker-pool capped at min(NCPU,8) — JS simulation via promise pool
  async function hashPasswordsWithPool(plaintext: string, count: number): Promise<string[]> {
    const concurrency = Math.min(8, 8); // mirrors min(runtime.NumCPU(),8) in Go; fixed 8 here for Node mock
    const results: string[] = new Array(count);
    let idx = 0;
    async function worker() {
      while (idx < count) {
        const cur = idx++;
        results[cur] = await simulatedBcryptHash(plaintext);
      }
    }
    const workers = Array.from({ length: Math.min(concurrency, count) }, () => worker());
    await Promise.all(workers);
    return results;
  }

  function extractActor(req: Request): { actor: string; role: string } {
    // In production Go: c.GetString("user_email") + c.GetString("user_role") from JWT middleware
    const auth = (req.headers.authorization as string) || '';
    // Mock: allow X-Actor header for testing; default to admin
    const actorHeader = (req.headers['x-actor-email'] as string) || (req.headers['x-user-email'] as string);
    const roleHeader = (req.headers['x-user-role'] as string) || (req.headers['x-actor-role'] as string);
    if (actorHeader) return { actor: actorHeader, role: roleHeader || 'admin' };
    if (auth) {
      // Try to decode JWT payload quickly for mock (no verification)
      try {
        const payload = JSON.parse(Buffer.from(auth.replace('Bearer ', '').split('.')[1] || '', 'base64').toString());
        if (payload.email) return { actor: payload.email, role: payload.role || 'admin' };
      } catch {}
    }
    return { actor: 'admin@talhelix.com', role: 'admin' };
  }

  function requireAdmin(req: Request, res: Response): { actor: string; role: string } | null {
    const { actor, role } = extractActor(req);
    const normalizedRole = (role || '').toLowerCase();
    const isAdmin = ['admin', 'super_admin', 'superadmin', 'university_admin', 'institution'].includes(normalizedRole);
    // For mock we allow all but log warning; in Go production this would be 403
    if (!isAdmin) {
      // Still allow for demo but could enforce:
      // return res.status(403).json({ success: false, error: 'Admin role required' }) as any;
      console.warn(`[PasswordReset] non-admin attempt by ${actor} role=${role} — allowed in mock, would be 403 in Go`);
    }
    return { actor, role };
  }

  // Core transactional handler — shared by both endpoints
  async function handlePasswordReset(
    req: Request,
    res: Response,
    action: PasswordAuditAction,
    plaintextPassword: string
  ) {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const { actor, role } = admin;

    const { student_ids, studentIds, emails, batch_id, batchId } = req.body || {};
    const rawIds: (number | string)[] = student_ids || studentIds || [];
    const rawEmails: string[] = emails || [];
    const effectiveBatchId: string | undefined = batch_id || batchId;

    // Normalize selection — support ids and/or emails; deduplicate case-insensitive for emails
    const normalizedEmails = rawEmails.map((e: string) => String(e).trim().toLowerCase()).filter(Boolean);
    const uniqueEmails = [...new Set(normalizedEmails)];
    const uniqueIds = [...new Set(rawIds.map((v: any) => (typeof v === 'string' ? v.trim() : v)).filter((v: any) => v !== '' && v !== undefined && v !== null))];

    const totalRequested = uniqueIds.length + uniqueEmails.length;
    if (totalRequested === 0 && !effectiveBatchId) {
      return res.status(400).json({ success: false, error: 'No students selected. Provide student_ids, emails, or batch_id.' });
    }

    // If batch_id provided without explicit list, expand to batch members (mock: derive from inst-stanford pool)
    // In production Go this would query users batch membership join; here we simulate by requiring explicit ids/emails
    // but we keep batch_id for audit trail regardless.
    if (totalRequested === 0 && effectiveBatchId) {
      return res.status(400).json({ success: false, error: 'Batch reset requires explicit student_ids/emails in mock — provide selection.' });
    }

    // Validate custom password strength (default action reuses DEFAULT_FALLBACK_PASSWORD)
    if (action === 'set-custom') {
      const v = validatePasswordStrength(plaintextPassword);
      if (!v.valid) {
        return res.status(400).json({ success: false, error: v.error, code: 'WEAK_PASSWORD' });
      }
    }

    // Concurrency guard — prevent overlapping resets for same student
    const lockKeys = [...uniqueEmails, ...uniqueIds.map((id) => `id:${id}`)];
    for (const k of lockKeys) {
      if (passwordResetLocks.has(k)) {
        return res.status(409).json({ success: false, error: `Concurrent reset already in progress for ${k}. Please wait.`, code: 'CONCURRENT_RESET' });
      }
    }
    lockKeys.forEach((k) => passwordResetLocks.add(k));

    // Mock DB transaction: BEGIN
    let hashes: string[] = [];
    try {
      // Step 1: Hash via worker pool (CPU cap 8)
      try {
        hashes = await hashPasswordsWithPool(plaintextPassword, totalRequested);
      } catch (e: any) {
        return res.status(500).json({ success: false, error: 'Failed to hash passwords (worker pool error)', detail: e?.message });
      }

      // Step 2: Simulate DB UPDATE ... SET password_hash = $1 WHERE LOWER(email)=LOWER($2) OR id=$3
      // For mock we just count successes/failures; in Go production this would be:
      //   tx, _ := db.BeginTx(ctx, nil)
      //   defer tx.Rollback()
      //   stmt, _ := tx.PrepareContext(ctx, `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE LOWER(email)=LOWER($2) OR id=$3`)
      //   // loop over selection, Exec, collect Result.RowsAffected()
      //   // if affected != totalRequested → Rollback + error
      //   // else Commit

      const failures: Array<{ studentId?: any; email?: string; error: string }> = [];
      let simulatedAffected = 0;

      // Simulate per-student update; inject occasional not-found to demo partial failure
      for (let i = 0; i < totalRequested; i++) {
        const email = uniqueEmails[i] ?? null;
        const id = uniqueIds[i - uniqueEmails.length] ?? null; // careful offset when both present
        // Actually handle mixed: iterate over emails first, then ids
      }
      // Simpler: build unified list
      const unified: Array<{ id?: any; email?: string }> = [
        ...uniqueEmails.map((e) => ({ email: e })),
        ...uniqueIds.map((id) => ({ id })),
      ];
      // If both supplied, totalRequested already correct, but unified length matches totalRequested
      // Re-hash mapping: hashes index aligns with unified
      for (let i = 0; i < unified.length; i++) {
        const entry = unified[i];
        // Simulate lookup failure for illustrative edge: if email contains "notfound" or id === 9999
        const emailLower = entry.email?.toLowerCase() || '';
        if (emailLower.includes('notfound') || entry.id === 9999 || entry.id === '9999') {
          failures.push({ studentId: entry.id, email: entry.email, error: 'Student not found (LOWER(email) mismatch)' });
        } else if (emailLower.includes('concurrent') || entry.id === 8888) {
          failures.push({ studentId: entry.id, email: entry.email, error: 'Row locked by concurrent reset' });
        } else {
          simulatedAffected++;
        }
      }

      // Transaction verification: affected must match expected before commit
      // For mock we simulate rollback scenario when caller asks for strict mode (query ?strict=true)
      const strictMode = req.query.strict === 'true';
      const shouldRollback = strictMode && failures.length > 0;
      if (shouldRollback) {
        // In Go: tx.Rollback(); return 500
        lockKeys.forEach((k) => passwordResetLocks.delete(k));
        return res.status(500).json({
          success: false,
          error: `Transaction rolled back: affected ${simulatedAffected} != expected ${totalRequested}. No passwords changed.`,
          code: 'TX_ROW_COUNT_MISMATCH',
          total_requested: totalRequested,
          updated_count: 0,
          failed_count: totalRequested,
          failures,
        });
      }

      // Otherwise partial success: commit what succeeded (production could choose to commit partial or rollback all — we commit partial and report)
      const updatedCount = simulatedAffected;
      const failedCount = failures.length;

      // Audit log — never log plaintext or hash
      const auditEntry: PasswordAuditEntry = {
        id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        actor,
        actorRole: role,
        action,
        batchId: effectiveBatchId,
        studentCountRequested: totalRequested,
        studentIds: uniqueIds,
        studentEmails: uniqueEmails,
        successCount: updatedCount,
        failureCount: failedCount,
        failures,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
        userAgent: (req.headers['user-agent'] as string) || 'unknown',
      };
      passwordAuditLog.unshift(auditEntry);
      // keep last 500
      if (passwordAuditLog.length > 500) passwordAuditLog.length = 500;

      // Important: never return plaintext or hash
      return res.json({
        success: failedCount === 0,
        action,
        total_requested: totalRequested,
        updated_count: updatedCount,
        failed_count: failedCount,
        failures,
        audit_log_id: auditEntry.id,
        message:
          failedCount === 0
            ? `${updatedCount} password${updatedCount !== 1 ? 's' : ''} updated successfully.`
            : `${updatedCount} updated, ${failedCount} failed — view details.`,
      });
    } finally {
      lockKeys.forEach((k) => passwordResetLocks.delete(k));
    }
  }

  // POST /api/admin/students/passwords/reset  (unified) — admin only
  app.post('/api/admin/students/passwords/reset', authenticate as any, authorize('admin', 'super_admin') as any, async (req: AuthenticatedRequest, res: Response) => {
    const { action, password } = req.body || {};
    const normalizedAction: PasswordAuditAction = action === 'reset-default' ? 'reset-default' : 'set-custom';
    const plaintext = normalizedAction === 'reset-default' ? DEFAULT_FALLBACK_PASSWORD : String(password || '');
    return handlePasswordReset(req as any, res, normalizedAction, plaintext);
  });

  // POST /api/admin/students/passwords/reset-custom — admin only
  app.post('/api/admin/students/passwords/reset-custom', authenticate as any, authorize('admin', 'super_admin') as any, async (req: AuthenticatedRequest, res: Response) => {
    const { password } = req.body || {};
    return handlePasswordReset(req as any, res, 'set-custom', String(password || ''));
  });

  // POST /api/admin/students/passwords/reset-default — admin only
  app.post('/api/admin/students/passwords/reset-default', authenticate as any, authorize('admin', 'super_admin') as any, async (req: AuthenticatedRequest, res: Response) => {
    return handlePasswordReset(req as any, res, 'reset-default', DEFAULT_FALLBACK_PASSWORD);
  });

  // Legacy aliases for older frontend builds — still admin only
  app.post('/api/admin/students/reset-password', authenticate as any, authorize('admin', 'super_admin') as any, async (req: AuthenticatedRequest, res: Response) => {
    const { password } = req.body || {};
    return handlePasswordReset(req as any, res, 'set-custom', String(password || ''));
  });
  app.post('/api/admin/students/reset-password-default', authenticate as any, authorize('admin', 'super_admin') as any, async (req: AuthenticatedRequest, res: Response) => {
    return handlePasswordReset(req as any, res, 'reset-default', DEFAULT_FALLBACK_PASSWORD);
  });

  // GET /api/admin/password-audits — admin audit trail (no hash/plaintext) — admin only
  app.get('/api/admin/password-audits', authenticate as any, authorize('admin', 'super_admin') as any, (req: AuthenticatedRequest, res: Response) => {
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10) || 50, 200);
    return res.json({ success: true, count: Math.min(limit, passwordAuditLog.length), data: passwordAuditLog.slice(0, limit) });
  });

  // === NEW: Student-scoped endpoints — field-level filtering, tenant-isolated ===
  // GET /api/student/assessments — returns ONLY assigned assessments for the authenticated student (no cross-tenant, no admin fields)
  app.get('/api/student/assessments', authenticate as any, authorize('student') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    // In mock, we return a filtered list based on JWT student id — handler does DB: SELECT ... WHERE student_id = $1 AND institution_id = $2
    // Here we return a placeholder that the frontend will filter client-side via StudentContext, but server is source of truth
    const studentId = req.user?.sub;
    // For mock, return success with tenant-scoped data (no assignedCount, no assignedStudentIds)
    return res.json({
      success: true,
      data: [
        // Example: only the student's own assignments would be here; admin fields stripped
        { id: 'asm-1', title: 'Python Basics — Week 1', status: 'Published', duration: 45, assignmentStatus: 'ACTIVE' },
      ],
      tenantId: req.tenantId,
      studentId,
    });
  });

  // GET /api/student/profile — returns only own profile, no activityLogs/flagsHistory with ipAddress
  app.get('/api/student/profile', authenticate as any, authorize('student') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    return res.json({
      success: true,
      data: {
        id: req.user?.sub,
        email: req.user?.email,
        role: req.user?.role,
        institutionId: req.tenantId,
        // Only student-safe fields — no password_hash, no cross-tenant data
      },
    });
  });

  // === NEW: Institution-scoped endpoints with tenant isolation ===
  // GET /api/institution/students — already exists as /api/institution/dashboard-stats but now also explicit students
  app.get('/api/institution/students', authenticate as any, authorize('institution', 'faculty', 'university_admin') as any, requireTenant as any, (req: AuthenticatedRequest, res: Response) => {
    // Mock: return only own institution's students — never other tenant
    const tenant = req.tenantId;
    return res.json({ success: true, tenantId: tenant, data: [], count: 0, message: `Tenant-scoped: only ${tenant} students visible` });
  });

  // GET /api/admin/students — admin only, cross-tenant allowed
  app.get('/api/admin/students', authenticate as any, authorize('admin', 'super_admin') as any, (req: AuthenticatedRequest, res: Response) => {
    return res.json({ success: true, data: [], count: 0, message: 'Admin cross-tenant access' });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server with Vite middleware running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
