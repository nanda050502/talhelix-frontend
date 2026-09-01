import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  Assessment,
  QuestionLibrary,
  UserProfile,
  DashboardStats,
  StudentStats,
  ActivityFeedItem,
  StudentReportItem,
  RoutePath,
  ExamSubmissionResult,
  Institution,
  StudentAssignment,
  MalpracticeFlag,
  MalpracticeFlagCategory,
  SecurityActivityLog,
  Batch,
  StaffFaculty,
  AttendanceRecord,
  AttendanceSource,
  InstitutionAnnouncement,
  BatchScheduleWindow,
  MobileSyncDataset,
  AcademicRecord,
} from '../types';
import {
  mockStudents as initialStudents,
  mockAssessments as initialAssessments,
  mockLibraries as initialLibraries,
  mockInstitutions as initialInstitutions,
  mockDashboardStats,
  mockStudentStats,
  mockActivityFeed,
  mockStudentReports,
  mockBatches as initialBatches,
  mockStaffFaculty as initialStaffFaculty,
  mockAttendanceRecords as initialAttendanceRecords,
  mockAnnouncements as initialAnnouncements,
  mockInstitutionDashboardMetrics,
} from '../mockData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  currentRoute: RoutePath;
  navigateTo: (route: RoutePath) => void;
  user: UserProfile;
  login: (email: string, userType?: 'admin' | 'student' | 'institution' | 'faculty') => boolean;
  logout: () => void;
  switchRole: (userType: 'admin' | 'student' | 'institution' | 'faculty', studentEmail?: string) => void;
  institutions: Institution[];
  selectedInstitutionId: string | 'ALL';
  setSelectedInstitutionId: (id: string | 'ALL') => void;
  students: Student[];
  addStudent: (student: {
    name: string;
    email: string;
    dept: string;
    status?: 'Active' | 'In Progress' | 'Inactive';
    institutionId?: string;
    studentIdentifier?: string;
    registerNumber?: string;
    netId?: string;
    batchId?: string;
    batchName?: string;
    section?: string;
    batchYear?: number;
    phone?: string;
  }) => void;
  updateStudentProfile: (id: number, updates: Partial<Student>) => void;
  importStudentsFromCSV: (importedList: Array<Partial<Student>>) => { imported: number; errors: string[] };
  deleteStudent: (id: number) => void;
  updateStudentStatus: (id: number, status: 'Active' | 'In Progress' | 'Inactive') => void;
  assignAssessmentToStudents: (
    studentIds: number[],
    assessmentIds: string[],
    validUntil?: string,
    requireAttendance?: boolean
  ) => void;
  revokeStudentAssignment: (
    studentId: number,
    assignmentId: string,
    reason: string,
    isMalpractice?: boolean,
    malpracticeCategory?: MalpracticeFlagCategory
  ) => void;
  reinstateStudentAssignment?: (studentId: number, assignmentId: string) => void;
  addStudentFlag: (
    studentId: number,
    flag: {
      reason: string;
      category: MalpracticeFlagCategory;
      sessionId?: string;
      flaggedBy?: string;
    }
  ) => void;
  resolveStudentFlag: (
    studentId: number,
    flagId: string,
    resolutionNotes: string,
    action?: 'RESOLVE' | 'DISMISS'
  ) => void;
  deleteStudentFlag: (
    studentId: number,
    flagId: string,
    reason?: string
  ) => void;
  batchFlagStudents: (
    studentIds: number[],
    flag: {
      reason: string;
      category: MalpracticeFlagCategory;
      flaggedBy?: string;
    }
  ) => void;
  terminateStudentDeviceSession: (studentId: number, sessionId: string) => void;
  terminateAllOtherDeviceSessions: (studentId: number) => void;
  simulateAddDeviceSession: (studentId: number, targetType?: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'desktop' | 'mobile' | 'tablet') => void;
  recordStudentViolation: (
    studentId: number,
    category: MalpracticeFlagCategory,
    reason: string,
    sessionId?: string
  ) => void;
  toggleStudentAttendance: (
    studentId: number,
    status: 'PRESENT' | 'ABSENT' | 'CHECKED_IN' | 'PENDING'
  ) => void;
  markStudentAttendance: (
    studentId: number,
    assignmentId: string,
    venueCode: string,
    markedBy?: string
  ) => void;
  assessments: Assessment[];
  createAssessment: (assessmentData: Partial<Assessment>) => Assessment;
  duplicateAssessment: (id: string) => void;
  deleteAssessment: (id: string) => void;
  libraries: QuestionLibrary[];
  createLibrary: (lib: { name: string; description: string; category?: string }) => void;
  deleteLibrary: (id: string) => void;
  dashboardStats: DashboardStats;
  studentStats: StudentStats;
  activityFeed: ActivityFeedItem[];
  studentReports: Record<string, StudentReportItem[]>;
  submitStudentAssessment: (submission: ExamSubmissionResult) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Institution Role Module States & Actions
  batches: Batch[];
  addBatch: (batchData: Partial<Batch>) => Batch;
  updateBatch: (id: string, updates: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;
  assignStudentsToBatch: (batchId: string, studentIds: number[]) => void;

  staffFaculty: StaffFaculty[];
  addStaffFaculty: (facultyData: Partial<StaffFaculty>) => StaffFaculty;
  updateStaffFaculty: (id: string, updates: Partial<StaffFaculty>) => void;
  deleteStaffFaculty: (id: string) => void;
  toggleFacultyMobileAccess: (id: string, enabled: boolean) => void;
  regenerateFacultyApiKey: (id: string) => string;

  attendanceRecords: AttendanceRecord[];
  markAttendanceRecord: (data: {
    studentId: number;
    batchId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    source?: AttendanceSource;
    remarks?: string;
    date?: string;
    sessionTimeWindow?: string;
    subjectName?: string;
  }) => void;
  bulkMarkAttendance: (
    records: Array<{ studentId: number; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; remarks?: string }>,
    batchId: string,
    date?: string,
    sessionTimeWindow?: string,
    source?: AttendanceSource
  ) => void;

  announcements: InstitutionAnnouncement[];
  addAnnouncement: (announcement: Partial<InstitutionAnnouncement>) => InstitutionAnnouncement;
  deleteAnnouncement: (id: string) => void;

  getLiveBatchForFaculty: (facultyId?: string) => {
    isLive: boolean;
    schedule: BatchScheduleWindow | null;
    batch: Batch | null;
  };
  getMobileSyncDataset: (facultyId?: string) => MobileSyncDataset;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_ADMIN_USER: UserProfile = {
  name: 'Nanda Kumar',
  email: 'n_admin@talhelix.com',
  role: 'Super Admin',
  userType: 'admin',
  avatarInitials: 'NK',
  isAuthenticated: true,
};

const DEFAULT_INSTITUTION_USER: UserProfile = {
  name: 'Dr. Arthur Mitchell',
  email: 'admin@stanford.edu',
  role: 'Institution Admin',
  userType: 'institution',
  avatarInitials: 'AM',
  institutionId: 'inst-stanford',
  institutionName: 'Stanford University',
  institutionCode: 'STANFORD',
  department: 'Academic Operations & Engineering',
  employeeId: 'INST-ADM-01',
  isAuthenticated: true,
};

const DEFAULT_FACULTY_USER: UserProfile = {
  name: 'Prof. David Malan',
  email: 'david.malan@stanford.edu',
  role: 'Faculty / Staff Proctor',
  userType: 'faculty',
  avatarInitials: 'DM',
  institutionId: 'inst-stanford',
  institutionName: 'Stanford University',
  institutionCode: 'STANFORD',
  department: 'Computer Science & Engineering',
  employeeId: 'FAC-CS-101',
  isAuthenticated: true,
};

const DEFAULT_STUDENT_USER: UserProfile = {
  name: 'Alice Chen',
  email: 'alice@stanford.edu',
  role: 'Student',
  userType: 'student',
  avatarInitials: 'AC',
  department: 'Computer Science',
  studentId: 1,
  rollNumber: 'SU-CS-2026-8819',
  isAuthenticated: true,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start unauthenticated — login page first, then verify and route by role
  const [user, setUser] = useState<UserProfile>({ ...DEFAULT_ADMIN_USER, isAuthenticated: false });

  // Always land on /login first; after successful login, login()/switchRole() will navigateTo the role dashboard
  const [currentRoute, setCurrentRoute] = useState<RoutePath>('/login');

  const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | 'ALL'>('ALL');
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [libraries, setLibraries] = useState<QuestionLibrary[]>(initialLibraries);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(mockDashboardStats);
  const [studentStats] = useState<StudentStats>(mockStudentStats);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>(mockActivityFeed);
  const [studentReports, setStudentReports] = useState<Record<string, StudentReportItem[]>>(mockStudentReports);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Institution State
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [staffFaculty, setStaffFaculty] = useState<StaffFaculty[]>(initialStaffFaculty);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const [announcements, setAnnouncements] = useState<InstitutionAnnouncement[]>(initialAnnouncements);

  // Ensure browser URL matches initial /login (login-first flow)
  useEffect(() => {
    if (window.location.pathname !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Guarded Navigation: Student cannot navigate to admin/institution routes
  const navigateTo = (route: RoutePath) => {
    if (user.userType === 'student') {
      const isRestrictedRoute =
        route.startsWith('/admin') ||
        route.startsWith('/institution') ||
        route === '/assessments' ||
        route === '/libraries' ||
        route === '/students' ||
        route === '/reports' ||
        route.startsWith('/authoring');

      if (isRestrictedRoute) {
        showToast('Access restricted: Student accounts cannot access administrative portals', 'warning');
        const fallback = '/student/dashboard';
        setCurrentRoute(fallback);
        window.history.pushState({}, '', fallback);
        return;
      }
    } else if (user.userType === 'institution' || user.userType === 'faculty') {
      const isRestrictedAdminOnlyRoute =
        route.startsWith('/admin/settings') ||
        route === '/libraries' ||
        route.startsWith('/authoring/builder');

      if (isRestrictedAdminOnlyRoute && user.userType === 'faculty') {
        showToast('Access restricted to Institution Admins only', 'warning');
        const fallback = '/institution/dashboard';
        setCurrentRoute(fallback);
        window.history.pushState({}, '', fallback);
        return;
      }
    }

    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        if (user.userType === 'student') setCurrentRoute('/student/dashboard');
        else if (user.userType === 'institution' || user.userType === 'faculty') setCurrentRoute('/institution/dashboard');
        else setCurrentRoute('/admin/dashboard');
      } else {
        setCurrentRoute(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user.userType]);

  // Helper to persist auth for backend dev bypass (x-mock-role) and for refresh
  const persistAuth = (profile: UserProfile) => {
    try {
      localStorage.setItem('talhelix_user', JSON.stringify(profile));
      localStorage.setItem('talhelix_role', profile.role);
      localStorage.setItem('talhelix_userType', profile.userType);
      if (profile.institutionId) localStorage.setItem('talhelix_institutionId', profile.institutionId);
      // Also generate a mock JWT for backend authenticate (dev only) — backend will accept x-mock-role anyway, but we also set a token
      // Simple mock token: base64 of JSON payload (not signed, but backend dev bypass will accept x-mock-role)
      // For real backend, this would be an httpOnly cookie set by POST /auth/login
    } catch {}
  };

  const login = (email: string, userType: 'admin' | 'student' | 'institution' | 'faculty' = 'admin') => {
    const cleanEmail = email.trim().toLowerCase();

    if (userType === 'student' || (!cleanEmail.includes('admin') && cleanEmail.includes('example.com') && !cleanEmail.includes('stanford'))) {
      const matched = students.find((s) => s.email.toLowerCase() === cleanEmail) || initialStudents[0];
      const initials = matched.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
      const studentUser: UserProfile = {
        name: matched.name,
        email: matched.email,
        role: 'Student',
        userType: 'student',
        avatarInitials: initials || 'ST',
        department: matched.dept || 'Computer Science',
        studentId: matched.id,
        rollNumber: matched.registerNumber || `CS-2024-${String(matched.id).padStart(3, '0')}`,
        institutionId: (matched as any).institutionId || 'inst-stanford',
        isAuthenticated: true,
      };
      setUser(studentUser);
      persistAuth(studentUser);
      showToast(`Welcome back, ${matched.name}`, 'success');
      navigateTo('/student/dashboard');
      return true;
    }

    if (userType === 'institution') {
      const instUser: UserProfile = {
        name: 'Dr. Arthur Mitchell',
        email: cleanEmail || 'admin@stanford.edu',
        role: 'Institution Admin',
        userType: 'institution',
        avatarInitials: 'AM',
        institutionId: 'inst-stanford',
        institutionName: 'Stanford University',
        institutionCode: 'STANFORD',
        department: 'Academic Operations & Engineering',
        employeeId: 'INST-ADM-01',
        isAuthenticated: true,
      };
      setUser(instUser);
      persistAuth(instUser);
      showToast('Signed in to Stanford University Portal (Institution Admin)', 'success');
      navigateTo('/institution/dashboard');
      return true;
    }

    if (userType === 'faculty') {
      const matchedFaculty = staffFaculty.find((f) => f.email.toLowerCase() === cleanEmail) || initialStaffFaculty[0];
      const facUser: UserProfile = {
        name: matchedFaculty.name,
        email: matchedFaculty.email,
        role: 'Faculty / Staff Proctor',
        userType: 'faculty',
        avatarInitials: matchedFaculty.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FM',
        institutionId: matchedFaculty.institutionId,
        institutionName: 'Stanford University',
        institutionCode: 'STANFORD',
        department: matchedFaculty.department,
        employeeId: matchedFaculty.employeeId,
        isAuthenticated: true,
      };
      setUser(facUser);
      persistAuth(facUser);
      showToast(`Signed in as ${matchedFaculty.name} (Faculty Portal)`, 'success');
      navigateTo('/institution/dashboard');
      return true;
    }

    const adminUser: UserProfile = {
      name: 'Nanda Kumar',
      email: cleanEmail || 'n_admin@talhelix.com',
      role: 'Super Admin',
      userType: 'admin',
      avatarInitials: 'NK',
      isAuthenticated: true,
    };
    setUser(adminUser);
    persistAuth(adminUser);
    showToast('Signed in successfully as Super Admin', 'success');
    navigateTo('/admin/dashboard');
    return true;
  };

  const switchRole = (targetRole: 'admin' | 'student' | 'institution' | 'faculty', studentEmail?: string) => {
    if (targetRole === 'student') {
      const emailToUse = studentEmail || 'alice@stanford.edu';
      login(emailToUse, 'student');
    } else if (targetRole === 'institution') {
      login('admin@stanford.edu', 'institution');
    } else if (targetRole === 'faculty') {
      login('david.malan@stanford.edu', 'faculty');
    } else {
      login('n_admin@talhelix.com', 'admin');
    }
  };

  const logout = () => {
    setUser((prev) => ({ ...prev, isAuthenticated: false }));
    try {
      localStorage.removeItem('talhelix_user');
      localStorage.removeItem('talhelix_role');
      localStorage.removeItem('talhelix_userType');
      localStorage.removeItem('talhelix_institutionId');
      localStorage.removeItem('talhelix_token');
      sessionStorage.clear();
    } catch {}
    showToast('Signed out of TalHelix', 'info');
    navigateTo('/login');
  };

  const submitStudentAssessment = (submission: ExamSubmissionResult) => {
    const currentEmail = user.email.toLowerCase();
    const newReportItem: StudentReportItem = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      assessmentId: submission.assessmentId,
      assessmentTitle: submission.assessmentTitle,
      score: submission.score,
      maxScore: submission.maxScore,
      percentage: submission.percentage,
      dateTaken: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeSpent: submission.timeSpent,
      status: submission.passed ? 'Passed' : 'Failed',
      department: user.department || 'Computer Science',
      topics: submission.topicBreakdown,
    };

    // Update student reports dictionary
    setStudentReports((prev) => ({
      ...prev,
      [currentEmail]: [newReportItem, ...(prev[currentEmail] || [])],
    }));

    // Update activity feed
    const newFeedItem: ActivityFeedItem = {
      id: `act-${Date.now().toString().slice(-4)}`,
      studentName: user.name,
      studentEmail: user.email,
      studentAvatar: user.avatarInitials,
      assessmentTitle: submission.assessmentTitle,
      score: submission.percentage,
      passed: submission.passed,
      timeAgo: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setActivityFeed((prev) => [newFeedItem, ...prev]);

    // Update student progress count AND sync assignment status for proper admin ↔ student portal sync
    setStudents((prev) =>
      prev.map((st) => {
        if (st.email.toLowerCase() !== currentEmail) return st;

        const nowIso = new Date().toISOString();
        let assignmentMatched = false;
        const updatedAssignments = (st.assignments || []).map((asg) => {
          // Match by assessmentId (primary) or assessmentUuid fallback; only update ACTIVE assignments
          const isMatch =
            (asg.assessmentId === submission.assessmentId ||
              asg.assessmentUuid === submission.assessmentId) &&
            asg.status === 'ACTIVE';
          if (!isMatch) return asg;
          assignmentMatched = true;
          return {
            ...asg,
            status: 'COMPLETED' as const,
            sessionStatus: 'submitted' as const,
            submittedAt: nowIso,
            startedAt: asg.startedAt || nowIso,
            scoreSummary: {
              score: submission.score,
              maxScore: submission.maxScore,
              percentage: submission.percentage,
            },
            attempts: [
              ...(asg.attempts || []),
              {
                sessionId: `ses-${Date.now().toString().slice(-4)}`,
                attemptNumber: (asg.attempts?.length || 0) + 1,
                startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                submittedAt: nowIso,
                score: submission.score,
                maxScore: submission.maxScore,
                percentage: submission.percentage,
                passed: submission.passed,
                proctorVerdict: 'CLEAR' as const,
                flagsRecorded: 0,
                timeSpent: submission.timeSpent,
              },
            ],
          };
        });

        // If no ACTIVE assignment was found (e.g., student took a globally-published test without explicit assignment),
        // keep assignments as-is; reports still track completion. For strict sync we could create a synthetic COMPLETED assignment here,
        // but we avoid duplicating to keep assignment source single — reports are the completion record in that edge case.
        // To ensure admin sees the completion, we update progress/score regardless.
        return {
          ...st,
          progress: Math.min(st.total, st.progress + 1),
          score: Math.round((st.score + submission.percentage) / 2),
          lastActive: 'Just now',
          assignments: updatedAssignments,
        };
      })
    );

    showToast(
      `Assessment completed: ${submission.score}/${submission.maxScore} marks (${submission.percentage}%)`,
      submission.passed ? 'success' : 'warning'
    );
  };

  const resolveInstitutionByEmail = (email: string, explicitInstId?: string): Institution => {
    if (explicitInstId && explicitInstId !== 'AUTO') {
      const found = institutions.find((i) => i.id === explicitInstId);
      if (found) return found;
    }
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      const match = institutions.find((i) =>
        i.domains.some((d) => domain === d.toLowerCase() || domain.endsWith(`.${d.toLowerCase()}`))
      );
      if (match) return match;
    }
    // Fallback to selected institution or first active institution
    if (selectedInstitutionId !== 'ALL') {
      const selected = institutions.find((i) => i.id === selectedInstitutionId);
      if (selected) return selected;
    }
    return institutions[0];
  };

  const addStudent = (studentData: {
    name: string;
    email: string;
    dept: string;
    status?: 'Active' | 'In Progress' | 'Inactive';
    institutionId?: string;
    studentIdentifier?: string;
    registerNumber?: string;
    netId?: string;
    batchId?: string;
    batchName?: string;
    section?: string;
    batchYear?: number;
    phone?: string;
  }) => {
    const inst = resolveInstitutionByEmail(studentData.email, studentData.institutionId);
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600', 'bg-indigo-600', 'bg-rose-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const generatedId = Date.now();
    const batchYear = studentData.batchYear || new Date().getFullYear() + 2;
    const identifier =
      studentData.studentIdentifier ||
      `${inst.code}-${studentData.dept.slice(0, 2).toUpperCase()}-${batchYear}-${String(generatedId).slice(-4)}`;

    const newStudent: Student = {
      id: generatedId,
      name: studentData.name,
      email: studentData.email,
      studentIdentifier: identifier,
      registerNumber: studentData.registerNumber || `7100221040${String(generatedId).slice(-3)}`,
      netId: studentData.netId || studentData.email.split('@')[0],
      batchId: studentData.batchId || 'batch-cs-26a',
      batchName: studentData.batchName || 'CS 2026 - Section A',
      section: studentData.section || 'A',
      institutionId: inst.id,
      institutionName: inst.name,
      institutionCode: inst.code,
      dept: studentData.dept,
      batchYear,
      progress: 0,
      total: 12,
      score: 0,
      status: studentData.status || 'Active',
      flags: 0,
      lastActive: 'Just now',
      avatarColor: randomColor,
      joinedDate: new Date().toISOString().split('T')[0],
      phone: studentData.phone || '+1 (555) 000-0000',
      assignments: [],
      flagsHistory: [],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          ipAddress: '127.0.0.1',
          userAgent: 'TalHelix Admin Onboarding',
          event: 'STUDENT_PORTAL_LOGIN',
          location: 'Roster Registration',
          status: 'SUCCESS',
        },
      ],
    };

    setStudents((prev) => [newStudent, ...prev]);
    // update institution student count
    setInstitutions((prev) =>
      prev.map((i) => (i.id === inst.id ? { ...i, studentCount: i.studentCount + 1 } : i))
    );
    showToast(`Added candidate ${newStudent.name} (${inst.code})`, 'success');
  };

  const deleteStudent = (id: number) => {
    const st = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (st) {
      setInstitutions((prev) =>
        prev.map((i) =>
          i.id === st.institutionId ? { ...i, studentCount: Math.max(0, i.studentCount - 1) } : i
        )
      );
    }
    showToast(`Student ${st ? st.name : ''} removed from roster`, 'info');
  };

  const updateStudentStatus = (id: number, status: 'Active' | 'In Progress' | 'Inactive') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    showToast(`Updated student status to ${status}`, 'success');
  };

  // Assessment Assignment Operations (Single & Bulk)
  const assignAssessmentToStudents = (
    studentIds: number[],
    assessmentIds: string[],
    validUntil?: string,
    requireAttendance: boolean = true
  ) => {
    const targetAssessments = assessments.filter((a) => assessmentIds.includes(a.id));
    if (targetAssessments.length === 0 || studentIds.length === 0) return;

    setStudents((prev) =>
      prev.map((student) => {
        if (!studentIds.includes(student.id)) return student;

        const currentAssignments = student.assignments || [];
        const newAssignments: StudentAssignment[] = [];

        targetAssessments.forEach((asm) => {
          // Check if already actively assigned
          const existing = currentAssignments.find(
            (a) => a.assessmentId === asm.id && a.status === 'ACTIVE'
          );
          if (!existing) {
            newAssignments.push({
              id: `asg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              assessmentId: asm.id,
              assessmentTitle: asm.title,
              institutionId: student.institutionId,
              status: 'ACTIVE',
              validFrom: new Date().toISOString(),
              validUntil: validUntil || undefined,
              assignedAt: new Date().toISOString(),
              assignedBy: user.name || 'Admin',
              attendanceGated: requireAttendance,
              attendanceStatus: requireAttendance ? 'PENDING_CHECKIN' : 'VERIFIED',
              attempts: [],
            });
          }
        });

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: '10.0.0.1',
            userAgent: 'Admin Assignment Engine',
            event: 'ASSESSMENT_START_ATTEMPT',
            location: `Assigned ${targetAssessments.length} assessments`,
            status: 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          total: student.total + newAssignments.length,
          assignments: [...newAssignments, ...currentAssignments],
          activityLogs: newLogs,
        };
      })
    );

    showToast(
      `Assigned ${targetAssessments.length} assessment(s) to ${studentIds.length} candidate(s)`,
      'success'
    );
  };

  // Revocation with Mandatory Audit Log & Optional Malpractice Flagging
  const revokeStudentAssignment = (
    studentId: number,
    assignmentId: string,
    reason: string,
    isMalpractice?: boolean,
    malpracticeCategory: MalpracticeFlagCategory = 'MANUAL_PROCTOR'
  ) => {
    const actor = user.name || 'Admin';
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const currentAssignments = student.assignments || [];
        let revokedTitle = 'Assessment';

        const updatedAssignments = currentAssignments.map((asg) => {
          if (asg.id === assignmentId) {
            revokedTitle = asg.assessmentTitle;
            return {
              ...asg,
              status: 'REVOKED' as const,
              sessionStatus: 'revoked' as const,
              revocationReason: reason,
              revocationType: isMalpractice ? ('MALPRACTICE_CHEATING' as const) : ('ADMIN_UNASSIGN' as const),
              revokedAt: new Date().toISOString(),
              revokedBy: actor,
            };
          }
          return asg;
        });

        let updatedFlags = student.flagsHistory || [];
        if (isMalpractice) {
          const newFlag: MalpracticeFlag = {
            id: `flg-rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            studentId,
            reason: `Malpractice / Cheating on "${revokedTitle}": ${reason}`,
            category: malpracticeCategory,
            flaggedBy: `${actor} (Exam Integrity Officer)`,
            source: 'ADMIN_MANUAL',
            timestamp,
            status: 'ACTIVE',
          };
          updatedFlags = [newFlag, ...updatedFlags];
        }

        const activeFlagsCount = updatedFlags.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp,
            ipAddress: '10.0.0.1',
            userAgent: 'Admin Revocation Console',
            event: 'ASSIGNMENT_REVOCATION',
            location: isMalpractice
              ? `Malpractice Revocation: ${reason} (${malpracticeCategory})`
              : `Admin Unassign / Revoke: ${reason}`,
            status: 'WARNING',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          assignments: updatedAssignments,
          flags: activeFlagsCount,
          flagsHistory: updatedFlags,
          activityLogs: newLogs,
        };
      })
    );

    if (isMalpractice) {
      showToast(`Assessment revoked and candidate flagged for malpractice (${malpracticeCategory})`, 'warning');
    } else {
      showToast(`Assignment revoked successfully. Audit record created.`, 'info');
    }
  };

  const reinstateStudentAssignment = (studentId: number, assignmentId: string) => {
    const actor = user.name || 'Admin';
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedAssignments = (student.assignments || []).map((asg) => {
          if (asg.id === assignmentId) {
            return {
              ...asg,
              status: 'ACTIVE' as const,
              sessionStatus: (asg.attempts && asg.attempts.length > 0 ? 'submitted' : 'not started') as 'submitted' | 'not started',
              revocationReason: undefined,
              revocationType: undefined,
              revokedAt: undefined,
              revokedBy: undefined,
            };
          }
          return asg;
        });

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp,
            ipAddress: '10.0.0.1',
            userAgent: 'Admin Revocation Console',
            event: 'ASSIGNMENT_REVOCATION',
            location: `Reinstated assignment for candidate by ${actor}`,
            status: 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          assignments: updatedAssignments,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Assignment reinstated and unlocked for candidate`, 'success');
  };

  // Malpractice & Integrity Flag Operations
  const addStudentFlag = (
    studentId: number,
    flagData: {
      reason: string;
      category: MalpracticeFlagCategory;
      sessionId?: string;
      flaggedBy?: string;
    }
  ) => {
    const actor = flagData.flaggedBy || user.name || 'Proctor';
    const newFlag: MalpracticeFlag = {
      id: `flg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      reason: flagData.reason,
      category: flagData.category,
      sessionId: flagData.sessionId,
      flaggedBy: actor,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'ACTIVE',
    };

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedHistory = [newFlag, ...(student.flagsHistory || [])];
        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: '10.0.0.1',
            userAgent: 'TalHelix Proctoring Guard',
            event: 'MALPRACTICE_FLAG_RECORDED',
            location: `Flagged (${flagData.category}): ${flagData.reason}`,
            status: 'WARNING',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Malpractice flag recorded: ${flagData.category}`, 'warning');
  };

  const resolveStudentFlag = (
    studentId: number,
    flagId: string,
    resolutionNotes: string,
    action: 'RESOLVE' | 'DISMISS' = 'RESOLVE'
  ) => {
    const actor = user.name || 'Admin';

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedHistory = (student.flagsHistory || []).map((f) => {
          if (f.id === flagId) {
            return {
              ...f,
              status: (action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED') as 'RESOLVED' | 'DISMISSED',
              resolutionNotes,
              resolvedBy: actor,
              resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            };
          }
          return f;
        });

        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: '10.0.0.1',
            userAgent: 'Compliance Review Console',
            event: 'MALPRACTICE_FLAG_RESOLVED',
            location: `Flag ${flagId} ${action === 'DISMISS' ? 'dismissed' : 'resolved'}: ${resolutionNotes}`,
            status: 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Flag ${action === 'DISMISS' ? 'dismissed' : 'marked resolved'}`, 'success');
  };

  const deleteStudentFlag = (
    studentId: number,
    flagId: string,
    reason: string = 'Administrative record deletion'
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedHistory = (student.flagsHistory || []).filter((f) => f.id !== flagId);
        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: '10.0.0.1',
            userAgent: 'Admin Compliance Audit',
            event: 'MALPRACTICE_FLAG_RESOLVED',
            location: `Flag ${flagId} deleted/expunged: ${reason}`,
            status: 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
          activityLogs: newLogs,
        };
      })
    );

    showToast('Flag removed and audit record updated', 'info');
  };

  const batchFlagStudents = (
    studentIds: number[],
    flagData: {
      reason: string;
      category: MalpracticeFlagCategory;
      flaggedBy?: string;
    }
  ) => {
    const actor = flagData.flaggedBy || user.name || 'Proctor Supervisor';
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setStudents((prev) =>
      prev.map((student) => {
        if (!studentIds.includes(student.id)) return student;

        const newFlag: MalpracticeFlag = {
          id: `flg-${Date.now()}-${student.id}-${Math.random().toString(36).substring(2, 5)}`,
          studentId: student.id,
          reason: flagData.reason,
          category: flagData.category,
          flaggedBy: actor,
          timestamp,
          status: 'ACTIVE',
        };

        const updatedHistory = [newFlag, ...(student.flagsHistory || [])];
        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        return {
          ...student,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
        };
      })
    );

    showToast(`Recorded malpractice flag for ${studentIds.length} selected candidate(s)`, 'warning');
  };

  // Device Session Management (Single Device Enforcement)
  const terminateStudentDeviceSession = (studentId: number, sessionId: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const remainingDevices = (student.activeDevices || []).filter((d) => d.sessionId !== sessionId);
        const deviceWasPresent = (student.activeDevices || []).find((d) => d.sessionId === sessionId);
        const deviceLabel = deviceWasPresent?.deviceName || 'Secondary device';

        // Check if multi-device flag should be auto-resolved when device count drops to <= 1
        let updatedHistory = student.flagsHistory || [];
        let autoResolvedFlag = false;

        if (remainingDevices.length <= 1) {
          updatedHistory = updatedHistory.map((f) => {
            if (f.status === 'ACTIVE' && (f.category === 'MULTIPLE_DEVICES' || f.autoRevokeOnSingleDevice)) {
              autoResolvedFlag = true;
              return {
                ...f,
                status: 'RESOLVED' as const,
                resolutionNotes: 'Auto-revoked: Remote device session signed out. Only 1 authorized device remains active.',
                resolvedBy: 'TalHelix Security Engine',
                resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              };
            }
            return f;
          });
        }

        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: deviceWasPresent?.ipAddress || '10.0.0.1',
            userAgent: deviceWasPresent?.browser || 'Portal Security',
            event: 'DEVICE_SESSION_TERMINATED',
            location: `Terminated session for ${deviceLabel}. ${remainingDevices.length} device(s) remain active.`,
            status: 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          activeDevices: remainingDevices,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Remote device session terminated.`, 'info');
  };

  const terminateAllOtherDeviceSessions = (studentId: number) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const devices = student.activeDevices || [];
        const primaryDevice = devices.find((d) => d.isCurrentSession) || devices[0];
        const remainingDevices = primaryDevice ? [primaryDevice] : [];

        // Auto-resolve any active multiple device flags
        const updatedHistory = (student.flagsHistory || []).map((f) => {
          if (f.status === 'ACTIVE' && (f.category === 'MULTIPLE_DEVICES' || f.autoRevokeOnSingleDevice)) {
            return {
              ...f,
              status: 'RESOLVED' as const,
              resolutionNotes: 'Auto-revoked: Signed out of all other devices. Single device login verified.',
              resolvedBy: 'TalHelix Security Engine',
              resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            };
          }
          return f;
        });

        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: primaryDevice?.ipAddress || '10.0.0.1',
            userAgent: 'TalHelix Portal Security',
            event: 'DEVICE_SESSION_TERMINATED',
            location: 'Candidate closed all other active website sessions. Single authorized device restored.',
            status: 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          activeDevices: remainingDevices,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Terminated all other active device sessions. Multi-device integrity flag cleared.`, 'success');
  };

  const simulateAddDeviceSession = (
    studentId: number,
    targetType?: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'desktop' | 'mobile' | 'tablet'
  ) => {
    const mockSecondaryDevices = [
      {
        deviceName: 'iPhone 15 Pro (Safari)',
        deviceType: 'MOBILE' as const,
        browser: 'Mobile Safari 17.5',
        os: 'iOS 17.5',
        ipAddress: '198.51.100.88',
        location: 'San Francisco, CA, US',
      },
      {
        deviceName: 'iPad Air 5th Gen (Chrome)',
        deviceType: 'TABLET' as const,
        browser: 'Chrome 128 (iOS)',
        os: 'iPadOS 17.5',
        ipAddress: '198.51.100.92',
        location: 'San Francisco, CA, US',
      },
      {
        deviceName: 'Secondary Laptop (Firefox 129)',
        deviceType: 'DESKTOP' as const,
        browser: 'Firefox 129.0',
        os: 'Windows 11',
        ipAddress: '198.51.100.104',
        location: 'San Francisco, CA, US',
      },
    ];

    const normalizedType = targetType ? targetType.toUpperCase() : undefined;
    const candidates = normalizedType
      ? mockSecondaryDevices.filter((d) => d.deviceType === normalizedType)
      : mockSecondaryDevices;
    const pool = candidates.length > 0 ? candidates : mockSecondaryDevices;
    const pick = pool[Math.floor(Math.random() * pool.length)];

    const newSession = {
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId: `dev-${Date.now()}`,
      deviceName: pick.deviceName,
      deviceType: pick.deviceType,
      browser: pick.browser,
      os: pick.os,
      ipAddress: pick.ipAddress,
      location: pick.location,
      loginTime: 'Just now',
      isCurrentSession: false,
      isPrimary: false,
    };

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const currentDevices = student.activeDevices || [];
        const updatedDevices = [...currentDevices, newSession];

        // If active devices > 1, create an active MULTIPLE_DEVICES flag
        let updatedHistory = student.flagsHistory || [];
        const hasActiveMultiDeviceFlag = updatedHistory.some(
          (f) => f.category === 'MULTIPLE_DEVICES' && f.status === 'ACTIVE'
        );

        if (!hasActiveMultiDeviceFlag) {
          const multiDeviceFlag: MalpracticeFlag = {
            id: `flg-${Date.now()}-${student.id}-multidev`,
            studentId: student.id,
            category: 'MULTIPLE_DEVICES',
            reason: `Multiple active devices logged into portal (${updatedDevices.length} devices: ${updatedDevices.map((d) => d.deviceName).join(', ')}). Only 1 active device allowed.`,
            flaggedBy: 'TalHelix Student Portal (Automated)',
            source: 'PORTAL_AUTO',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            status: 'ACTIVE',
            autoRevokeOnSingleDevice: true,
          };
          updatedHistory = [multiDeviceFlag, ...updatedHistory];
        }

        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: pick.ipAddress,
            userAgent: pick.browser,
            event: 'MULTIPLE_DEVICE_DETECTED',
            location: `New device login detected: ${pick.deviceName}. ${updatedDevices.length} total active devices.`,
            status: 'WARNING',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          activeDevices: updatedDevices,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Multiple devices detected! Integrity flag raised until secondary logins close.`, 'warning');
  };

  // Record Client-Side / Portal-Side Security Violation — synced to admin portal via shared students[] state
  const recordStudentViolation = (
    studentId: number,
    category: MalpracticeFlagCategory,
    reason: string,
    sessionId?: string
  ) => {
    const newFlag: MalpracticeFlag = {
      id: `flg-sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      reason,
      category,
      sessionId,
      flaggedBy: 'TalHelix Student Portal (Automated)',
      source: 'PORTAL_AUTO',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'ACTIVE',
    };

    setStudents((prev) => {
      // Robust sync: if passed studentId doesn't match any student (e.g., stale user.studentId), fallback to current user
      let targetId = studentId;
      let target = prev.find((s) => s.id === targetId);
      if (!target) {
        const byEmail = prev.find((s) => s.email.toLowerCase() === user.email.toLowerCase());
        if (byEmail) {
          targetId = byEmail.id;
          newFlag.studentId = targetId;
          target = byEmail;
        }
      }
      // If still not found, fallback to currentStudent derived from user
      if (!target) {
        console.warn(`[recordStudentViolation] No student found for id ${studentId} nor email ${user.email}; flag will be dropped. Ensure student exists in mockData.`);
        return prev;
      }

      return prev.map((student) => {
        if (student.id !== targetId) return student;

        const updatedHistory = [newFlag, ...(student.flagsHistory || [])];
        const activeFlagsCount = updatedHistory.filter((f) => f.status === 'ACTIVE').length;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: '127.0.0.1 (Client)',
            userAgent: 'TalHelix Exam Security Monitor',
            event: 'MALPRACTICE_FLAG_RECORDED',
            location: `Live Violation (${category}): ${reason}`,
            status: 'WARNING',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          flags: activeFlagsCount,
          flagsHistory: updatedHistory,
          activityLogs: newLogs,
        };
      });
    });
  };

  // Toggle student overall attendance
  const toggleStudentAttendance = (
    studentId: number,
    status: 'PRESENT' | 'ABSENT' | 'CHECKED_IN' | 'PENDING'
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: '10.0.0.1',
            userAgent: 'Admin Portal',
            event: 'ATTENDANCE_CHECKIN',
            location: `Attendance status updated to: ${status}`,
            status: status === 'ABSENT' ? 'WARNING' : 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          attendanceStatus: status,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Candidate attendance updated to ${status}`, 'info');
  };

  // Attendance-Gate Marker (Venue Proctor Check-in)
  const markStudentAttendance = (
    studentId: number,
    assignmentId: string,
    venueCode: string,
    markedBy?: string
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedAssignments = (student.assignments || []).map((asg) => {
          if (asg.id === assignmentId) {
            return {
              ...asg,
              attendanceStatus: 'VERIFIED' as const,
              attendanceVenue: venueCode,
              attendanceMarkedAt: new Date().toISOString(),
              attendanceMarkedBy: markedBy || user.name || 'Venue Proctor',
            };
          }
          return asg;
        });

        const newLogs: SecurityActivityLog[] = [
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            ipAddress: '192.168.1.100',
            userAgent: 'Venue Attendance Gate Kiosk',
            event: 'ATTENDANCE_CHECKIN',
            location: `Verified present at ${venueCode}`,
            status: 'SUCCESS',
          },
          ...(student.activityLogs || []),
        ];

        return {
          ...student,
          assignments: updatedAssignments,
          activityLogs: newLogs,
        };
      })
    );

    showToast(`Attendance verified for Venue ${venueCode}. Assessment unlocked.`, 'success');
  };

  const createAssessment = (assessmentData: Partial<Assessment>): Assessment => {
    const newAsm: Assessment = {
      id: `asm-${Date.now().toString().slice(-4)}`,
      title: assessmentData.title || 'Untitled Assessment',
      description: assessmentData.description || '',
      instructions: assessmentData.instructions || '',
      duration: assessmentData.duration || 60,
      passingScore: assessmentData.passingScore || 40,
      kind: assessmentData.kind || 'Standard — mixed MCQ / MSQ / Fill-in / Scenario',
      publishImmediately: assessmentData.publishImmediately ?? true,
      requireSafeExamBrowser: assessmentData.requireSafeExamBrowser ?? false,
      category: assessmentData.category || 'General',
      status: assessmentData.publishImmediately ? 'Published' : 'Draft',
      questionsCount: assessmentData.questions?.length || assessmentData.questionsCount || 1,
      createdAt: new Date().toISOString().split('T')[0],
      questions: assessmentData.questions || [],
    };

    setAssessments((prev) => [newAsm, ...prev]);
    setDashboardStats((prev) => ({
      ...prev,
      assessments: prev.assessments + 1,
      published: newAsm.status === 'Published' ? prev.published + 1 : prev.published,
      draft: newAsm.status === 'Draft' ? prev.draft + 1 : prev.draft,
    }));

    showToast(`Assessment "${newAsm.title}" created successfully`, 'success');
    return newAsm;
  };

  const duplicateAssessment = (id: string) => {
    const target = assessments.find((a) => a.id === id);
    if (!target) return;
    const duplicated: Assessment = {
      ...target,
      id: `asm-${Date.now().toString().slice(-4)}`,
      title: `${target.title} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAssessments((prev) => [duplicated, ...prev]);
    setDashboardStats((prev) => ({
      ...prev,
      assessments: prev.assessments + 1,
      draft: prev.draft + 1,
    }));
    showToast(`Duplicated "${target.title}" as draft`, 'success');
  };

  const deleteAssessment = (id: string) => {
    const target = assessments.find((a) => a.id === id);
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    if (target) {
      setDashboardStats((prev) => ({
        ...prev,
        assessments: Math.max(0, prev.assessments - 1),
        published: target.status === 'Published' ? Math.max(0, prev.published - 1) : prev.published,
        draft: target.status === 'Draft' ? Math.max(0, prev.draft - 1) : prev.draft,
      }));
    }
    showToast(`Assessment deleted`, 'info');
  };

  const createLibrary = (lib: { name: string; description: string; category?: string }) => {
    const newLib: QuestionLibrary = {
      id: `lib-${Date.now().toString().slice(-4)}`,
      name: lib.name,
      description: lib.description,
      questionCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      category: lib.category || 'General',
      questions: [],
    };
    setLibraries((prev) => [newLib, ...prev]);
    showToast(`Question Library "${newLib.name}" created`, 'success');
  };

  const deleteLibrary = (id: string) => {
    setLibraries((prev) => prev.filter((l) => l.id !== id));
    showToast(`Library removed`, 'info');
  };

  // --- Institution Batch Actions ---
  const addBatch = (batchData: Partial<Batch>): Batch => {
    const newBatch: Batch = {
      id: batchData.id || `batch-${Date.now().toString(36)}`,
      name: batchData.name || 'New Academic Batch',
      code: batchData.code || `BATCH-${Date.now().toString().slice(-4)}`,
      institutionId: batchData.institutionId || user.institutionId || 'inst-stanford',
      department: batchData.department || 'Computer Science & Engineering',
      academicYear: batchData.academicYear || 2026,
      semester: batchData.semester || 6,
      section: batchData.section || 'A',
      studentCount: batchData.studentCount || 0,
      assignedFacultyIds: batchData.assignedFacultyIds || [],
      assignedFacultyNames: batchData.assignedFacultyNames || [],
      scheduleWindows: batchData.scheduleWindows || [],
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      ...batchData,
    };
    setBatches((prev) => [newBatch, ...prev]);
    showToast(`Batch "${newBatch.name}" created successfully`, 'success');
    return newBatch;
  };

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    showToast(`Batch updated`, 'success');
  };

  const deleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    showToast(`Batch deleted`, 'info');
  };

  const assignStudentsToBatch = (batchId: string, studentIds: number[]) => {
    const targetBatch = batches.find((b) => b.id === batchId);
    if (!targetBatch) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (studentIds.includes(s.id)) {
          return {
            ...s,
            batchId,
            batchName: targetBatch.name,
            section: targetBatch.section,
          };
        }
        return s;
      })
    );

    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          return {
            ...b,
            studentCount: b.studentCount + studentIds.length,
          };
        }
        return b;
      })
    );

    showToast(`Assigned ${studentIds.length} student(s) to ${targetBatch.name}`, 'success');
  };

  // --- Staff / Faculty Actions ---
  const addStaffFaculty = (facultyData: Partial<StaffFaculty>): StaffFaculty => {
    const newFaculty: StaffFaculty = {
      id: facultyData.id || `fac-${Date.now().toString(36)}`,
      name: facultyData.name || 'New Faculty Member',
      email: facultyData.email || 'faculty@stanford.edu',
      employeeId: facultyData.employeeId || `FAC-${Date.now().toString().slice(-4)}`,
      institutionId: facultyData.institutionId || user.institutionId || 'inst-stanford',
      department: facultyData.department || 'Computer Science & Engineering',
      designation: facultyData.designation || 'Assistant Professor',
      role: facultyData.role || 'STAFF_FACULTY',
      phone: facultyData.phone || '+1 (650) 723-0000',
      assignedBatchIds: facultyData.assignedBatchIds || [],
      assignedBatchNames: facultyData.assignedBatchNames || [],
      assignedSubjects: facultyData.assignedSubjects || [],
      mobileAppAccess: facultyData.mobileAppAccess ?? true,
      apiKey: facultyData.apiKey || `th_live_fac_${Math.random().toString(36).substring(2, 10)}`,
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().split('T')[0],
      avatarColor: 'bg-indigo-600',
      ...facultyData,
    };
    setStaffFaculty((prev) => [newFaculty, ...prev]);
    showToast(`Faculty "${newFaculty.name}" added successfully`, 'success');
    return newFaculty;
  };

  const updateStaffFaculty = (id: string, updates: Partial<StaffFaculty>) => {
    setStaffFaculty((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    showToast(`Faculty profile updated`, 'success');
  };

  const deleteStaffFaculty = (id: string) => {
    setStaffFaculty((prev) => prev.filter((f) => f.id !== id));
    showToast(`Faculty removed`, 'info');
  };

  const toggleFacultyMobileAccess = (id: string, enabled: boolean) => {
    setStaffFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, mobileAppAccess: enabled } : f))
    );
    showToast(`Mobile marking access ${enabled ? 'enabled' : 'revoked'}`, enabled ? 'success' : 'warning');
  };

  const regenerateFacultyApiKey = (id: string): string => {
    const newKey = `th_live_fac_${Math.random().toString(36).substring(2, 12)}`;
    setStaffFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, apiKey: newKey } : f))
    );
    showToast(`API Key regenerated for mobile client integration`, 'info');
    return newKey;
  };

  // --- Attendance Record Actions (Web Manual, Mobile App, RFID) ---
  const markAttendanceRecord = (data: {
    studentId: number;
    batchId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    source?: AttendanceSource;
    remarks?: string;
    date?: string;
    sessionTimeWindow?: string;
    subjectName?: string;
  }) => {
    const targetStudent = students.find((s) => s.id === data.studentId);
    const targetBatch = batches.find((b) => b.id === data.batchId);
    const today = data.date || new Date().toISOString().split('T')[0];
    const source: AttendanceSource = data.source || 'web-manual';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      institutionId: user.institutionId || 'inst-stanford',
      batchId: data.batchId,
      batchName: targetBatch?.name || 'CS 2026 Cohort',
      studentId: data.studentId,
      studentName: targetStudent?.name || `Student #${data.studentId}`,
      registerNumber: targetStudent?.registerNumber || targetStudent?.studentIdentifier || `71002210400${data.studentId}`,
      netId: targetStudent?.netId || `student${data.studentId}`,
      studentEmail: targetStudent?.email || `student${data.studentId}@stanford.edu`,
      date: today,
      sessionTimeWindow: data.sessionTimeWindow || '09:00 - 10:30',
      subjectName: data.subjectName || 'Advanced Data Structures & Algorithms',
      status: data.status,
      source, // Reconciled marking channel
      markedAt: new Date().toISOString(),
      markedByUserId: user.employeeId || user.email,
      markedByName: user.name,
      venueRoom: 'Turing Hall 301',
      remarks: data.remarks || '',
      syncStatus: 'SYNCED',
    };

    setAttendanceRecords((prev) => {
      // Replace existing record for same student, batch, date and time window if present
      const filtered = prev.filter(
        (r) =>
          !(
            r.studentId === data.studentId &&
            r.batchId === data.batchId &&
            r.date === today &&
            r.sessionTimeWindow === newRecord.sessionTimeWindow
          )
      );
      return [newRecord, ...filtered];
    });

    // Also update student's general attendanceStatus
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === data.studentId) {
          return {
            ...s,
            attendanceStatus: data.status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
          };
        }
        return s;
      })
    );

    showToast(`Marked ${targetStudent?.name || 'Student'} as ${data.status} (${source})`, 'success');
  };

  const bulkMarkAttendance = (
    records: Array<{ studentId: number; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; remarks?: string }>,
    batchId: string,
    date?: string,
    sessionTimeWindow?: string,
    source: AttendanceSource = 'web-manual'
  ) => {
    const today = date || new Date().toISOString().split('T')[0];
    const targetBatch = batches.find((b) => b.id === batchId);

    const newRecords: AttendanceRecord[] = records.map((r, idx) => {
      const student = students.find((s) => s.id === r.studentId);
      return {
        id: `att-bulk-${Date.now()}-${idx}`,
        institutionId: user.institutionId || 'inst-stanford',
        batchId,
        batchName: targetBatch?.name || 'Academic Batch',
        studentId: r.studentId,
        studentName: student?.name || `Student #${r.studentId}`,
        registerNumber: student?.registerNumber || student?.studentIdentifier || `71002210400${r.studentId}`,
        netId: student?.netId || `student${r.studentId}`,
        studentEmail: student?.email || `student${r.studentId}@stanford.edu`,
        date: today,
        sessionTimeWindow: sessionTimeWindow || '09:00 - 10:30',
        subjectName: 'Advanced Data Structures & Algorithms',
        status: r.status,
        source,
        markedAt: new Date().toISOString(),
        markedByUserId: user.employeeId || user.email,
        markedByName: user.name,
        venueRoom: 'Turing Hall 301',
        remarks: r.remarks || '',
        syncStatus: 'SYNCED',
      };
    });

    setAttendanceRecords((prev) => [...newRecords, ...prev]);

    // Update students attendanceStatus
    setStudents((prev) =>
      prev.map((s) => {
        const matchingRecord = records.find((r) => r.studentId === s.id);
        if (matchingRecord) {
          return {
            ...s,
            attendanceStatus: matchingRecord.status === 'PRESENT' ? 'PRESENT' : 'ABSENT',
          };
        }
        return s;
      })
    );

    showToast(`Bulk attendance saved: ${newRecords.length} records processed (${source})`, 'success');
  };

  // --- Announcements Actions ---
  const addAnnouncement = (announcement: Partial<InstitutionAnnouncement>): InstitutionAnnouncement => {
    const newAnn: InstitutionAnnouncement = {
      id: `ann-${Date.now().toString(36)}`,
      institutionId: user.institutionId || 'inst-stanford',
      title: announcement.title || 'New Notice',
      content: announcement.content || '',
      targetAudience: announcement.targetAudience || 'ALL',
      priority: announcement.priority || 'NORMAL',
      publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      authorName: user.name,
      authorRole: user.role || 'Institution Administrator',
      expiresAt: announcement.expiresAt,
      pinned: announcement.pinned || false,
      attachmentName: announcement.attachmentName,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    showToast(`Notice published: "${newAnn.title}"`, 'success');
    return newAnn;
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast(`Notice deleted`, 'info');
  };

  // --- Live Batch Query Helper ---
  const getLiveBatchForFaculty = (facultyId?: string) => {
    const fid = facultyId || (user.userType === 'faculty' ? user.employeeId || 'fac-101' : 'fac-101');
    const assignedBatches = batches.filter((b) => b.assignedFacultyIds.includes(fid));
    const firstBatch = assignedBatches[0] || batches[0];
    const liveWindow = firstBatch?.scheduleWindows?.[0] || null;

    return {
      isLive: true,
      schedule: liveWindow,
      batch: firstBatch || null,
    };
  };

  // --- Mobile App API Sync Dataset Helper ---
  const getMobileSyncDataset = (facultyId?: string): MobileSyncDataset => {
    const fid = facultyId || 'fac-101';
    const targetFaculty = staffFaculty.find((f) => f.id === fid) || staffFaculty[0];

    const facultyBatches = batches.filter((b) => b.assignedFacultyIds.includes(fid) || b.id === 'batch-cs-26a');

    return {
      apiContractVersion: 'v1.2.0',
      syncTimestamp: new Date().toISOString(),
      faculty: {
        id: targetFaculty.id,
        name: targetFaculty.name,
        email: targetFaculty.email,
        employeeId: targetFaculty.employeeId,
        role: targetFaculty.role,
        department: targetFaculty.department,
      },
      institution: {
        id: targetFaculty.institutionId,
        name: 'Stanford University',
        code: 'STANFORD',
        serverTimezone: 'America/Los_Angeles',
      },
      assignedBatches: facultyBatches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        department: b.department,
        section: b.section,
        studentCount: students.filter((s) => s.batchId === b.id).length || b.studentCount,
        schedules: b.scheduleWindows,
        students: students
          .filter((s) => s.batchId === b.id || b.id === 'batch-cs-26a')
          .map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            registerNumber: s.registerNumber || s.studentIdentifier || `71002210400${s.id}`,
            netId: s.netId || `net-${s.id}`,
            section: s.section || b.section,
            avatarColor: s.avatarColor || 'bg-blue-600',
            recentAttendancePercentage: s.academicRecord?.attendancePercentage || 92.0,
          })),
      })),
      liveScheduleRightNow: {
        isLive: true,
        batchId: facultyBatches[0]?.id || 'batch-cs-26a',
        batchName: facultyBatches[0]?.name || 'CS 2026 - Section A',
        subjectCode: facultyBatches[0]?.scheduleWindows[0]?.subjectCode || 'CS301',
        subjectName: facultyBatches[0]?.scheduleWindows[0]?.subjectName || 'Advanced Data Structures',
        startTime: facultyBatches[0]?.scheduleWindows[0]?.startTime || '09:00',
        endTime: facultyBatches[0]?.scheduleWindows[0]?.endTime || '10:30',
        venueRoom: facultyBatches[0]?.scheduleWindows[0]?.venueRoom || 'Turing Hall 301',
      },
      supportedMarkingSources: ['mobile-app', 'web-manual', 'rfid'],
    };
  };

  // --- Update Student Profile & CSV Import ---
  const updateStudentProfile = (id: number, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast(`Student profile updated`, 'success');
  };

  const importStudentsFromCSV = (importedList: Array<Partial<Student>>): { imported: number; errors: string[] } => {
    const errors: string[] = [];
    let count = 0;

    const newStudents: Student[] = importedList.map((item, index) => {
      count++;
      const nextId = Math.max(...students.map((s) => s.id), 0) + index + 1;
      return {
        id: nextId,
        name: item.name || `Student ${nextId}`,
        email: item.email || `student${nextId}@stanford.edu`,
        studentIdentifier: item.studentIdentifier || item.registerNumber || `SU-${nextId}`,
        registerNumber: item.registerNumber || `7100221040${nextId}`,
        netId: item.netId || `stud${nextId}`,
        dept: item.dept || 'Computer Science',
        batchId: item.batchId || 'batch-cs-26a',
        batchName: item.batchName || 'CS 2026 - Section A',
        section: item.section || 'A',
        batchYear: item.batchYear || 2026,
        progress: 0,
        total: 10,
        score: 0,
        status: (item.status as any) || 'Active',
        attendanceStatus: 'PENDING',
        flags: 0,
        lastActive: 'Never',
        avatarColor: 'bg-blue-600',
        joinedDate: new Date().toISOString().split('T')[0],
        phone: item.phone || '+1 (650) 000-0000',
        activeDevices: [],
        assignments: [],
      };
    });

    setStudents((prev) => [...prev, ...newStudents]);
    showToast(`Successfully imported ${newStudents.length} students via CSV`, 'success');
    return { imported: newStudents.length, errors };
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigateTo,
        user,
        login,
        logout,
        switchRole,
        institutions,
        selectedInstitutionId,
        setSelectedInstitutionId,
        students,
        addStudent,
        updateStudentProfile,
        importStudentsFromCSV,
        deleteStudent,
        updateStudentStatus,
        assignAssessmentToStudents,
        revokeStudentAssignment,
        reinstateStudentAssignment,
        addStudentFlag,
        resolveStudentFlag,
        deleteStudentFlag,
        batchFlagStudents,
        terminateStudentDeviceSession,
        terminateAllOtherDeviceSessions,
        simulateAddDeviceSession,
        recordStudentViolation,
        toggleStudentAttendance,
        markStudentAttendance,
        assessments,
        createAssessment,
        duplicateAssessment,
        deleteAssessment,
        libraries,
        createLibrary,
        deleteLibrary,
        dashboardStats,
        studentStats,
        activityFeed,
        studentReports,
        submitStudentAssessment,
        toasts,
        showToast,
        removeToast,
        batches,
        addBatch,
        updateBatch,
        deleteBatch,
        assignStudentsToBatch,
        staffFaculty,
        addStaffFaculty,
        updateStaffFaculty,
        deleteStaffFaculty,
        toggleFacultyMobileAccess,
        regenerateFacultyApiKey,
        attendanceRecords,
        markAttendanceRecord,
        bulkMarkAttendance,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        getLiveBatchForFaculty,
        getMobileSyncDataset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
