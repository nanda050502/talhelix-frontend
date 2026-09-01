import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserLookupHeader } from './UserLookupHeader';
import { UserProfileCard } from './UserProfileCard';
import { AssignmentsTable } from './AssignmentsTable';
import { CodingAssessmentsList } from './CodingAssessmentsList';
import { StudentFlagsSection } from './StudentFlagsSection';
import { RevokeMalpracticeModal } from './RevokeMalpracticeModal';
import { AssessmentDetailModal } from './AssessmentDetailModal';
import {
  StudentAssignment,
  Student,
  MalpracticeFlagCategory,
} from '../../types';
import {
  FileText,
  Table,
  Code,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    students,
    revokeStudentAssignment,
    reinstateStudentAssignment,
    addStudentFlag,
    resolveStudentFlag,
    deleteStudentFlag,
    showToast,
  } = useApp();

  // Selected student state - defaults to Nanda Kumar (nanda@talhelix.com) or first student
  const [emailInput, setEmailInput] = useState('nanda@talhelix.com');
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>('nanda@talhelix.com');

  // Active view tab in the assessment section
  const [activeTab, setActiveTab] = useState<'ALL_ASSIGNMENTS' | 'CODING_SUBMISSIONS' | 'INTEGRITY_FLAGS'>('ALL_ASSIGNMENTS');

  // Filter within candidate's assessments
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUBMITTED' | 'REVOKED'>('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');

  // Modals state
  const [revokingAssignment, setRevokingAssignment] = useState<StudentAssignment | null>(null);
  const [inspectingAssignment, setInspectingAssignment] = useState<StudentAssignment | null>(null);

  // Find currently selected student
  const currentStudent = useMemo(() => {
    const found = students.find(
      (s) => s.email.toLowerCase() === selectedStudentEmail.toLowerCase()
    );
    return found || students[0];
  }, [students, selectedStudentEmail]);

  // Handle email search / lookup
  const handleSearch = (emailToFind?: string) => {
    const targetEmail = (emailToFind || emailInput).trim().toLowerCase();
    const matched = students.find(
      (s) =>
        s.email.toLowerCase() === targetEmail ||
        s.name.toLowerCase().includes(targetEmail)
    );

    if (matched) {
      setSelectedStudentEmail(matched.email);
      setEmailInput(matched.email);
      showToast(`Loaded candidate profile for ${matched.name}`, 'info');
    } else {
      showToast(`No student record found for "${targetEmail}"`, 'error');
    }
  };

  // Filter candidate's assignments
  const filteredAssignments = useMemo(() => {
    if (!currentStudent || !currentStudent.assignments) return [];

    return currentStudent.assignments.filter((asg) => {
      // Search text
      if (assignmentSearch.trim()) {
        const query = assignmentSearch.toLowerCase();
        const matchesTitle = asg.assessmentTitle.toLowerCase().includes(query);
        const matchesUuid = (asg.assessmentUuid || asg.id).toLowerCase().includes(query);
        if (!matchesTitle && !matchesUuid) return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE') {
        if (asg.status !== 'ACTIVE' || asg.sessionStatus === 'revoked') return false;
      } else if (statusFilter === 'SUBMITTED') {
        if (asg.sessionStatus !== 'submitted' && asg.status !== 'COMPLETED') return false;
      } else if (statusFilter === 'REVOKED') {
        if (asg.status !== 'REVOKED' && asg.sessionStatus !== 'revoked') return false;
      }

      // Attendance filter
      if (attendanceFilter === 'PRESENT') {
        if (asg.attendanceStatus !== 'VERIFIED' && asg.attendanceStatus !== 'CONSUMED') return false;
      } else if (attendanceFilter === 'ABSENT') {
        if (asg.attendanceStatus !== 'ABSENT') return false;
      }

      return true;
    });
  }, [currentStudent, assignmentSearch, statusFilter, attendanceFilter]);

  // Malpractice / Revocation execution handler
  const handleConfirmRevoke = (
    assignmentId: string,
    reason: string,
    isMalpractice: boolean,
    malpracticeCategory: MalpracticeFlagCategory,
    simulateTenantError?: boolean
  ) => {
    if (simulateTenantError) {
      showToast('Unassign failed: assessment not found or does not belong to tenant', 'error');
      setRevokingAssignment(null);
      return;
    }

    if (currentStudent) {
      revokeStudentAssignment(
        currentStudent.id,
        assignmentId,
        reason,
        isMalpractice,
        malpracticeCategory
      );
    }
    setRevokingAssignment(null);
  };

  // Reinstate assignment handler
  const handleReinstateAssignment = (assignmentId: string) => {
    if (currentStudent && reinstateStudentAssignment) {
      reinstateStudentAssignment(currentStudent.id, assignmentId);
    }
  };

  // Export report summary
  const handleExportSummary = () => {
    showToast(`Exported full assessment report for ${currentStudent.name} (CSV)`, 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Top Global User Lookup Header */}
      <UserLookupHeader
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        onSearch={handleSearch}
        students={students}
      />

      {currentStudent && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 2. User Profile Card & TalHelix Portal Details */}
          <UserProfileCard
            student={currentStudent}
            onChangeEmail={() => {
              const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (inputEl) inputEl.focus();
            }}
            onOpenFlagModal={() => setActiveTab('INTEGRITY_FLAGS')}
            onViewMalpracticeLogs={() => setActiveTab('INTEGRITY_FLAGS')}
            showToast={showToast}
          />

          {/* 3. Assessment Section with Header & View Tabs */}
          <div className="space-y-4">
            {/* Header matching screenshot: "Assignments (20)" */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Assignments ({currentStudent.assignments?.length || 0})
                </h2>

                {/* View Switcher Tabs */}
                <div className="inline-flex p-1 bg-slate-100/90 rounded-lg border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('ALL_ASSIGNMENTS')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'ALL_ASSIGNMENTS'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Assignments Table</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('CODING_SUBMISSIONS')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'CODING_SUBMISSIONS'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 text-purple-600" />
                    <span>Coding Transcripts</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('INTEGRITY_FLAGS')}
                    className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'INTEGRITY_FLAGS'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert
                      className={`w-3.5 h-3.5 ${
                        (currentStudent.flagsHistory || []).some((f) => f.status === 'ACTIVE')
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    />
                    <span>
                      Integrity Flags (
                      {(currentStudent.flagsHistory || []).filter((f) => f.status === 'ACTIVE').length}
                      )
                    </span>
                  </button>
                </div>
              </div>

              {/* Export transcript */}
              <button
                onClick={handleExportSummary}
                className="self-start sm:self-auto px-3.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Report</span>
              </button>
            </div>

            {/* Filter Bar (Only for Table and Coding views) */}
            {activeTab !== 'INTEGRITY_FLAGS' && (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                {/* Search in assignments */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    placeholder="Search by test name or UUID..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs placeholder:text-slate-400"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active / Pending</option>
                      <option value="SUBMITTED">Submitted / Done</option>
                      <option value="REVOKED">Revoked / Malpractice</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Attendance:</span>
                    <select
                      value={attendanceFilter}
                      onChange={(e) => setAttendanceFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALL">All Attendance</option>
                      <option value="PRESENT">Present (Verified)</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>

                  {(assignmentSearch || statusFilter !== 'ALL' || attendanceFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setAssignmentSearch('');
                        setStatusFilter('ALL');
                        setAttendanceFilter('ALL');
                      }}
                      className="text-slate-500 hover:text-slate-900 px-2 py-1 underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* View Content */}
            {activeTab === 'ALL_ASSIGNMENTS' && (
              <AssignmentsTable
                assignments={filteredAssignments}
                onOpenRevokeModal={(asg) => setRevokingAssignment(asg)}
                onReinstate={handleReinstateAssignment}
                onViewDetails={(asg) => setInspectingAssignment(asg)}
              />
            )}

            {activeTab === 'CODING_SUBMISSIONS' && (
              <CodingAssessmentsList
                assignments={filteredAssignments}
                onSelectAssignment={(asg) => setInspectingAssignment(asg)}
                onOpenRevokeModal={(asg) => setRevokingAssignment(asg)}
              />
            )}

            {activeTab === 'INTEGRITY_FLAGS' && (
              <StudentFlagsSection
                student={currentStudent}
                onAddFlag={(flagData) => {
                  addStudentFlag(currentStudent.id, flagData);
                  showToast('Integrity violation added to candidate record', 'warning');
                }}
                onResolveFlag={(flagId, notes, action) => {
                  resolveStudentFlag(currentStudent.id, flagId, notes, action);
                  showToast(`Flag marked as ${action || 'RESOLVE'}`, 'success');
                }}
                onDeleteFlag={(flagId, reason) => {
                  deleteStudentFlag(currentStudent.id, flagId, reason);
                  showToast('Flag removed from record', 'info');
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Revocation & Malpractice Modal */}
      {revokingAssignment && currentStudent && (
        <RevokeMalpracticeModal
          assignment={revokingAssignment}
          studentName={currentStudent.name}
          studentId={currentStudent.id}
          onClose={() => setRevokingAssignment(null)}
          onConfirmRevoke={handleConfirmRevoke}
        />
      )}

      {/* Assessment Detail & Scorecard Modal */}
      {inspectingAssignment && currentStudent && (
        <AssessmentDetailModal
          assignment={inspectingAssignment}
          studentName={currentStudent.name}
          onClose={() => setInspectingAssignment(null)}
          onOpenRevoke={(asg) => {
            setInspectingAssignment(null);
            setRevokingAssignment(asg);
          }}
        />
      )}
    </div>
  );
};
