import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Student, MalpracticeFlag, MalpracticeFlagCategory } from '../../types';
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Building2,
  Clock,
  PlusCircle,
  FileText,
  Activity,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  AlertCircle,
  Flag,
  Trash2,
  RotateCcw,
  Monitor,
  Laptop,
  Smartphone,
  LogOut,
  UserCheck,
  XCircle,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StudentDetailPageProps {
  studentId: number;
  onBack: () => void;
}

export const StudentDetailPage: React.FC<StudentDetailPageProps> = ({
  studentId,
  onBack,
}) => {
  const {
    students,
    institutions,
    assessments,
    assignAssessmentToStudents,
    revokeStudentAssignment,
    markStudentAttendance,
    toggleStudentAttendance,
    terminateStudentDeviceSession,
    terminateAllOtherDeviceSessions,
    simulateAddDeviceSession,
    addStudentFlag,
    resolveStudentFlag,
    deleteStudentFlag,
    showToast,
  } = useApp();

  const student = students.find((s) => s.id === studentId);

  // Tab State
  const [activeTab, setActiveTab] = useState<'assessments' | 'flags' | 'devices' | 'security' | 'profile'>('assessments');

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [addFlagModalOpen, setAddFlagModalOpen] = useState(false);
  const [resolveFlagModalTarget, setResolveFlagModalTarget] = useState<MalpracticeFlag | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);

  // Form States - Assign
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [validUntilDate, setValidUntilDate] = useState('');
  const [attendanceGateEnabled, setAttendanceGateEnabled] = useState(true);

  // Form States - Add Flag
  const [flagCategory, setFlagCategory] = useState<MalpracticeFlagCategory>('TAB_SWITCH');
  const [flagReason, setFlagReason] = useState('');
  const [flagSessionId, setFlagSessionId] = useState('');

  // Form States - Resolve Flag
  const [resolutionAction, setResolutionAction] = useState<'RESOLVE' | 'DISMISS'>('RESOLVE');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Form States - Attendance
  const [targetAssignmentId, setTargetAssignmentId] = useState<string>('');
  const [venueCode, setVenueCode] = useState('MAIN-LAB-101');
  const [proctorName, setProctorName] = useState('Admin Proctor');

  // Form States - Revocation
  const [targetRevokeAssignment, setTargetRevokeAssignment] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState('Candidate reschedule request');

  // Expand/Collapse for Assigned Assessments — all collapsed by default, click header to toggle
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());
  const toggleAssignmentExpanded = (id: string) => {
    setExpandedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!student) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Candidate Record Not Found</h2>
        <p className="text-xs text-slate-500">The candidate profile could not be loaded or was removed.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const institution = institutions.find((i) => i.id === student.institutionId) || institutions[0];
  const domain = student.email.split('@')[1] || '';
  const isDomainVerified = institution.domains.some((d) => domain.toLowerCase().endsWith(d.toLowerCase()));

  const assignments = student.assignments || [];
  const flagsHistory = student.flagsHistory || [];
  const activityLogs = student.activityLogs || [];
  const activeFlagsCount = student.flags || 0;
  const activeDevices = student.activeDevices || [];
  const isMultiDevice = activeDevices.length > 1;
  const currentAttendance = student.attendanceStatus || 'PENDING';

  // Handlers
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentId) {
      showToast('Please select an assessment blueprint', 'error');
      return;
    }

    assignAssessmentToStudents(
      [student.id],
      [selectedAssessmentId],
      validUntilDate || undefined,
      attendanceGateEnabled
    );
    setAssignModalOpen(false);
    setSelectedAssessmentId('');
  };

  const handleAddFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagReason.trim()) {
      showToast('Please provide observation notes for the flag', 'error');
      return;
    }
    addStudentFlag(student.id, {
      category: flagCategory,
      reason: flagReason.trim(),
      sessionId: flagSessionId.trim() || undefined,
    });
    setAddFlagModalOpen(false);
    setFlagReason('');
    setFlagSessionId('');
  };

  const handleResolveFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveFlagModalTarget) return;
    resolveStudentFlag(
      student.id,
      resolveFlagModalTarget.id,
      resolutionNotes.trim(),
      resolutionAction
    );
    setResolveFlagModalTarget(null);
    setResolutionNotes('');
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssignmentId || !venueCode.trim()) {
      showToast('Please specify venue code and assignment', 'error');
      return;
    }
    markStudentAttendance(student.id, targetAssignmentId, venueCode.trim(), proctorName.trim());
    setAttendanceModalOpen(false);
  };

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRevokeAssignment) return;
    revokeStudentAssignment(
      student.id,
      targetRevokeAssignment.id,
      revokeReason
    );
    setRevokeModalOpen(false);
    setTargetRevokeAssignment(null);
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Smartphone className="w-4 h-4" />;
      case 'desktop':
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  const getFlagCategoryBadge = (category: MalpracticeFlagCategory) => {
    switch (category) {
      case 'MULTIPLE_DEVICES':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">Multiple Devices</span>;
      case 'TAB_SWITCH':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">Tab Switch</span>;
      case 'FULLSCREEN_EXIT':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">Full-Screen Exit</span>;
      case 'MULTIPLE_FACES':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">Multiple Faces</span>;
      case 'AUDIO_DETECTED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">Voice / Audio</span>;
      case 'UNAUTHORIZED_DEVICE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">Device Anomaly</span>;
      case 'SEB_BREACH':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">SEB Breach</span>;
      case 'IMPERSONATION':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">Biometric Mismatch</span>;
      case 'COPY_PASTE_VIOLATION':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800">Copy / Paste</span>;
      case 'MANUAL_PROCTOR':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">Manual Proctor</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">{category}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">ID #{student.id}</span>
          <div className="h-4 w-px bg-slate-200" />
          <Badge status={student.status} />
        </div>
      </div>

      {/* Candidate Profile Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl ${
                student.avatarColor || 'bg-blue-600'
              } text-white font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0`}
            >
              {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {student.studentIdentifier || `ID-${student.id}`}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{student.institutionName}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.email}</span>
                  {isDomainVerified ? (
                    <span className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                      ✓ Domain Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                      ! External Domain
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>{student.dept} (Class of {student.batchYear})</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Active: <strong className="text-slate-700 font-semibold">{student.lastActive}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Status & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            {/* Live Attendance Read-Only Status */}
            <div className="border border-slate-200 bg-slate-50 px-3.5 py-2 rounded-lg text-center">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Attendance</p>
              <div className="text-sm font-bold mt-0.5">
                {currentAttendance === 'PRESENT' || currentAttendance === 'CHECKED_IN' ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Present</span>
                  </span>
                ) : currentAttendance === 'ABSENT' ? (
                  <span className="text-rose-700 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Absent</span>
                  </span>
                ) : (
                  <span className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pending</span>
                  </span>
                )}
              </div>
            </div>

            {/* Active Devices Controller */}
            <div className={`border px-3.5 py-2 rounded-lg text-center flex items-center gap-2.5 ${
              isMultiDevice ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Active Devices</p>
                <div className={`text-sm font-bold font-mono ${
                  isMultiDevice ? 'text-rose-700' : 'text-slate-900'
                }`}>
                  {activeDevices.length} {activeDevices.length === 1 ? 'Device' : 'Devices'}
                </div>
              </div>
              {isMultiDevice && (
                <button
                  onClick={() => terminateAllOtherDeviceSessions(student.id)}
                  className="px-2 py-1 text-xs font-bold bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Kill Others
                </button>
              )}
            </div>

            {/* Integrity / Malpractice Flags Status Card */}
            <div className={`border px-3.5 py-2 rounded-lg text-center flex items-center gap-3 ${
              activeFlagsCount > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Active Flags</p>
                <div className={`text-lg font-bold font-mono ${
                  activeFlagsCount > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {activeFlagsCount} <span className="text-xs font-normal text-slate-500">{activeFlagsCount === 1 ? 'flag' : 'flags'}</span>
                </div>
              </div>
              <button
                onClick={() => setAddFlagModalOpen(true)}
                className="px-2.5 py-1 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Flag className="w-3 h-3 text-amber-600" />
                <span>Record Flag</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (assessments.length > 0) {
                  setSelectedAssessmentId(assessments[0].id);
                }
                setAssignModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-xs hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Assessment</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Completed Assessments</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {assignments.filter((a) => a.status === 'COMPLETED').length} / {assignments.length}
            </p>
          </div>
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Avg. Benchmark Score</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">
              {student.score}%
            </p>
          </div>
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Proctoring Status</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {activeFlagsCount === 0 ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Verified Clear</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700">{activeFlagsCount} Flag(s) Under Review</span>
                </>
              )}
            </div>
          </div>
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Active Device Policy</p>
            <p className="text-xs font-bold text-slate-800 truncate mt-1">
              {isMultiDevice ? '⚠️ Multi-Device Alert' : '✓ 1 Authorized Device'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 flex flex-wrap gap-6">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'assessments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assigned Assessments ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'flags'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flag className="w-4 h-4 text-amber-600" />
          <span>Malpractice & Proctor Flags ({flagsHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'devices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Active Device Sessions ({activeDevices.length})</span>
          {isMultiDevice && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security & Proctor Logs ({activityLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Candidate Metadata</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ASSESSMENTS LIST */}
      {/* ======================================================== */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Assigned Assessment Blueprints</h2>
              <p className="text-xs text-slate-500">Scheduled test instances, attendance gates, and live execution run history.</p>
            </div>

            <button
              onClick={() => {
                if (assessments.length > 0) {
                  setSelectedAssessmentId(assessments[0].id);
                }
                setAssignModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Assign New Assessment</span>
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">No assessments assigned to candidate yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Assign an assessment blueprint to generate candidate-specific runtime sessions and proctoring channels.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((asg) => {
                const isCompleted = asg.status === 'COMPLETED';
                const isRevoked = asg.status === 'REVOKED';
                const hasAttempts = asg.attempts && asg.attempts.length > 0;
                const isExpanded = expandedAssignments.has(asg.id);

                return (
                  <div
                    key={asg.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isRevoked
                        ? 'bg-slate-50/50 border-slate-200 opacity-75'
                        : isCompleted
                        ? 'bg-white border-emerald-200 shadow-2xs'
                        : 'bg-white border-slate-200 shadow-xs'
                    } ${isExpanded ? 'ring-1 ring-blue-100' : 'hover:border-slate-300'}`}
                  >
                    {/* Clickable header — expands/collapses complete detail */}
                    <div
                      onClick={() => toggleAssignmentExpanded(asg.id)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/40 transition-colors"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleAssignmentExpanded(asg.id);
                        }
                      }}
                      aria-expanded={isExpanded}
                      title={isExpanded ? 'Click to minimize' : 'Click to expand and view complete details'}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{asg.assessmentTitle}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                              asg.status === 'ACTIVE'
                                ? 'bg-blue-100 text-blue-800'
                                : asg.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : asg.status === 'REVOKED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {asg.status}
                          </span>
                          {!isExpanded && hasAttempts && (
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {asg.attempts.length} run{asg.attempts.length !== 1 ? 's' : ''} • Click to expand
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 ml-9">
                          <span>Assigned: {new Date(asg.assignedAt).toLocaleDateString()}</span>
                          {asg.validUntil && <span>• Valid Until: {new Date(asg.validUntil).toLocaleDateString()}</span>}
                          <span>• {asg.duration} Mins</span>
                          {!isExpanded && isRevoked && asg.revocationReason && (
                            <span className="text-rose-600 font-medium truncate max-w-[200px]">• Revoked: {asg.revocationReason}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-9 sm:ml-0" onClick={(e) => e.stopPropagation()}>
                        {asg.attendanceGated && asg.attendanceStatus !== 'VERIFIED' && asg.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setTargetAssignmentId(asg.id);
                              setAttendanceModalOpen(true);
                            }}
                            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Unlock Attendance Gate</span>
                          </button>
                        )}

                        {asg.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setTargetRevokeAssignment(asg);
                              setRevokeModalOpen(true);
                            }}
                            className="text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200 transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}

                        <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${isExpanded ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                          {isExpanded ? 'Minimize' : 'View Details'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible complete detail — expanded only */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-100 bg-slate-50/20 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Revocation audit info if revoked */}
                        {isRevoked && asg.revocationReason && (
                          <div className="mt-4 p-3 bg-red-100/60 rounded-lg border border-red-200 text-xs text-red-800 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Assignment Revoked by {asg.revokedBy || 'Admin'}</span>
                            </div>
                            <p className="text-red-700 pl-5.5 font-mono">Reason: {asg.revocationReason}</p>
                            {asg.revokedAt && <p className="text-red-600 pl-5.5 text-xs">At: {new Date(asg.revokedAt).toLocaleString()} {asg.revokedBy ? `• By: ${asg.revokedBy}` : ''}</p>}
                          </div>
                        )}

                        {/* Assignment meta when expanded */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-slate-500 font-medium">Assessment ID</p>
                            <p className="font-mono font-semibold text-slate-800 truncate">{asg.assessmentId}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-slate-500 font-medium">Attendance</p>
                            <p className={`font-bold ${asg.attendanceStatus === 'VERIFIED' || asg.attendanceStatus === 'CONSUMED' ? 'text-emerald-600' : asg.attendanceStatus === 'PENDING_CHECKIN' ? 'text-amber-600' : 'text-slate-800'}`}>{asg.attendanceStatus}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-slate-500 font-medium">Window</p>
                            <p className="font-semibold text-slate-800">{asg.windowLabel || 'anytime'}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-slate-500 font-medium">Assigned By</p>
                            <p className="font-semibold text-slate-800 truncate">{asg.assignedBy || 'Admin'}</p>
                          </div>
                        </div>

                        {/* Attempt Results Table */}
                        {hasAttempts ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Exam Instance Runs ({asg.attempts.length})</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3">Session ID</th>
                                    <th className="py-2.5 px-3">Score</th>
                                    <th className="py-2.5 px-3">Result</th>
                                    <th className="py-2.5 px-3">Proctor Verdict</th>
                                    <th className="py-2.5 px-3">Duration</th>
                                    <th className="py-2.5 px-3">Venue / Terminal</th>
                                    <th className="py-2.5 px-3 text-right">Submitted</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {asg.attempts.map((att) => (
                                    <tr key={att.sessionId} className="hover:bg-slate-50">
                                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">{att.sessionId}</td>
                                      <td className="py-2.5 px-3 font-bold text-slate-900">
                                        {att.score}/{att.maxScore} ({att.percentage}%)
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span
                                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {att.passed ? 'PASS' : 'FAIL'}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                                            att.proctorVerdict === 'CLEAR'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : att.proctorVerdict === 'SUSPICIOUS'
                                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                                          }`}
                                        >
                                          {att.proctorVerdict === 'CLEAR' ? (
                                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                                          )}
                                          {att.proctorVerdict}
                                          {att.flagsRecorded > 0 && ` (${att.flagsRecorded} flags)`}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-500">{att.timeSpent}</td>
                                      <td className="py-2.5 px-3 text-slate-600">{att.venueCode || 'Online'}</td>
                                      <td className="py-2.5 px-3 text-right text-slate-400">{new Date(att.submittedAt).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-slate-600">No exam runs yet</p>
                            <p className="text-xs text-slate-400">Candidate has not started this assessment.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MALPRACTICE & PROCTOR FLAGS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'flags' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Malpractice & Proctoring Flag History</h2>
              <p className="text-xs text-slate-500">
                AI and human proctor integrity observations, active infraction statuses, and resolution audit records.
              </p>
            </div>

            <button
              onClick={() => setAddFlagModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Record New Flag</span>
            </button>
          </div>

          {flagsHistory.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">No Malpractice Flags on Record</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Candidate holds a clean proctoring record with 0 active infractions across all assessment sessions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Flag ID</th>
                    <th className="py-3 px-4">Infraction Category</th>
                    <th className="py-3 px-4">Session</th>
                    <th className="py-3 px-4">Proctor Observation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Flagged At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flagsHistory.map((flag) => {
                    const isActive = flag.status === 'ACTIVE';

                    return (
                      <tr key={flag.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">{flag.id}</td>
                        <td className="py-3 px-4">
                          {getFlagCategoryBadge(flag.category)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {flag.sessionId || 'Global Profile'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1 max-w-md">
                            <p className="text-slate-800 font-medium">{flag.reason}</p>
                            <p className="text-xs text-slate-400">By {flag.flaggedBy}</p>
                            {flag.resolutionNotes && (
                              <div className="text-xs text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-mono">
                                Resolution: {flag.resolutionNotes} (by {flag.resolvedBy})
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              flag.status === 'ACTIVE'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : flag.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {flag.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                          {flag.timestamp}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isActive && (
                              <button
                                onClick={() => setResolveFlagModalTarget(flag)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              onClick={() => deleteStudentFlag(student.id, flag.id)}
                              title="Delete record"
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ACTIVE DEVICE SESSIONS & MULTI-DEVICE LOCKDOWN */}
      {/* ======================================================== */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Device Sessions & Multi-Device Control</h2>
              <p className="text-xs text-slate-500">
                Enforcing strict single-device policy. Candidates cannot take tests simultaneously from multiple browsers or hardware.
              </p>
            </div>

            {isMultiDevice && (
              <button
                onClick={() => terminateAllOtherDeviceSessions(student.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect All Other Devices</span>
              </button>
            )}
          </div>

          {/* Device policy callout */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isMultiDevice
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isMultiDevice ? 'text-rose-600' : 'text-emerald-600'}`} />
            <div>
              <p className="font-bold text-sm">
                {isMultiDevice
                  ? `Security Alert: Multi-Device Violation Active (${activeDevices.length} Connected)`
                  : 'Single Device Policy Satisfied'}
              </p>
              <p className="text-xs mt-1 leading-relaxed">
                {isMultiDevice
                  ? 'Candidate is currently authenticated on more than one active browser or device. The system has automatically generated a Malpractice Integrity Flag. The candidate must close extraneous sessions or proctors must terminate secondary sessions to clear the flag.'
                  : 'Only 1 active browser session is connected. If the candidate attempts to log into the candidate portal on another phone or computer, an automated flag is created immediately.'}
              </p>
            </div>
          </div>

          {/* Active Devices Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Connected Sessions ({activeDevices.length})
            </h3>

            {activeDevices.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                Candidate is currently offline. No active sessions detected.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeDevices.map((dev, idx) => (
                  <div
                    key={dev.sessionId}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                      dev.isPrimary
                        ? 'bg-white border-blue-200 shadow-2xs'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          dev.isPrimary
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {getDeviceIcon(dev.deviceType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{dev.deviceName}</h4>
                          {dev.isPrimary ? (
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                              Primary Session
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded">
                              Secondary Session #{idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-xs text-slate-500 mt-1 font-mono">
                          <p>{dev.browser} • {dev.os}</p>
                          <p>IP: {dev.ipAddress}</p>
                          <p>Logged in: {dev.loginTime}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => terminateStudentDeviceSession(student.id, dev.sessionId)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Simulators */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">
              Simulate candidate login from secondary devices:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => simulateAddDeviceSession(student.id, 'mobile')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Simulate Mobile Login</span>
              </button>
              <button
                type="button"
                onClick={() => simulateAddDeviceSession(student.id, 'desktop')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ Simulate Laptop Login</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SECURITY & PROCTOR LOGS */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Proctoring Telemetry & Security Logs</h2>
            <p className="text-xs text-slate-500">Live device telemetry, IP footprinting, and login authentication checkpoints.</p>
          </div>

          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : log.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.event.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-400 font-mono">IP: {log.ipAddress}</span>
                      {log.location && (
                        <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                          {log.location}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 mt-1 font-mono text-xs truncate max-w-xl">
                      Client UA: {log.userAgent}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-slate-400 font-mono">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: CANDIDATE METADATA */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Institutional Onboarding Metadata</h2>
            <p className="text-xs text-slate-500">Tenant-linked attributes, contact information, and registration lifecycle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tenant Association</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Institution Name:</span>
                  <span className="font-semibold text-slate-900">{student.institutionName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tenant ID:</span>
                  <span className="font-mono text-slate-700">{student.institutionId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Domain Verification:</span>
                  <span className="font-semibold text-emerald-700">Strict Match ({domain})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Default Venue Gate Policy:</span>
                  <span className="font-semibold text-slate-700">
                    {institution.settings.requireAttendanceGate ? 'Enforced' : 'Optional'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Student Identifiers</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Roll / Identifier:</span>
                  <span className="font-mono font-bold text-blue-600">{student.studentIdentifier || `ID-${student.id}`}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-900">{student.dept}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Cohort Year:</span>
                  <span className="font-semibold text-slate-900">Class of {student.batchYear}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Phone Contact:</span>
                  <span className="font-mono text-slate-700">{student.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ASSIGN ASSESSMENT */}
      {/* ======================================================== */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Assessment Blueprint"
        subtitle={`Scheduling runtime test instance for ${student.name}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Blueprint *</label>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.duration} mins • {a.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until Date (Optional)</label>
            <input
              type="date"
              value={validUntilDate}
              onChange={(e) => setValidUntilDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">If blank, access remains valid until manually revoked.</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="attendanceGateDetail"
              checked={attendanceGateEnabled}
              onChange={(e) => setAttendanceGateEnabled(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="attendanceGateDetail" className="text-xs text-slate-700 cursor-pointer">
              <strong className="font-semibold block text-slate-900">Enforce Attendance Check-In Gate</strong>
              Candidate cannot start the exam until a verified venue proctor unlocks attendance.
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: RECORD MALPRACTICE FLAG */}
      {/* ======================================================== */}
      <Modal
        isOpen={addFlagModalOpen}
        onClose={() => setAddFlagModalOpen(false)}
        title="Record Malpractice Flag"
        subtitle={`Log integrity infraction for ${student.name}`}
      >
        <form onSubmit={handleAddFlagSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Infraction Category *</label>
            <select
              value={flagCategory}
              onChange={(e) => setFlagCategory(e.target.value as MalpracticeFlagCategory)}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="MULTIPLE_DEVICES">Multiple Devices Logged In</option>
              <option value="TAB_SWITCH">Tab / Window Switching (Focus Lost)</option>
              <option value="FULLSCREEN_EXIT">Full-Screen Lockdown Exit</option>
              <option value="MULTIPLE_FACES">Multiple Faces Detected in Webcam</option>
              <option value="AUDIO_DETECTED">Voice / Secondary Audio Detected</option>
              <option value="UNAUTHORIZED_DEVICE">Secondary Device / Screen Proxy</option>
              <option value="SEB_BREACH">Safe Exam Browser (SEB) Breach</option>
              <option value="IMPERSONATION">Biometric / Photo ID Impersonation</option>
              <option value="COPY_PASTE_VIOLATION">Clipboard / Copy-Paste Violation</option>
              <option value="MANUAL_PROCTOR">Manual Proctor Flag</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Associated Session ID (Optional)</label>
            <input
              type="text"
              placeholder="e.g. SES-2026-0881"
              value={flagSessionId}
              onChange={(e) => setFlagSessionId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observation Reason / Notes *</label>
            <textarea
              rows={3}
              placeholder="Provide specific notes and timestamps for the observed infraction..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddFlagModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
            >
              Record Malpractice Flag
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: RESOLVE MALPRACTICE FLAG */}
      {/* ======================================================== */}
      {resolveFlagModalTarget && (
        <Modal
          isOpen={true}
          onClose={() => setResolveFlagModalTarget(null)}
          title="Resolve Malpractice Flag"
          subtitle={`Updating Flag #${resolveFlagModalTarget.id} (${resolveFlagModalTarget.category})`}
        >
          <form onSubmit={handleResolveFlagSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <p className="font-semibold text-slate-800">Original Observation:</p>
              <p className="text-slate-600">{resolveFlagModalTarget.reason}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolution Outcome *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionAction('RESOLVE')}
                  className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    resolutionAction === 'RESOLVE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark Resolved</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionAction('DISMISS')}
                  className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    resolutionAction === 'DISMISS'
                      ? 'border-slate-600 bg-slate-100 text-slate-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dismiss / False Positive</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolution Justification Notes *</label>
              <textarea
                rows={3}
                placeholder="e.g. Reviewed audio recording; determined ambient classroom noise, candidate cleared by Head Proctor."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolveFlagModalTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
              >
                Save Resolution
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ATTENDANCE VERIFICATION */}
      {/* ======================================================== */}
      <Modal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title="Verify Candidate Attendance"
        subtitle={`Unlock assessment access for ${student.name}`}
      >
        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Room Code *</label>
            <input
              type="text"
              value={venueCode}
              onChange={(e) => setVenueCode(e.target.value)}
              placeholder="e.g. Huang Eng Center Lab 104"
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Proctor Sign-off</label>
            <input
              type="text"
              value={proctorName}
              onChange={(e) => setProctorName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAttendanceModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
            >
              Verify & Unlock Exam
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: REVOKE ASSIGNMENT */}
      {/* ======================================================== */}
      <Modal
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Revoke Assessment Assignment"
        subtitle={targetRevokeAssignment ? `Revoking: ${targetRevokeAssignment.assessmentTitle}` : ''}
      >
        <form onSubmit={handleRevokeSubmit} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <p className="font-semibold">Important Notice:</p>
            <p className="mt-0.5">Revoking this assessment will immediately block the student from initiating attempts. An audit trail record will be preserved permanently.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Revocation *</label>
            <select
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Candidate reschedule request">Candidate reschedule request</option>
              <option value="Proctoring infraction or disciplinary review">Proctoring infraction or disciplinary review</option>
              <option value="Assigned wrong version / blueprint update">Assigned wrong version / blueprint update</option>
              <option value="Candidate absent without excuse">Candidate absent without excuse</option>
              <option value="Administrative policy reset">Administrative policy reset</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRevokeModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
            >
              Confirm Revocation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
