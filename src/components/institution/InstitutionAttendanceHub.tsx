import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceSource, AttendanceStatus } from '../../types';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Save,
  Download,
  Smartphone,
  Globe,
  Radio,
  QrCode,
  Users,
  Search,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

export const InstitutionAttendanceHub: React.FC = () => {
  const {
    students,
    batches,
    attendanceRecords,
    bulkMarkAttendance,
    markAttendanceRecord,
    showToast,
    user,
  } = useApp();

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'batch-cs-26a');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSource, setSelectedSource] = useState<AttendanceSource>('web-manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);

  const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const schedule = currentBatch?.scheduleWindows?.[0];

  // Get students belonging to selected batch
  const batchStudents = useMemo(() => {
    return students.filter((s) => s.batchId === selectedBatchId || !s.batchId);
  }, [students, selectedBatchId]);

  // Local state for interactive marking in progress
  const [localStatuses, setLocalStatuses] = useState<Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>(() => {
    const initial: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
    batchStudents.forEach((s) => {
      // Check existing records for today
      const existing = attendanceRecords.find(
        (r) => r.studentId === s.id && r.batchId === selectedBatchId && r.date === selectedDate
      );
      initial[s.id] = (existing?.status as any) || 'PRESENT';
    });
    return initial;
  });

  const [remarksMap, setRemarksMap] = useState<Record<number, string>>({});

  const handleStatusChange = (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setLocalStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    const updated: Record<number, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
    batchStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setLocalStatuses(updated);
    showToast(`Marked all ${batchStudents.length} students as ${status}`, 'info');
  };

  const handleSaveAll = () => {
    const recordsToSave = batchStudents.map((s) => ({
      studentId: s.id,
      status: localStatuses[s.id] || 'PRESENT',
      remarks: remarksMap[s.id] || '',
    }));

    bulkMarkAttendance(
      recordsToSave,
      selectedBatchId,
      selectedDate,
      `${schedule?.startTime || '09:00'} - ${schedule?.endTime || '10:30'}`,
      selectedSource
    );
  };

  // Metrics
  const filteredStudents = batchStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.registerNumber && s.registerNumber.includes(searchQuery)) ||
      (s.netId && s.netId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const presentCount = Object.values(localStatuses).filter((st) => st === 'PRESENT').length;
  const absentCount = Object.values(localStatuses).filter((st) => st === 'ABSENT').length;
  const lateCount = Object.values(localStatuses).filter((st) => st === 'LATE').length;
  const excusedCount = Object.values(localStatuses).filter((st) => st === 'EXCUSED').length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-blue-600" />
            <span>Attendance Marking & Verification Hub</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reconcile student presence across Web Manual, Mobile Scanner App, and RFID gateways.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowQRModal(true)}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Session QR Code</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Reconcile Session</span>
          </button>
        </div>
      </div>

      {/* Session Controls Banner */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Batch Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Academic Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.section})
                </option>
              ))}
            </select>
          </div>

          {/* Session Date */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Session Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Marking Source / Channel */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Marking Source Channel</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as AttendanceSource)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="web-manual">Web Manual (Instructor Portal)</option>
              <option value="mobile-app">Mobile App (Barcode / NFC)</option>
              <option value="rfid">RFID Gateway (Turnstile Log)</option>
            </select>
          </div>

          {/* Schedule Window Info */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Class Timetable Window</label>
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-blue-700 font-mono flex items-center justify-between text-xs">
              <span className="font-semibold">{schedule?.startTime || '09:00'} – {schedule?.endTime || '10:30'}</span>
              <span className="text-xs text-slate-500">{schedule?.venueRoom || 'Hall 301'}</span>
            </div>
          </div>
        </div>

        {/* Real-time Tally & Quick Batch Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-slate-500 font-medium">Tally:</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              {presentCount} Present
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              {absentCount} Absent
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              {lateCount} Late
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              {excusedCount} Excused
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium">Quick Fill:</span>
            <button
              onClick={() => handleMarkAll('PRESENT')}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('ABSENT')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              All Absent
            </button>
            <button
              onClick={() => handleMarkAll('LATE')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              All Late
            </button>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate in batch..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <span className="text-xs text-slate-500">
            Showing <strong className="text-slate-900 font-semibold">{filteredStudents.length}</strong> candidates in {currentBatch.name}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredStudents.map((student, idx) => {
            const currentStatus = localStatuses[student.id] || 'PRESENT';

            return (
              <div
                key={student.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-xs"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono w-5">{idx + 1}.</span>
                  <div
                    className={`w-9 h-9 rounded-xl ${
                      student.avatarColor || 'bg-blue-600'
                    } text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    {student.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{student.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-blue-700 font-medium">
                        {student.registerNumber || student.studentIdentifier}
                      </span>
                      <span>•</span>
                      <span>{student.netId ? `@${student.netId}` : student.email}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">
                        {student.academicRecord?.attendancePercentage || 92}% historic
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Way Marking Button Group */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleStatusChange(student.id, 'PRESENT')}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                      currentStatus === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={() => handleStatusChange(student.id, 'ABSENT')}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                      currentStatus === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Absent
                  </button>

                  <button
                    onClick={() => handleStatusChange(student.id, 'LATE')}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                      currentStatus === 'LATE'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Late
                  </button>

                  <button
                    onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                      currentStatus === 'EXCUSED'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Excused
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code Scanner Simulation Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Live Session QR Code</h2>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Display this dynamic QR on classroom projector for students to check in via TalHelix Mobile app.
            </p>

            {/* QR Visual */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mx-auto w-48 h-48 flex flex-col items-center justify-center shadow-inner">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>

            <div className="text-xs font-mono text-blue-700">
              Session Code: <span className="font-bold text-slate-900 text-sm">TH-STANFORD-CS26A</span>
            </div>

            <div className="text-xs text-slate-500">
              Auto-refreshes in 15 seconds • Source: mobile-app
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Close Display
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
