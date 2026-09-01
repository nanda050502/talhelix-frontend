import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Batch, ScheduleWindow, Student } from '../../types';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Users,
  UserCheck,
  UserPlus,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  Search,
  Check,
  GraduationCap,
  Upload,
  FileSpreadsheet,
  Download,
  Sparkles,
  AlertTriangle,
  Mail,
  FileText,
} from 'lucide-react';

export const InstitutionBatches: React.FC = () => {
  const {
    batches,
    staffFaculty,
    students,
    assessments,
    addBatch,
    updateBatch,
    deleteBatch,
    assignStudentsToBatch,
    importStudentsFromCSV,
    showToast,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Student Assignment Modal State
  const [assignModalBatch, setAssignModalBatch] = useState<Batch | null>(null);
  const [assignModalTab, setAssignModalTab] = useState<'ROSTER' | 'BULK_CSV'>('ROSTER');
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignFilterTab, setAssignFilterTab] = useState<'ALL' | 'ENROLLED' | 'UNASSIGNED'>('ALL');
  const [selectedStudentIdsForAssign, setSelectedStudentIdsForAssign] = useState<number[]>([]);

  // Bulk CSV / Email Drop State (Supports 1,000–3,000+ students)
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkFileName, setBulkFileName] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Form State for Batch Create/Edit
  const [batchForm, setBatchForm] = useState({
    name: '',
    code: '',
    department: 'Computer Science & Engineering',
    academicYear: 2026,
    semester: 6,
    section: 'A',
    facultyIds: [] as string[],
    selectedStudentIds: [] as number[],
    assessmentName: 'Python Basics — Week 1',
    dayOfWeek: 'Monday' as any,
    startTime: '09:00',
    endTime: '10:30',
    venueRoom: 'Turing Hall 301',
  });

  const handleOpenAssignModal = (batch: Batch) => {
    setAssignModalBatch(batch);
    const currentlyEnrolledIds = students.filter((s) => s.batchId === batch.id).map((s) => s.id);
    setSelectedStudentIdsForAssign(currentlyEnrolledIds);
    setAssignSearchQuery('');
    setAssignFilterTab('ALL');
    setAssignModalTab('ROSTER');
    setBulkInputText('');
    setBulkFileName(null);
  };

  const handleSaveStudentAssignment = () => {
    if (!assignModalBatch) return;
    assignStudentsToBatch(assignModalBatch.id, selectedStudentIdsForAssign);
    setAssignModalBatch(null);
  };

  // Bulk CSV / Email Parser Engine
  const parsedBulkStudents = useMemo(() => {
    if (!assignModalBatch || !bulkInputText.trim()) return [];

    const text = bulkInputText.trim();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const isCSVHeader =
      lines[0] &&
      (lines[0].toLowerCase().includes('email') ||
        lines[0].toLowerCase().includes('name') ||
        lines[0].toLowerCase().includes('register') ||
        lines[0].toLowerCase().includes('netid'));

    const extractedList: Array<Partial<Student>> = [];
    const foundEmails = new Set<string>();

    if (isCSVHeader) {
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
      const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('full'));
      const regIdx = headers.findIndex((h) => h.includes('reg') || h.includes('roll') || h.includes('id'));
      const netIdIdx = headers.findIndex((h) => h.includes('netid') || h.includes('net_id'));
      const deptIdx = headers.findIndex((h) => h.includes('dept') || h.includes('department'));
      const secIdx = headers.findIndex((h) => h.includes('sec') || h.includes('section'));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const email = emailIdx >= 0 ? cols[emailIdx] : cols.find((c) => c.includes('@'));
        if (!email || !email.includes('@')) continue;
        if (foundEmails.has(email.toLowerCase())) continue;
        foundEmails.add(email.toLowerCase());

        const rawName =
          nameIdx >= 0 && cols[nameIdx]
            ? cols[nameIdx]
            : email
                .split('@')[0]
                .replace(/[._]/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
        const regNo = regIdx >= 0 ? cols[regIdx] : '';
        const netId = netIdIdx >= 0 ? cols[netIdIdx] : email.split('@')[0];

        extractedList.push({
          email: email.toLowerCase(),
          name: rawName,
          registerNumber: regNo,
          netId,
          dept: deptIdx >= 0 && cols[deptIdx] ? cols[deptIdx] : assignModalBatch.department || 'Computer Science',
          section: secIdx >= 0 && cols[secIdx] ? cols[secIdx] : assignModalBatch.section || 'A',
          batchId: assignModalBatch.id,
          batchName: assignModalBatch.name,
          batchYear: assignModalBatch.academicYear || 2026,
        });
      }
    } else {
      // Plain text or list of thousands of emails / comma separated
      const rawTokens = text.split(/[\s,;\n\r\t]+/);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const token of rawTokens) {
        const cleaned = token.trim().replace(/^["'<({[]|["'>)}\]]$/g, '').toLowerCase();
        if (emailRegex.test(cleaned) && !foundEmails.has(cleaned)) {
          foundEmails.add(cleaned);
          const namePart = cleaned
            .split('@')[0]
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          extractedList.push({
            email: cleaned,
            name: namePart,
            registerNumber: '',
            netId: cleaned.split('@')[0],
            dept: assignModalBatch.department || 'Computer Science',
            section: assignModalBatch.section || 'A',
            batchId: assignModalBatch.id,
            batchName: assignModalBatch.name,
            batchYear: assignModalBatch.academicYear || 2026,
          });
        }
      }
    }

    return extractedList;
  }, [bulkInputText, assignModalBatch]);

  // Execute Bulk Enrollment for high volume (1,000–3,000 students)
  const handleExecuteBulkEnrollment = () => {
    if (!assignModalBatch || parsedBulkStudents.length === 0) return;
    setIsProcessingBulk(true);

    try {
      const existingStudentEmailMap = new Map<string, Student>();
      students.forEach((s) => existingStudentEmailMap.set(s.email.toLowerCase(), s));

      const existingToReassignIds: number[] = [];
      const newToProvision: Array<Partial<Student>> = [];

      parsedBulkStudents.forEach((p) => {
        const existing = existingStudentEmailMap.get((p.email || '').toLowerCase());
        if (existing) {
          existingToReassignIds.push(existing.id);
        } else {
          newToProvision.push({
            ...p,
            batchId: assignModalBatch.id,
            batchName: assignModalBatch.name,
            section: assignModalBatch.section,
          });
        }
      });

      // 1. Reassign existing students
      if (existingToReassignIds.length > 0) {
        assignStudentsToBatch(assignModalBatch.id, existingToReassignIds);
      }

      // 2. Provision new students
      if (newToProvision.length > 0) {
        importStudentsFromCSV(newToProvision);
      }

      showToast(
        `Enrolled ${parsedBulkStudents.length} students into ${assignModalBatch.name} (${existingToReassignIds.length} existing linked, ${newToProvision.length} new provisioned).`,
        'success'
      );
      setAssignModalBatch(null);
    } catch (err) {
      showToast('Error processing bulk student enrollment', 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCSV = () => {
    const sample = `RegisterNumber,NetID,FullName,Email,Department,Section
710022104001,net_alex,Alex Mercer,alex.m@stanford.edu,Computer Science & Engineering,A
710022104002,net_beatrice,Beatrice Vance,beatrice.v@stanford.edu,Computer Science & Engineering,A
710022104003,net_carlos,Carlos Ortiz,carlos.o@stanford.edu,Computer Science & Engineering,A
710022104004,net_dana,Dana Scully,dana.s@stanford.edu,Computer Science & Engineering,A
710022104005,net_edward,Edward Norton,edward.n@stanford.edu,Computer Science & Engineering,A`;
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_batch_enrollment_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.name) {
      showToast('Please enter batch name', 'error');
      return;
    }

    const assignedNames = staffFaculty
      .filter((f) => batchForm.facultyIds.includes(f.id))
      .map((f) => f.name);

    const schedule: ScheduleWindow = {
      id: `sched-${Date.now().toString(36)}`,
      dayOfWeek: batchForm.dayOfWeek,
      startTime: batchForm.startTime,
      endTime: batchForm.endTime,
      subjectCode: 'ASM',
      subjectName: batchForm.assessmentName || 'Assessment',
      venueRoom: batchForm.venueRoom,
      facultyId: batchForm.facultyIds[0] || 'fac-101',
      facultyName: assignedNames[0] || 'Prof. David Malan',
    };

    if (editingBatch) {
      updateBatch(editingBatch.id, {
        name: batchForm.name,
        code: batchForm.code,
        department: batchForm.department,
        academicYear: Number(batchForm.academicYear),
        semester: Number(batchForm.semester),
        section: batchForm.section,
        assignedFacultyIds: batchForm.facultyIds,
        assignedFacultyNames: assignedNames,
        scheduleWindows: [schedule],
      });
      setEditingBatch(null);
    } else {
      const newBatchId = `batch-${Date.now().toString(36)}`;
      addBatch({
        id: newBatchId,
        name: batchForm.name,
        code: batchForm.code || `CS-${batchForm.academicYear}-${batchForm.section}`,
        department: batchForm.department,
        academicYear: Number(batchForm.academicYear),
        semester: Number(batchForm.semester),
        section: batchForm.section,
        studentCount: batchForm.selectedStudentIds.length || 0,
        assignedFacultyIds: batchForm.facultyIds,
        assignedFacultyNames: assignedNames,
        scheduleWindows: [schedule],
      });
    }

    setShowCreateModal(false);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    const sched = batch.scheduleWindows?.[0];
    const enrolledIds = students.filter((s) => s.batchId === batch.id).map((s) => s.id);
    setBatchForm({
      name: batch.name,
      code: batch.code,
      department: batch.department,
      academicYear: batch.academicYear || 2026,
      semester: batch.semester || 6,
      section: batch.section,
      facultyIds: batch.assignedFacultyIds || [],
      selectedStudentIds: enrolledIds,
      assessmentName: sched?.subjectName || assessments[0]?.title || 'Python Basics — Week 1',
      dayOfWeek: sched?.dayOfWeek || 'Monday',
      startTime: sched?.startTime || '09:00',
      endTime: sched?.endTime || '10:30',
      venueRoom: sched?.venueRoom || 'Turing Hall 301',
    });
    setShowCreateModal(true);
  };

  // Filtered Students for Assignment Modal (Roster View)
  const filteredStudentsForAssign = useMemo(() => {
    if (!assignModalBatch) return [];
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
        (s.registerNumber && s.registerNumber.toLowerCase().includes(assignSearchQuery.toLowerCase())) ||
        (s.netId && s.netId.toLowerCase().includes(assignSearchQuery.toLowerCase()));

      const isEnrolledInThis = s.batchId === assignModalBatch.id;
      const isUnassigned = !s.batchId;

      if (!matchesSearch) return false;
      if (assignFilterTab === 'ENROLLED') return isEnrolledInThis;
      if (assignFilterTab === 'UNASSIGNED') return isUnassigned || !isEnrolledInThis;
      return true;
    });
  }, [students, assignModalBatch, assignSearchQuery, assignFilterTab]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-blue-600" />
            <span>Academic Batches & Schedules</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure cohort sections, assessment timetable windows, assigned faculty proctors, and student rosters.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBatch(null);
            setBatchForm({
              name: '',
              code: '',
              department: 'Computer Science & Engineering',
              academicYear: 2026,
              semester: 6,
              section: 'A',
              facultyIds: [staffFaculty[0]?.id || 'fac-101'],
              selectedStudentIds: [],
              assessmentName: assessments[0]?.title || 'Python Basics — Week 1',
              dayOfWeek: 'Monday',
              startTime: '09:00',
              endTime: '10:30',
              venueRoom: 'Turing Hall 301',
            });
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((batch) => {
          const enrolledStudents = students.filter((s) => s.batchId === batch.id);
          const enrolledCount = enrolledStudents.length || batch.studentCount;
          const schedule = batch.scheduleWindows?.[0];

          return (
            <div
              key={batch.id}
              className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Top info */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {batch.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{batch.name}</h3>
                    <p className="text-xs text-slate-500">
                      {batch.department} • Sec {batch.section}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(batch)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
                      <span>Enrolled Students</span>
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{enrolledCount}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Semester & Year</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      Sem {batch.semester} ({batch.academicYear})
                    </div>
                  </div>
                </div>

                {/* Direct Student Assignment Action Button */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(batch)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Manage / Assign Students ({enrolledCount})</span>
                  </button>
                </div>

                {/* Primary Schedule Window */}
                {schedule && (
                  <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <ClipboardList className="w-4 h-4" />
                        <span>{schedule.subjectName}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {schedule.dayOfWeek}s ({schedule.startTime} - {schedule.endTime})
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        {schedule.venueRoom}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1.5 text-xs text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Faculty: <strong className="text-slate-800 font-medium">{schedule.facultyName}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Status: <strong className="text-emerald-600 font-semibold">ACTIVE</strong></span>
                <span className="text-xs text-slate-400">Created {batch.createdAt}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. DEDICATED STUDENT ASSIGNMENT & BULK CSV / EMAIL MODAL */}
      {assignModalBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {assignModalBatch.code}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Enroll Students in {assignModalBatch.name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Assign existing students or drop a high-volume CSV / Email list (1,000–3,000+ students).
                </p>
              </div>
              <button
                onClick={() => setAssignModalBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setAssignModalTab('ROSTER')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  assignModalTab === 'ROSTER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Interactive Roster Selector ({selectedStudentIdsForAssign.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAssignModalTab('BULK_CSV')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  assignModalTab === 'BULK_CSV'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>⚡ Bulk CSV Drop & Email Paste (1,000–3,000+ Students)</span>
              </button>
            </div>

            {/* TAB 1: INTERACTIVE ROSTER SELECTOR */}
            {assignModalTab === 'ROSTER' && (
              <div className="space-y-3">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by student name, email, register no, NetID..."
                      value={assignSearchQuery}
                      onChange={(e) => setAssignSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white text-slate-900"
                    />
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold shrink-0">
                    <button
                      type="button"
                      onClick={() => setAssignFilterTab('ALL')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        assignFilterTab === 'ALL' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({students.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignFilterTab('ENROLLED')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        assignFilterTab === 'ENROLLED' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Enrolled ({students.filter((s) => s.batchId === assignModalBatch.id).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignFilterTab('UNASSIGNED')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        assignFilterTab === 'UNASSIGNED' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Other / Unassigned
                    </button>
                  </div>
                </div>

                {/* Quick Bulk Selection Header */}
                <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        filteredStudentsForAssign.length > 0 &&
                        filteredStudentsForAssign.every((s) => selectedStudentIdsForAssign.includes(s.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allVisibleIds = filteredStudentsForAssign.map((s) => s.id);
                          setSelectedStudentIdsForAssign((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
                        } else {
                          const visibleIdsSet = new Set(filteredStudentsForAssign.map((s) => s.id));
                          setSelectedStudentIdsForAssign((prev) => prev.filter((id) => !visibleIdsSet.has(id)));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Select All Visible ({filteredStudentsForAssign.length})</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700">
                      {selectedStudentIdsForAssign.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIdsForAssign([])}
                      className="text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                {/* Students Checkbox List */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-white">
                  {filteredStudentsForAssign.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching students found for this search/filter.
                    </div>
                  ) : (
                    filteredStudentsForAssign.map((s) => {
                      const isChecked = selectedStudentIdsForAssign.includes(s.id);
                      const isCurrentBatch = s.batchId === assignModalBatch.id;

                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            isChecked ? 'bg-blue-50/60 border border-blue-200/80' : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIdsForAssign((prev) => [...prev, s.id]);
                                } else {
                                  setSelectedStudentIdsForAssign((prev) => prev.filter((id) => id !== s.id));
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                              {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{s.name}</span>
                                {s.registerNumber && (
                                  <span className="text-[10px] font-mono text-slate-500 font-normal">
                                    ({s.registerNumber})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {s.email} • {s.dept || 'Computer Science'}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isCurrentBatch ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Currently In Batch
                              </span>
                            ) : s.batchName ? (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                In {s.batchName}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Modal Actions */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-200 text-xs">
                  <span className="text-slate-500">
                    Changes will take effect across student attendance, exam assignments, and mobile sync.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignModalBatch(null)}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStudentAssignment}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Enrollment ({selectedStudentIdsForAssign.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BULK CSV DROP & EMAIL PASTE (1,000–3,000+ STUDENTS) */}
            {assignModalTab === 'BULK_CSV' && (
              <div className="space-y-4 text-xs">
                {/* Drag-and-drop file upload banner */}
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-xl p-5 text-center transition-all relative">
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">
                    {bulkFileName ? `Uploaded: ${bulkFileName}` : 'Drop student CSV / TXT file here or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports high-volume enrollment (1,000 to 3,000+ candidate emails or CSV rows).
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadSampleCSV}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample CSV Template</span>
                    </button>
                  </div>
                </div>

                {/* Raw Paste Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Or Paste List of Student Emails / Registration Numbers:</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Comma, newline, or tab separated
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={bulkInputText}
                    onChange={(e) => setBulkInputText(e.target.value)}
                    placeholder={`e.g.\nalex.mercer@stanford.edu\nbeatrice.vance@stanford.edu, carlos.ortiz@stanford.edu\ndana.scully@stanford.edu; edward.norton@stanford.edu\n\nOr paste CSV formatted rows:\nRegisterNumber,NetID,FullName,Email,Department,Section\n710022104001,net_alex,Alex Mercer,alex.m@stanford.edu,CS,A`}
                    className="w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                  />
                </div>

                {/* Live Parsed Stats Preview */}
                {parsedBulkStudents.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-blue-950 text-xs sm:text-sm">
                          {parsedBulkStudents.length.toLocaleString()} Valid Students Detected
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                        Ready to Enroll
                      </span>
                    </div>

                    <p className="text-[11px] text-blue-800">
                      Target Batch: <strong className="font-bold">{assignModalBatch.name}</strong> ({assignModalBatch.code}) • All {parsedBulkStudents.length} candidates will be assigned and provisioned automatically.
                    </p>

                    {/* Sample Preview List Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white/90 rounded-lg border border-blue-100">
                      {parsedBulkStudents.slice(0, 15).map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-blue-100/70 text-blue-900 font-mono text-[10px] flex items-center gap-1 border border-blue-200"
                        >
                          <span>{p.name || p.email}</span>
                          {p.email && <span className="text-blue-600 text-[9px]">({p.email})</span>}
                        </span>
                      ))}
                      {parsedBulkStudents.length > 15 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          +{parsedBulkStudents.length - 15} more candidates...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkInputText('');
                      setBulkFileName(null);
                    }}
                    disabled={!bulkInputText}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                  >
                    Clear Input
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignModalBatch(null)}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteBulkEnrollment}
                      disabled={parsedBulkStudents.length === 0 || isProcessingBulk}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isProcessingBulk
                          ? 'Enrolling Candidates...'
                          : `⚡ Enroll & Provision ${parsedBulkStudents.length > 0 ? `${parsedBulkStudents.length.toLocaleString()} Students` : 'Candidates'}`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CREATE / EDIT BATCH CONFIGURATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editingBatch ? 'Edit Batch Configuration' : 'Create New Academic Batch'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batch Name *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.name}
                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                    placeholder="e.g. CS 2026 - Section A"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batch Code</label>
                  <input
                    type="text"
                    value={batchForm.code}
                    onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                    placeholder="e.g. CS2026-A"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Academic Year</label>
                  <input
                    type="number"
                    value={batchForm.academicYear}
                    onChange={(e) => setBatchForm({ ...batchForm, academicYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester</label>
                  <input
                    type="number"
                    value={batchForm.semester}
                    onChange={(e) => setBatchForm({ ...batchForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Section</label>
                  <input
                    type="text"
                    value={batchForm.section}
                    onChange={(e) => setBatchForm({ ...batchForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Assessment Timetable Window */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-semibold text-blue-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Class Timetable Window</span>
                </div>

                {/* Single Full-Width Assessment Name field */}
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Assessment Name</label>
                  <input
                    type="text"
                    list="available-assessments-list"
                    value={batchForm.assessmentName}
                    onChange={(e) => setBatchForm({ ...batchForm, assessmentName: e.target.value })}
                    placeholder="e.g. Python Basics — Week 1"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <datalist id="available-assessments-list">
                    {assessments.map((a) => (
                      <option key={a.id} value={a.title} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Day</label>
                    <select
                      value={batchForm.dayOfWeek}
                      onChange={(e) => setBatchForm({ ...batchForm, dayOfWeek: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Start Time</label>
                    <input
                      type="time"
                      value={batchForm.startTime}
                      onChange={(e) => setBatchForm({ ...batchForm, startTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">End Time</label>
                    <input
                      type="time"
                      value={batchForm.endTime}
                      onChange={(e) => setBatchForm({ ...batchForm, endTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Venue / Classroom Room</label>
                  <input
                    type="text"
                    value={batchForm.venueRoom}
                    onChange={(e) => setBatchForm({ ...batchForm, venueRoom: e.target.value })}
                    placeholder="e.g. Turing Hall 301"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Faculty Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Faculty Proctor</label>
                <select
                  value={batchForm.facultyIds[0] || staffFaculty[0]?.id}
                  onChange={(e) => setBatchForm({ ...batchForm, facultyIds: [e.target.value] })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {staffFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation} — {f.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Enrolled Students Count Card (No scrollable list) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Enrolled Students</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {batchForm.selectedStudentIds.length} candidate(s) currently enrolled
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 shadow-2xs">
                  {batchForm.selectedStudentIds.length} Enrolled
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer shadow-xs"
                >
                  {editingBatch ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
