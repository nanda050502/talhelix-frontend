export type RoutePath =
  | '/login'
  | '/admin/dashboard'
  | '/assessments'
  | '/admin/assessment-setup'
  | '/libraries'
  | '/students'
  | '/reports'
  | '/student/dashboard'
  | '/student/assessments'
  | '/student/results'
  | '/student/profile'
  | '/institution/dashboard'
  | '/institution/students'
  | '/institution/batches'
  | '/institution/attendance'
  | '/institution/emergency-attendance'
  | '/institution/reports'
  | '/institution/announcements'
  | '/institution/mobile-sync'
  | string;

export type AssessmentStatus = 'Published' | 'Draft' | 'Archived';

export type QuestionType =
  | 'MCQ'
  | 'MSQ'
  | 'FILL_BLANK'
  | 'SHORT_ANSWER'
  | 'SCENARIO'
  | 'CODING';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionExample {
  id?: string;
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  isSample?: boolean;
  marks?: number;
  explanation?: string;
  orderIndex?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks: number;
  requireReasoning: boolean;
  stemMarkdown: string;
  description?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  examples?: QuestionExample[];
  options: QuestionOption[];
  language?: string;
  codeTemplate?: string;
  codeTemplates?: Record<string, string>;
  solutionCode?: string;
  testCases?: TestCase[];
  timeLimitSec?: number;
  memoryLimitMb?: number;
  expectedAnswer?: string;
  acceptableAnswers?: string[];
  isCaseSensitive?: boolean;
  evaluationRubric?: string;
  minReasoningWords?: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  duration: number; // in minutes
  passingScore: number;
  kind: string;
  publishImmediately: boolean;
  requireSafeExamBrowser: boolean;
  category: string;
  status: AssessmentStatus;
  questionsCount: number;
  createdAt: string;
  updatedAt?: string;
  questions?: Question[];
  // Blueprint and student assignment runtime metadata
  assignedCount?: number;
  completedCount?: number;
  inProgressCount?: number;
  assignedStudentIds?: number[];
}

export interface Institution {
  id: string;
  code: string; // e.g. 'STANFORD', 'MIT', 'UCB', 'CMU', 'NUS', 'ACME'
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  primaryContactEmail: string;
  domains: string[];
  logo?: string;
  studentCount: number;
  activeAssessmentsCount: number;
  settings: {
    enforceDomainMatch: boolean;
    requireAttendanceGate: boolean;
    allowStudentSelfRegistration: boolean;
    flagThresholdForReview?: number;
  };
}

export interface StudentAssessmentAttempt {
  sessionId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  proctorVerdict: 'CLEAR' | 'SUSPICIOUS' | 'FLAGGED';
  flagsRecorded: number;
  timeSpent: string;
  venueCode?: string;
  attendanceVerifiedBy?: string;
}

export interface StudentAssignment {
  id: string;
  assessmentId: string;
  assessmentUuid?: string; // Production UUID format e.g. "35de8266-eb28-43eb-99b8-9b03785f913e"
  assessmentTitle: string;
  institutionId: string;
  duration?: number;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'COMPLETED';
  published?: boolean;
  windowLabel?: string; // e.g. "anytime"
  submissionsCount?: number;
  sessionStatus?: 'submitted' | 'in progress' | 'not started' | 'revoked';
  scoreSummary?: {
    score: number;
    maxScore: number;
    percentage: number;
  };
  startedAt?: string;
  submittedAt?: string;
  isCodingAssessment?: boolean;
  validFrom: string;
  validUntil?: string;
  assignedAt: string;
  assignedBy: string;
  revocationReason?: string;
  revocationType?: 'MALPRACTICE_CHEATING' | 'ADMIN_UNASSIGN' | 'SEB_VIOLATION' | 'SCHEDULE_CHANGE';
  revokedAt?: string;
  revokedBy?: string;
  attendanceGated: boolean;
  attendanceStatus: 'PENDING_CHECKIN' | 'VERIFIED' | 'CONSUMED' | 'EXCUSED' | 'ABSENT';
  attendanceVenue?: string;
  attendanceMarkedAt?: string;
  attendanceMarkedBy?: string;
  attempts: StudentAssessmentAttempt[];
}

export type MalpracticeFlagCategory =
  | 'MULTIPLE_DEVICES'
  | 'FULLSCREEN_EXIT'
  | 'TAB_SWITCH'
  | 'COPY_PASTE_VIOLATION'
  | 'UNAUTHORIZED_DEVICE'
  | 'MULTIPLE_FACES'
  | 'AUDIO_DETECTED'
  | 'SEB_BREACH'
  | 'IMPERSONATION'
  | 'MANUAL_PROCTOR';

export interface ActiveDeviceSession {
  sessionId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  loginTime: string;
  isCurrentSession?: boolean;
  isPrimary?: boolean;
}

export interface MalpracticeFlag {
  id: string;
  studentId: number;
  reason: string;
  flaggedBy: string; // e.g. "TalHelix Student Portal (Automated)", "Proctor Admin"
  source?: 'PORTAL_AUTO' | 'ADMIN_MANUAL' | 'SEB_CLIENT';
  sessionId?: string;
  timestamp: string;
  category: MalpracticeFlagCategory;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  autoRevokeOnSingleDevice?: boolean;
}

export interface SecurityActivityLog {
  id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  event:
    | 'STUDENT_PORTAL_LOGIN'
    | 'MULTIPLE_DEVICE_DETECTED'
    | 'DEVICE_SESSION_TERMINATED'
    | 'ASSESSMENT_START_ATTEMPT'
    | 'ATTENDANCE_CHECKIN'
    | 'MALPRACTICE_FLAG_RECORDED'
    | 'MALPRACTICE_FLAG_RESOLVED'
    | 'ASSIGNMENT_REVOCATION';
  location?: string;
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING';
}

export interface AcademicRecord {
  cgpa: number;
  attendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
  assessmentsTaken: number;
  assessmentsPassed: number;
  avgAssessmentScore: number;
  termHistory?: Array<{ term: string; attendanceRate: number; gpa: number }>;
}

export interface Student {
  id: number;
  userId?: string; // e.g. "0a7ec044-3a0c-490b-b324-e128640cd62e"
  role?: string; // e.g. "student"
  createdAt?: string; // e.g. "7/25/2026, 10:02:25 AM"
  name: string;
  email: string;
  studentIdentifier: string; // e.g. "CS-2026-8819"
  registerNumber?: string; // Searchable unique registration number e.g. "710022104052"
  netId?: string; // Searchable email prefix / net ID e.g. "nkumar26"
  batchId?: string; // Associated Batch ID e.g. "batch-cs-26a"
  batchName?: string; // Associated Batch name e.g. "CS 2026 - Section A"
  section?: string; // Section e.g. "A"
  institutionId?: string;
  institutionName?: string;
  institutionCode?: string;
  dept: string;
  batchYear: number;
  progress: number;
  total: number;
  score: number;
  status: 'Active' | 'In Progress' | 'Inactive';
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'CHECKED_IN' | 'PENDING';
  flags: number;
  lastActive: string;
  avatarColor?: string;
  joinedDate?: string;
  phone?: string;
  activeDevices?: ActiveDeviceSession[];
  assignments?: StudentAssignment[];
  flagsHistory?: MalpracticeFlag[];
  activityLogs?: SecurityActivityLog[];
  academicRecord?: AcademicRecord;
}

export interface QuestionLibrary {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  createdAt: string;
  category: string;
  questions?: Question[];
}

export interface ActivityFeedItem {
  id: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  assessmentTitle: string;
  score: number;
  passed: boolean;
  timeAgo: string;
  timestamp: string;
}

export interface StudentReportItem {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  dateTaken: string;
  timeSpent: string;
  status: 'Passed' | 'Failed';
  department: string;
  topics: { name: string; score: number }[];
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Student' | 'Institution Admin' | 'Faculty/Staff' | 'Faculty / Staff Proctor' | 'Department Head';
  userType: 'admin' | 'student' | 'institution' | 'faculty';
  avatarInitials: string;
  department?: string;
  employeeId?: string;
  studentId?: number;
  rollNumber?: string;
  institutionId?: string;
  institutionName?: string;
  institutionCode?: string;
  subRole?: 'INSTITUTION_ADMIN' | 'FACULTY_STAFF' | 'DEPARTMENT_HEAD';
  facultyId?: string;
  assignedBatchIds?: string[];
  isAuthenticated: boolean;
}

export interface BatchScheduleWindow {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:30"
  subjectCode: string; // e.g. "CS301"
  subjectName: string; // e.g. "Data Structures & Algorithms"
  venueRoom: string; // e.g. "Turing Lab 402"
  facultyId: string;
  facultyName: string;
}

export type ScheduleWindow = BatchScheduleWindow;

export interface Batch {
  id: string;
  institutionId?: string;
  name: string; // e.g. "CS 2026 - Section A"
  code: string; // e.g. "CS-26-A"
  department: string; // e.g. "Computer Science & Engineering"
  academicYear?: number;
  batchYear?: number; // e.g. 2026
  semester?: number; // e.g. 6
  section: string; // e.g. "A"
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
  facultyIds?: string[];
  facultyNames?: string[];
  studentCount: number;
  studentIds?: number[];
  scheduleWindows?: BatchScheduleWindow[];
  schedules?: BatchScheduleWindow[];
  status?: 'ACTIVE' | 'ARCHIVED';
  createdAt?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'CHECKED_IN' | 'PENDING';

export interface StaffFaculty {
  id: string;
  institutionId?: string;
  name: string;
  email: string;
  employeeId: string; // e.g. "FAC-CS-104"
  role?: 'INSTITUTION_ADMIN' | 'FACULTY_STAFF' | 'DEPARTMENT_HEAD' | 'STAFF_FACULTY';
  department: string;
  designation: string; // e.g. "Associate Professor", "Dean of Computing"
  assignedBatchIds: string[];
  assignedBatchNames?: string[];
  assignedSubjects?: string[];
  phone?: string;
  avatarColor?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  mobileAppAccess: boolean;
  mobileApiKey?: string;
  apiKey?: string;
  joinedDate?: string;
  lastLoginAt?: string;
  lastMobileSyncAt?: string;
  createdAt?: string;
}

export type AttendanceSource = 'web-manual' | 'mobile-app' | 'rfid';

export interface AttendanceRecord {
  id: string;
  institutionId?: string;
  batchId: string;
  batchName?: string;
  scheduleWindowId?: string;
  subjectName?: string;
  studentId: number;
  studentName?: string;
  registerNumber?: string; // Searchable e.g. "710022104052"
  netId?: string; // Searchable e.g. "nkumar26"
  studentEmail?: string;
  date: string; // "YYYY-MM-DD"
  sessionTimeWindow?: string; // e.g. "09:00 - 10:30"
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  source: AttendanceSource; // 'web-manual' | 'mobile-app' | 'rfid'
  markedAt: string; // ISO string
  markedByUserId?: string;
  markedByName?: string;
  venueRoom?: string;
  remarks?: string;
  syncStatus?: 'SYNCED' | 'PENDING' | 'CONFLICT';
}

export interface InstitutionAnnouncement {
  id: string;
  institutionId?: string;
  title: string;
  content: string;
  targetType?: 'ALL' | 'BATCH' | 'FACULTY' | 'STUDENTS';
  targetAudience?: 'ALL' | 'FACULTY' | 'STUDENTS' | 'BATCH';
  targetBatchIds?: string[];
  authorId?: string;
  authorName: string;
  authorRole: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  pinned?: boolean;
  expiresAt?: string;
  attachmentName?: string;
  createdAt?: string;
  publishedAt?: string;
  readCount?: number;
}

export interface MobileSyncDataset {
  apiContractVersion?: string;
  faculty: {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    role?: string;
    department: string;
  };
  institution: {
    id?: string;
    name: string;
    code: string;
    serverTimezone?: string;
  };
  assignedBatches: Array<{
    id: string;
    name: string;
    code: string;
    department: string;
    section: string;
    studentCount: number;
    schedules: BatchScheduleWindow[];
    students: Array<{
      id: number;
      name: string;
      email: string;
      registerNumber: string;
      netId: string;
      section: string;
      avatarColor?: string;
      recentAttendancePercentage: number;
    }>;
  }>;
  liveScheduleRightNow: {
    isLive: boolean;
    batchId?: string;
    batchName?: string;
    subjectCode?: string;
    subjectName?: string;
    startTime?: string;
    endTime?: string;
    venueRoom?: string;
  } | null;
  syncTimestamp: string;
  supportedMarkingSources: AttendanceSource[];
}

export interface InstitutionDashboardMetrics {
  totalStudents: number;
  activeBatchesCount: number;
  todayAttendanceRate: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  totalFacultyCount: number;
  pendingApprovalsCount: number;
  activeAnnouncementsCount: number;
  lowAttendanceStudentCount: number;
}

export interface ExamAnswer {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
  codeAnswer?: string;
  isMarkedForReview: boolean;
  timeSpentSeconds?: number;
}

export interface ExamSubmissionResult {
  assessmentId: string;
  assessmentTitle: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeSpent: string;
  completedAt: string;
  topicBreakdown: { name: string; score: number }[];
}

export interface DashboardStats {
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  assessments: number;
  published: number;
  draft: number;
}

export interface StudentStats {
  total: number;
  activeToday: number;
  avgScore: number;
  completionRate: number;
}
