import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { StudentDetailPage } from './StudentDetailPage';
import { Student, MalpracticeFlagCategory } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  TrendingUp,
  UserCheck,
  FileCheck,
  Clock,
  Building2,
  Flag,
  ShieldCheck,
  ShieldAlert,
  CheckSquare,
  Square,
  Download,
  CheckCircle2,
  ChevronRight,
  Laptop,
  Smartphone,
  Monitor,
  AlertTriangle,
  LogOut,
  XCircle,
  Filter,
  KeyRound,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react';
import {
  ResetCustomPasswordModal,
  ResetDefaultConfirmModal,
  ResetResultModal,
} from './PasswordResetModals';
import {
  resetPasswordsCustom,
  resetPasswordsDefault,
  PasswordResetResponse,
} from '../../api/services';

export const StudentsPage: React.FC = () => {
  const {
    students,
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    addStudent,
    assessments,
    assignAssessmentToStudents,
    addStudentFlag,
    batchFlagStudents,
    terminateStudentDeviceSession,
    terminateAllOtherDeviceSessions,
    simulateAddDeviceSession,
    showToast,
  } = useApp();

  // Drilldown state: if non-null, shows dedicated StudentDetailPage
  const [drilldownStudentId, setDrilldownStudentId] = useState<number | null>(null);

  // Search, Status, & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [flagFilter, setFlagFilter] = useState<'All' | 'Clean' | 'Flagged' | 'MultiDevice'>('All');
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'PRESENT' | 'ABSENT' | 'PENDING'>('All');

  // Selection state for Batch Actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [batchAssignModalOpen, setBatchAssignModalOpen] = useState(false);
  const [batchFlagModalOpen, setBatchFlagModalOpen] = useState(false);
  const [singleFlagStudent, setSingleFlagStudent] = useState<Student | null>(null);
  const [deviceModalStudentId, setDeviceModalStudentId] = useState<number | null>(null);

  // Add Candidate Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('Computer Science');
  const [batchYear, setBatchYear] = useState(2026);
  const [manualInstitutionId, setManualInstitutionId] = useState<string>('AUTO');
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [status, setStatus] = useState<'Active' | 'In Progress' | 'Inactive'>('Active');
  const [phone, setPhone] = useState('');

  // Bulk Assign Form State
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>([]);
  const [batchValidUntil, setBatchValidUntil] = useState('');
  const [batchAttendanceGate, setBatchAttendanceGate] = useState(true);

  // Bulk Flag Form State
  const [batchFlagCategory, setBatchFlagCategory] = useState<MalpracticeFlagCategory>('TAB_SWITCH');
  const [batchFlagReason, setBatchFlagReason] = useState('');

  // Single Flag Form State
  const [singleFlagCategory, setSingleFlagCategory] = useState<MalpracticeFlagCategory>('TAB_SWITCH');
  const [singleFlagReason, setSingleFlagReason] = useState('');

  // Password Reset State
  const [resetCustomOpen, setResetCustomOpen] = useState(false);
  const [resetDefaultOpen, setResetDefaultOpen] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetResult, setResetResult] = useState<PasswordResetResponse | null>(null);
  const [resetResultOpen, setResetResultOpen] = useState(false);
  const [singleResetStudentId, setSingleResetStudentId] = useState<number | null>(null);

  // Current student being inspected in device modal
  const deviceModalStudent = students.find((s) => s.id === deviceModalStudentId) || null;

  // Auto detect institution preview while typing email
  const detectedInstitution = useMemo(() => {
    if (manualInstitutionId !== 'AUTO') {
      return institutions.find((i) => i.id === manualInstitutionId);
    }
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      return institutions.find((i) =>
        i.domains.some((d) => domain === d.toLowerCase() || domain.endsWith(`.${d.toLowerCase()}`))
      );
    }
    if (selectedInstitutionId !== 'ALL') {
      return institutions.find((i) => i.id === selectedInstitutionId);
    }
    return institutions[0];
  }, [email, manualInstitutionId, selectedInstitutionId, institutions]);

  // Filter students based on institution selection, search, status, department, flags, and attendance
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Tenant filter
      const matchesInstitution =
        selectedInstitutionId === 'ALL' || s.institutionId === selectedInstitutionId;

      // Search query matches name, email, roll number, or department
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentIdentifier && s.studentIdentifier.toLowerCase().includes(q)) ||
        s.dept.toLowerCase().includes(q);

      // Status filter
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

      // Dept filter
      const matchesDept = deptFilter === 'All' || s.dept === deptFilter;

      // Flag filter
      const matchesFlag =
        flagFilter === 'All' ||
        (flagFilter === 'Clean' && (s.flags || 0) === 0) ||
        (flagFilter === 'Flagged' && (s.flags || 0) > 0) ||
        (flagFilter === 'MultiDevice' && (s.activeDevices || []).length > 1);

      // Attendance filter: Present matches PRESENT or CHECKED_IN
      const isPresent = s.attendanceStatus === 'PRESENT' || s.attendanceStatus === 'CHECKED_IN';
      const isAbsent = s.attendanceStatus === 'ABSENT';
      const isPending = !s.attendanceStatus || s.attendanceStatus === 'PENDING';

      const matchesAttendance =
        attendanceFilter === 'All' ||
        (attendanceFilter === 'PRESENT' && isPresent) ||
        (attendanceFilter === 'ABSENT' && isAbsent) ||
        (attendanceFilter === 'PENDING' && isPending);

      return matchesInstitution && matchesSearch && matchesStatus && matchesDept && matchesFlag && matchesAttendance;
    });
  }, [students, selectedInstitutionId, searchQuery, statusFilter, deptFilter, flagFilter, attendanceFilter]);

  // Calculate Tenant-scoped Statistics
  const tenantScopedStats = useMemo(() => {
    const pool = selectedInstitutionId === 'ALL'
      ? students
      : students.filter((s) => s.institutionId === selectedInstitutionId);

    const total = pool.length;
    const activeCount = pool.filter((s) => s.status === 'Active' || s.status === 'In Progress').length;
    const avgScore =
      total > 0
        ? Math.round(pool.reduce((acc, s) => acc + (s.score || 0), 0) / total)
        : 0;
    const totalFlags = pool.reduce((acc, s) => acc + (s.flags || 0), 0);
    const flaggedStudentsCount = pool.filter((s) => (s.flags || 0) > 0).length;
    const multiDeviceStudentsCount = pool.filter((s) => (s.activeDevices || []).length > 1).length;
    const presentCount = pool.filter((s) => s.attendanceStatus === 'PRESENT' || s.attendanceStatus === 'CHECKED_IN').length;
    const totalActiveDevices = pool.reduce((acc, s) => acc + (s.activeDevices || []).length, 0);

    return {
      total,
      activeCount,
      avgScore,
      totalFlags,
      flaggedStudentsCount,
      multiDeviceStudentsCount,
      presentCount,
      totalActiveDevices,
    };
  }, [students, selectedInstitutionId]);

  // Handle Select All
  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Quick Action: Shortlist and Select Present Candidates
  const handleShortlistPresent = () => {
    setAttendanceFilter('PRESENT');
    const presentIds = students
      .filter((s) => {
        const matchesInstitution = selectedInstitutionId === 'ALL' || s.institutionId === selectedInstitutionId;
        const isPresent = s.attendanceStatus === 'PRESENT' || s.attendanceStatus === 'CHECKED_IN';
        return matchesInstitution && isPresent;
      })
      .map((s) => s.id);
    setSelectedStudentIds(presentIds);
    showToast(`Shortlisted ${presentIds.length} verified present candidates for assignment`, 'info');
  };

  // Add Student Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addStudent({
      name: name.trim(),
      email: email.trim(),
      dept,
      batchYear,
      status,
      institutionId: manualInstitutionId !== 'AUTO' ? manualInstitutionId : undefined,
      studentIdentifier: studentIdentifier.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setAddModalOpen(false);
    setName('');
    setEmail('');
    setStudentIdentifier('');
    setPhone('');
  };

  // Batch Assign Submission
  const handleBatchAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssessmentIds.length === 0) {
      showToast('Please select at least one assessment to assign', 'error');
      return;
    }
    assignAssessmentToStudents(
      selectedStudentIds,
      selectedAssessmentIds,
      batchValidUntil || undefined,
      batchAttendanceGate
    );
    setBatchAssignModalOpen(false);
    setSelectedAssessmentIds([]);
    setSelectedStudentIds([]);
  };

  // Batch Malpractice Flag Submission
  const handleBatchFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFlagReason.trim()) {
      showToast('Please specify a reason for the malpractice flag', 'error');
      return;
    }
    batchFlagStudents(selectedStudentIds, {
      category: batchFlagCategory,
      reason: batchFlagReason.trim(),
    });
    setBatchFlagModalOpen(false);
    setBatchFlagReason('');
    setSelectedStudentIds([]);
  };

  // Single Malpractice Flag Submission
  const handleSingleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFlagStudent || !singleFlagReason.trim()) return;
    addStudentFlag(singleFlagStudent.id, {
      category: singleFlagCategory,
      reason: singleFlagReason.trim(),
    });
    setSingleFlagStudent(null);
    setSingleFlagReason('');
  };

  // ===== Password Reset Helpers (single or bulk) =====
  const getPasswordResetTargets = () => {
    // If singleResetStudentId is set (per-row action), use that single student
    // Otherwise use the multi-select checkbox group
    const targetIds =
      singleResetStudentId !== null ? [singleResetStudentId] : selectedStudentIds;
    const targetStudents = students.filter((s) => targetIds.includes(s.id));
    const targetEmails = targetStudents.map((s) => s.email).filter(Boolean) as string[];
    return { targetIds, targetStudents, targetEmails };
  };

  const handleConfirmResetCustom = async (password: string) => {
    const { targetIds, targetEmails } = getPasswordResetTargets();
    if (targetIds.length === 0) {
      showToast('No candidates selected for password reset', 'error');
      return;
    }
    setResetPending(true);
    try {
      const res = await resetPasswordsCustom(targetIds, targetEmails, password, undefined);
      setResetResult(res);
      setResetCustomOpen(false);
      setResetResultOpen(true);
      if (res.failed_count === 0) {
        showToast(res.message, 'success');
      } else {
        showToast(`${res.updated_count} updated, ${res.failed_count} failed — view details`, 'warning');
      }
      // Clear single-target after success; keep bulk selection for audit review
      setSingleResetStudentId(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Password reset failed';
      showToast(msg, 'error');
    } finally {
      setResetPending(false);
    }
  };

  const handleConfirmResetDefault = async () => {
    const { targetIds, targetEmails } = getPasswordResetTargets();
    if (targetIds.length === 0) {
      showToast('No candidates selected for default reset', 'error');
      return;
    }
    setResetPending(true);
    try {
      const res = await resetPasswordsDefault(targetIds, targetEmails, undefined);
      setResetResult(res);
      setResetDefaultOpen(false);
      setResetResultOpen(true);
      if (res.failed_count === 0) {
        showToast(res.message, 'success');
      } else {
        showToast(`${res.updated_count} updated, ${res.failed_count} failed — view details`, 'warning');
      }
      setSingleResetStudentId(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Default reset failed';
      showToast(msg, 'error');
    } finally {
      setResetPending(false);
    }
  };

  const openCustomForBulk = () => {
    setSingleResetStudentId(null);
    setResetCustomOpen(true);
  };
  const openDefaultForBulk = () => {
    setSingleResetStudentId(null);
    setResetDefaultOpen(true);
  };
  const openCustomForSingle = (studentId: number) => {
    setSingleResetStudentId(studentId);
    setResetCustomOpen(true);
  };
  const openDefaultForSingle = (studentId: number) => {
    setSingleResetStudentId(studentId);
    setResetDefaultOpen(true);
  };

  // Export Roster as CSV
  const handleExportCSV = () => {
    const listToExport = selectedStudentIds.length > 0
      ? students.filter((s) => selectedStudentIds.includes(s.id))
      : filteredStudents;

    const headers = [
      'ID',
      'Identifier',
      'Name',
      'Email',
      'Institution',
      'Department',
      'Batch',
      'Attendance Status',
      'Active Devices',
      'Malpractice Flags',
      'Benchmark Score',
      'Status',
      'Last Active',
    ];
    const rows = listToExport.map((s) => [
      s.id,
      s.studentIdentifier || '',
      `"${s.name}"`,
      s.email,
      `"${s.institutionName}"`,
      `"${s.dept}"`,
      s.batchYear || '',
      s.attendanceStatus === 'PRESENT' || s.attendanceStatus === 'CHECKED_IN' ? 'Present' : s.attendanceStatus === 'ABSENT' ? 'Absent' : 'Pending',
      (s.activeDevices || []).length,
      s.flags || 0,
      `${s.score}%`,
      s.status,
      `"${s.lastActive}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TalHelix_Candidate_Roster_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} candidate records to CSV`, 'success');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 font-semibold';
    if (score >= 75) return 'text-blue-700 font-semibold';
    return 'text-amber-700 font-semibold';
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
      case 'tablet':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'desktop':
      default:
        return <Laptop className="w-3.5 h-3.5" />;
    }
  };

  // Render Attendance Status Badge (Read-Only)
  const renderAttendanceBadge = (status?: string) => {
    if (status === 'PRESENT' || status === 'CHECKED_IN') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
          <span>Present</span>
        </span>
      );
    }
    if (status === 'ABSENT') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600 flex-shrink-0" />
          <span>Absent</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <span>Pending</span>
      </span>
    );
  };

  // If a student is selected for deep drill-down, render the dedicated StudentDetailPage
  if (drilldownStudentId !== null) {
    return (
      <StudentDetailPage
        studentId={drilldownStudentId}
        onBack={() => setDrilldownStudentId(null)}
      />
    );
  }

  const currentInstitution = institutions.find((i) => i.id === selectedInstitutionId);

  return (
    <div className="space-y-6 pb-16">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & TENANT / INSTITUTION SWITCHER */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Candidate Management
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono font-medium px-2 py-0.5 rounded border border-slate-200">
                Institutional Roster
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage candidate profiles, assessment assignments, live attendance, and proctoring integrity.
            </p>
          </div>
        </div>

        {/* Institution Selector & Add Candidate Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tenant Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <div className="flex flex-col">
              <span className="text-xs uppercase font-bold text-slate-400 leading-none">Institution</span>
              <select
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.code} — {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-blue-600 text-white px-3.5 py-2 rounded-lg font-medium text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TENANT POLICY CALLOUT (If specific tenant is selected) */}
      {/* ======================================================== */}
      {currentInstitution && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold font-mono text-xs">
              {currentInstitution.code}
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm">{currentInstitution.name}</span>
              <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-0.5">
                <span>Authorized Domains: <strong className="font-mono text-slate-700">{currentInstitution.domains.join(', ')}</strong></span>
                <span>• Flag Threshold: <strong className="text-slate-700">{currentInstitution.settings.flagThresholdForReview || 2} flags</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-shrink-0">
            <span className="bg-white text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
              {currentInstitution.settings.requireAttendanceGate ? 'Attendance Gate Enforced' : 'Remote Access Allowed'}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. 4 HIGH-LEVEL AGGREGATE KPI CARDS (Tenant Filtered) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Candidates */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Candidates</p>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {tenantScopedStats.total.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active roster synced</span>
          </div>
        </div>

        {/* Live Attendance */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Verified Attendance</p>
            <button
              onClick={handleShortlistPresent}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Shortlist Present
            </button>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span className="text-emerald-700 font-mono">{tenantScopedStats.presentCount}</span>
            <span className="text-xs font-normal text-slate-500">
              ({tenantScopedStats.total > 0 ? Math.round((tenantScopedStats.presentCount / tenantScopedStats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Read-only attendance feed</span>
          </div>
        </div>

        {/* Active Logged In Devices & Multiple Devices Alert */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Active Devices</p>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono flex items-center gap-2">
            <span>{tenantScopedStats.totalActiveDevices}</span>
            {tenantScopedStats.multiDeviceStudentsCount > 0 ? (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {tenantScopedStats.multiDeviceStudentsCount} Multi-Device
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                1 Device Policy Cleared
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Monitor className="w-3.5 h-3.5 text-blue-500" />
            <span>Single active session enforced</span>
          </div>
        </div>

        {/* Malpractice Flags */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Integrity Flags</p>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono flex items-center gap-2">
            <span className={tenantScopedStats.totalFlags > 0 ? 'text-amber-600' : 'text-emerald-600'}>
              {tenantScopedStats.totalFlags}
            </span>
            <span className="text-xs font-normal text-slate-500">
              ({tenantScopedStats.flaggedStudentsCount} candidates)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Proctor & automated logs</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ROSTER DIRECTORY & CONTROLS */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2 lg:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Attendance Filter Dropdown */}
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Attendance</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
              <option value="PENDING">Pending Only</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics</option>
            </select>

            {/* Flag Filter */}
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Integrity Statuses</option>
              <option value="Clean">Clear (0 Flags)</option>
              <option value="Flagged">Flagged (1+ Flags)</option>
              <option value="MultiDevice">Multiple Devices Active</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="In Progress">In Progress</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Export and Shortlist shortcut */}
          <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {attendanceFilter === 'PRESENT' && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Filtered: Present Candidates ({filteredStudents.length})
              </span>
            )}
            <button
              onClick={handleExportCSV}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. BATCH ACTIONS BAR (When items selected) */}
        {/* ======================================================== */}
        {selectedStudentIds.length > 0 && (
          <div className="bg-blue-50 border-y border-blue-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded-md font-bold font-mono text-xs">
                {selectedStudentIds.length}
              </span>
              <span className="font-semibold text-slate-700">candidates selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBatchAssignModalOpen(true)}
                disabled={resetPending}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Assign Assessment ({selectedStudentIds.length})</span>
              </button>

              <button
                onClick={() => setBatchFlagModalOpen(true)}
                disabled={resetPending}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Record Flag ({selectedStudentIds.length})</span>
              </button>

              <div className="w-px h-6 bg-blue-200 mx-1 hidden sm:block" />

              <button
                onClick={openCustomForBulk}
                disabled={resetPending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Reset TalHelix Password — set a custom password (hashed via worker pool, transactional)"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset TalHelix Password</span>
              </button>

              <button
                onClick={openDefaultForBulk}
                disabled={resetPending}
                className="bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 border border-slate-300 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Reset to Default Password — bcrypt-hashed srmpassword26, transactional"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Reset to Default Password</span>
              </button>

              <button
                onClick={() => setSelectedStudentIds([])}
                className="text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors cursor-pointer text-xs"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. MOBILE RESPONSIVE CARD VIEW (< sm viewports) */}
        {/* ======================================================== */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No candidates found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters.</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedStudentIds.includes(student.id);
              const activeAssignments = (student.assignments || []).filter((a) => a.status === 'ACTIVE');
              const activeDevices = student.activeDevices || [];
              const isMultiDevice = activeDevices.length > 1;
              const activeFlags = student.flags || 0;

              return (
                <div
                  key={student.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isSelected ? 'bg-blue-50/70' : 'bg-white'
                  }`}
                  onClick={() => setDrilldownStudentId(student.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectStudent(student.id);
                        }}
                        className="mt-0.5 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                            {student.studentIdentifier || `ID-${student.id}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{student.email}</p>
                        <p className="text-xs text-slate-400">{student.institutionCode} • {student.dept}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge status={student.status} />
                      <span className={`text-xs ${getScoreColor(student.score)}`}>{student.score}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-slate-500">Attendance:</span>
                      {renderAttendanceBadge(student.attendanceStatus)}
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-slate-500">Assigned:</span>
                      <span className="font-semibold text-slate-800">
                        {activeAssignments.length > 0 ? `${activeAssignments.length} Active` : '0 Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      {isMultiDevice ? (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          ⚠️ {activeDevices.length} Devices Active
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          {getDeviceIcon(activeDevices[0]?.deviceType)}
                          <span>{activeDevices.length} Device</span>
                        </span>
                      )}

                      {activeFlags > 0 ? (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {activeFlags} Flag{activeFlags > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-700">✓ Clean</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomForSingle(student.id);
                        }}
                        disabled={resetPending}
                        title="Reset TalHelix Password"
                        className="p-1.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDefaultForSingle(student.id);
                        }}
                        disabled={resetPending}
                        title="Reset to Default"
                        className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrilldownStudentId(student.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 ml-1"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ======================================================== */}
        {/* 7. DESKTOP & TABLET DATA TABLE (sm: and above) */}
        {/* ======================================================== */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Select All"
                  >
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Candidate</th>
                <th className="py-3 px-3 hidden md:table-cell">Dept & Class</th>
                <th className="py-3 px-3">Assignments</th>
                <th className="py-3 px-3">Attendance</th>
                <th className="py-3 px-3 hidden lg:table-cell">Devices</th>
                <th className="py-3 px-3 hidden md:table-cell">Integrity</th>
                <th className="py-3 px-3 hidden lg:table-cell">Score</th>
                <th className="py-3 px-3 hidden sm:table-cell">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No candidates match your filters</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query, attendance filter, or institution tenant.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const activeAssignments = (student.assignments || []).filter((a) => a.status === 'ACTIVE');
                  const completedAssignments = (student.assignments || []).filter((a) => a.status === 'COMPLETED');
                  const activeFlags = student.flags || 0;
                  const activeDevices = student.activeDevices || [];
                  const isMultiDevice = activeDevices.length > 1;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                      onClick={() => setDrilldownStudentId(student.id)}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectStudent(student.id);
                        }}
                      >
                        <button className="text-slate-400 hover:text-slate-700 cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Candidate Identity */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full ${
                              student.avatarColor || 'bg-blue-600'
                            } text-white font-bold text-xs flex items-center justify-center flex-shrink-0`}
                          >
                            {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 truncate hover:text-blue-600 transition-colors">
                                {student.name}
                              </span>
                              <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200 flex-shrink-0">
                                {student.studentIdentifier || `ID-${student.id}`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department & Institution */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {student.institutionCode}
                            </span>
                            <span className="text-slate-700 font-medium truncate max-w-[120px]">
                              {student.dept}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">Class of {student.batchYear}</p>
                        </div>
                      </td>

                      {/* Assignments Column */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-900 block">
                            {(student.assignments || []).length} Assigned
                          </span>
                          <div className="flex flex-wrap items-center gap-1">
                            {activeAssignments.length > 0 && (
                              <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                                {activeAssignments.length} Active
                              </span>
                            )}
                            {completedAssignments.length > 0 && (
                              <span className="bg-emerald-50 text-emerald-700 text-xs px-1.5 py-0.2 rounded font-medium border border-emerald-200">
                                {completedAssignments.length} Done
                              </span>
                            )}
                            {(student.assignments || []).length === 0 && (
                              <span className="text-xs text-slate-400">None</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Attendance Column (Read-Only Status) */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        {renderAttendanceBadge(student.attendanceStatus)}
                      </td>

                      {/* Active Devices Column */}
                      <td className="py-3 px-3 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        {isMultiDevice ? (
                          <button
                            onClick={() => setDeviceModalStudentId(student.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Click to view and terminate secondary devices"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{activeDevices.length} Active (Alert)</span>
                          </button>
                        ) : activeDevices.length === 1 ? (
                          <button
                            onClick={() => setDeviceModalStudentId(student.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {getDeviceIcon(activeDevices[0].deviceType)}
                            <span className="truncate max-w-[90px]">{activeDevices[0].deviceName}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Offline (0)</span>
                        )}
                      </td>

                      {/* Integrity Flags Column */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          {isMultiDevice ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>Multi-Device</span>
                            </span>
                          ) : activeFlags > 0 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              <span>{activeFlags} Flag{activeFlags > 1 ? 's' : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Clear</span>
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSingleFlagStudent(student);
                            }}
                            title="Record integrity observation flag"
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Benchmark Score */}
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <span className={`text-xs ${getScoreColor(student.score)}`}>
                          {student.score}%
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <Badge status={student.status} />
                      </td>

                      {/* Actions Column — includes per-student password resets */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openCustomForSingle(student.id)}
                            disabled={resetPending}
                            title="Reset TalHelix Password — set custom (admin only)"
                            className="p-1.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDefaultForSingle(student.id)}
                            disabled={resetPending}
                            title="Reset to Default Password (srmpassword26)"
                            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDrilldownStudentId(student.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer inline-flex items-center gap-1 ml-0.5"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM ACTIVE SESSIONS & DEVICE STATUS BAR */}
        {/* ======================================================== */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Active Device Sessions: <strong className="text-slate-900 font-mono">{tenantScopedStats.totalActiveDevices}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${tenantScopedStats.multiDeviceStudentsCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
              <span>
                Multi-Device Violations: <strong className={tenantScopedStats.multiDeviceStudentsCount > 0 ? 'text-rose-700 font-mono' : 'text-slate-900 font-mono'}>{tenantScopedStats.multiDeviceStudentsCount}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Present: <strong className="text-emerald-700 font-mono">{tenantScopedStats.presentCount}</strong> / {tenantScopedStats.total}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Enforcing strict 1-device policy per candidate during active assessments
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: MANAGE CANDIDATE ACTIVE DEVICES & SESSIONS */}
      {/* ======================================================== */}
      {deviceModalStudent && (
        <Modal
          isOpen={true}
          onClose={() => setDeviceModalStudentId(null)}
          title={`Active Device Logins for ${deviceModalStudent.name}`}
          subtitle={`Student ID: ${deviceModalStudent.studentIdentifier || deviceModalStudent.id} • ${deviceModalStudent.email}`}
        >
          <div className="space-y-4 text-xs">
            {/* Policy notice */}
            <div
              className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                (deviceModalStudent.activeDevices || []).length > 1
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  (deviceModalStudent.activeDevices || []).length > 1 ? 'text-rose-600' : 'text-slate-500'
                }`}
              />
              <div>
                {(deviceModalStudent.activeDevices || []).length > 1 ? (
                  <>
                    <strong className="block font-semibold">
                      Security Alert: Multiple Devices Detected ({deviceModalStudent.activeDevices?.length} Active)
                    </strong>
                    Only one device is permitted to access the assessment portal. An integrity flag remains active until all secondary sessions are terminated.
                  </>
                ) : (
                  <>
                    <strong className="block font-semibold">Single Active Device Enforced</strong>
                    Candidate is connected with 1 authorized session. If the candidate attempts to log in from another browser or mobile device, a malpractice flag will trigger automatically.
                  </>
                )}
              </div>
            </div>

            {/* List of active device sessions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Current Active Sessions ({deviceModalStudent.activeDevices?.length || 0})
                </span>
                {(deviceModalStudent.activeDevices || []).length > 1 && (
                  <button
                    onClick={() => {
                      terminateAllOtherDeviceSessions(deviceModalStudent.id);
                    }}
                    className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Terminate All Other Devices</span>
                  </button>
                )}
              </div>

              {(!deviceModalStudent.activeDevices || deviceModalStudent.activeDevices.length === 0) ? (
                <div className="p-6 text-center border border-slate-200 rounded-lg text-slate-400">
                  No active login sessions. Candidate is currently offline.
                </div>
              ) : (
                <div className="space-y-2">
                  {deviceModalStudent.activeDevices.map((dev, idx) => (
                    <div
                      key={dev.sessionId}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                        dev.isPrimary
                          ? 'bg-white border-slate-200 shadow-2xs'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            dev.isPrimary
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {getDeviceIcon(dev.deviceType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{dev.deviceName}</span>
                            {dev.isPrimary ? (
                              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-1.5 py-0.2 rounded border border-blue-200">
                                Primary Session
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-1.5 py-0.2 rounded">
                                Secondary #{idx + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                            <span>{dev.browser} / {dev.os}</span>
                            <span>• IP: {dev.ipAddress}</span>
                            <span>• Logged in: {dev.loginTime}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => terminateStudentDeviceSession(deviceModalStudent.id, dev.sessionId)}
                        title="Force disconnect this device"
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Testing Simulation */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                Test multi-device security detection in live preview:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => simulateAddDeviceSession(deviceModalStudent.id, 'mobile')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>+ Add Mobile Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => simulateAddDeviceSession(deviceModalStudent.id, 'desktop')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Laptop className="w-3 h-3" />
                  <span>+ Add Laptop Login</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeviceModalStudentId(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD CANDIDATE */}
      {/* ======================================================== */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Institutional Candidate"
        subtitle="Register candidate with domain mapping and roster profile"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Jordan Hayes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
            <input
              type="email"
              placeholder="e.g. j.hayes@mit.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            {detectedInstitution && (
              <p className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Auto-routed to tenant: <strong>{detectedInstitution.name} ({detectedInstitution.code})</strong></span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Roll / Student ID</label>
              <input
                type="text"
                placeholder="e.g. CS-2026-099"
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone (Optional)</label>
              <input
                type="text"
                placeholder="e.g. +1 555 0192"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Year</label>
              <input
                type="number"
                value={batchYear}
                onChange={(e) => setBatchYear(parseInt(e.target.value) || 2026)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Register Candidate
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: BATCH ASSIGN ASSESSMENT */}
      {/* ======================================================== */}
      <Modal
        isOpen={batchAssignModalOpen}
        onClose={() => setBatchAssignModalOpen(false)}
        title={`Assign Assessment to ${selectedStudentIds.length} Candidates`}
        subtitle="Provision runtime test instances with scheduled windows and attendance gating"
      >
        <form onSubmit={handleBatchAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Assessments *</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
              {assessments.map((a) => {
                const checked = selectedAssessmentIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 hover:bg-blue-50/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssessmentIds((prev) => [...prev, a.id]);
                        } else {
                          setSelectedAssessmentIds((prev) => prev.filter((id) => id !== a.id));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.duration} mins • {a.questionsCount || 1} questions • {a.category}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Access Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={batchValidUntil}
              onChange={(e) => setBatchValidUntil(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="batchAttendanceGate"
              checked={batchAttendanceGate}
              onChange={(e) => setBatchAttendanceGate(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="batchAttendanceGate" className="text-slate-700 cursor-pointer">
              <strong className="font-semibold block text-slate-900">Enforce Attendance Gate Verification</strong>
              Requires venue proctor RFID or staff verification before candidates can launch testing.
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBatchAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Confirm Batch Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: BATCH MALPRACTICE FLAG */}
      {/* ======================================================== */}
      <Modal
        isOpen={batchFlagModalOpen}
        onClose={() => setBatchFlagModalOpen(false)}
        title={`Record Proctoring Flag (${selectedStudentIds.length} Candidates)`}
        subtitle="Log an active integrity infraction across all selected student profiles"
      >
        <form onSubmit={handleBatchFlagSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Infraction Category *</label>
            <select
              value={batchFlagCategory}
              onChange={(e) => setBatchFlagCategory(e.target.value as MalpracticeFlagCategory)}
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
            <label className="block font-semibold text-slate-700 mb-1">
              Proctor Observation & Justification *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Simultaneous browser blur detected during section 2 assessment window"
              value={batchFlagReason}
              onChange={(e) => setBatchFlagReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBatchFlagModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
            >
              Log Integrity Flag
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: SINGLE MALPRACTICE FLAG */}
      {/* ======================================================== */}
      {singleFlagStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSingleFlagStudent(null)}
          title={`Log Malpractice Flag for ${singleFlagStudent.name}`}
          subtitle={`Current Active Flags: ${singleFlagStudent.flags || 0}`}
        >
          <form onSubmit={handleSingleFlagSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Infraction Category *</label>
              <select
                value={singleFlagCategory}
                onChange={(e) => setSingleFlagCategory(e.target.value as MalpracticeFlagCategory)}
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
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed Observation Notes *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Continuous eye gaze away from viewport and external audio detected"
                value={singleFlagReason}
                onChange={(e) => setSingleFlagReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSingleFlagStudent(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
              >
                Record Flag
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* PASSWORD MANAGEMENT MODALS */}
      {/* ======================================================== */}
      {(() => {
        const { targetIds, targetEmails } = getPasswordResetTargets();
        const isBatch = targetIds.length > 1;
        return (
          <>
            <ResetCustomPasswordModal
              isOpen={resetCustomOpen}
              onClose={() => {
                if (!resetPending) {
                  setResetCustomOpen(false);
                  setSingleResetStudentId(null);
                }
              }}
              onConfirm={handleConfirmResetCustom}
              isPending={resetPending}
              selectedCount={targetIds.length}
              selectedEmails={targetEmails}
              selectedIds={targetIds}
            />
            <ResetDefaultConfirmModal
              isOpen={resetDefaultOpen}
              onClose={() => {
                if (!resetPending) {
                  setResetDefaultOpen(false);
                  setSingleResetStudentId(null);
                }
              }}
              onConfirm={handleConfirmResetDefault}
              isPending={resetPending}
              selectedCount={targetIds.length}
              selectedEmails={targetEmails}
              selectedIds={targetIds}
              isBatch={isBatch}
            />
          </>
        );
      })()}

      <ResetResultModal
        isOpen={resetResultOpen}
        onClose={() => {
          setResetResultOpen(false);
          setResetResult(null);
        }}
        result={resetResult}
      />
    </div>
  );
};
