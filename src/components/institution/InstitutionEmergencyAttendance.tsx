import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';

export const InstitutionEmergencyAttendance: React.FC = () => {
  const { batches, students, bulkMarkAttendance, showToast, user } = useApp();

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || 'batch-cs-26a');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [overrideStatus, setOverrideStatus] = useState<'EXCUSED' | 'PRESENT' | 'ABSENT'>('EXCUSED');
  const [reasonCategory, setReasonCategory] = useState('Campus Network/Power Outage');
  const [justificationNote, setJustificationNote] = useState('');
  const [supervisorCode, setSupervisorCode] = useState(user.employeeId || 'STAN-ADM-882');

  const [overrideLogs, setOverrideLogs] = useState([
    {
      id: 'ovr-1',
      date: new Date().toISOString().split('T')[0],
      batchName: 'CS 2026 - Section A',
      status: 'EXCUSED',
      reason: 'Midterm Server Migration in Turing Hall',
      authorizer: 'Dr. Arthur Mitchell (Dean of Academic Affairs)',
      affectedCount: 45,
      timestamp: 'Today, 08:30 AM',
    },
  ]);

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();

    if (!justificationNote.trim()) {
      showToast('Please provide a mandatory justification note for audit compliance', 'error');
      return;
    }

    const batchStudents = students.filter((s) => s.batchId === selectedBatchId || !s.batchId);
    const targetBatch = batches.find((b) => b.id === selectedBatchId);

    const records = batchStudents.map((s) => ({
      studentId: s.id,
      status: overrideStatus,
      remarks: `[EMERGENCY OVERRIDE: ${reasonCategory}] ${justificationNote} (Authorized by: ${supervisorCode})`,
    }));

    bulkMarkAttendance(records, selectedBatchId, targetDate, 'Emergency Override Window', 'web-manual');

    // Add to audit log
    const newLog = {
      id: `ovr-${Date.now()}`,
      date: targetDate,
      batchName: targetBatch?.name || 'CS 2026 Batch',
      status: overrideStatus,
      reason: `${reasonCategory} — ${justificationNote}`,
      authorizer: `${user.name} (${supervisorCode})`,
      affectedCount: batchStudents.length,
      timestamp: 'Just now',
    };

    setOverrideLogs([newLog, ...overrideLogs]);
    setJustificationNote('');
    showToast(`Emergency override logged: ${batchStudents.length} students updated`, 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          <span>Emergency Attendance Override</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Authorized administrative bulk override workflow with mandatory audit trail logging.
        </p>
      </div>

      {/* Override Action Card */}
      <div className="p-6 sm:p-7 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 text-amber-800 bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-xs font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Compliance Notice: All override transactions are permanently signed and timestamped in institutional compliance logs.
          </span>
        </div>

        <form onSubmit={handleApplyOverride} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select Batch *</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.section})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Date *</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Override Status *</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              >
                <option value="EXCUSED">EXCUSED (Medical / Weather / Campus Order)</option>
                <option value="PRESENT">PRESENT (Administrative Retroactive Check-in)</option>
                <option value="ABSENT">ABSENT (Mass Disqualification / Unexcused)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Reason Category *</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              >
                <option value="Campus Network/Power Outage">Campus Network / Power Outage</option>
                <option value="Inclement Weather Campus Closure">Inclement Weather Campus Closure</option>
                <option value="Official Institutional Event/Symposium">Official Institutional Event / Symposium</option>
                <option value="Proctor Hardware / RFID Gateway Failure">Proctor Hardware / RFID Gateway Failure</option>
                <option value="Dean Written Authorization">Dean Written Authorization</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Supervisor Authorization ID *</label>
              <input
                type="text"
                required
                value={supervisorCode}
                onChange={(e) => setSupervisorCode(e.target.value)}
                placeholder="e.g. STAN-ADM-882"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mandatory Justification Notes *</label>
            <textarea
              rows={3}
              required
              value={justificationNote}
              onChange={(e) => setJustificationNote(e.target.value)}
              placeholder="Detail the root cause and official authorization reference number for audit review..."
              className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Authorize Emergency Bulk Override</span>
            </button>
          </div>
        </form>
      </div>

      {/* Audit History Log */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Audit Log of Emergency Overrides</span>
        </h2>

        <div className="divide-y divide-slate-100 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
          {overrideLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white hover:bg-slate-50/80 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                    {log.status}
                  </span>
                  <span className="font-semibold text-slate-900">{log.batchName}</span>
                  <span className="text-slate-500">({log.affectedCount} students)</span>
                </div>
                <p className="text-slate-600 mt-1">{log.reason}</p>
                <div className="text-xs text-slate-400 mt-0.5">Authorized by: {log.authorizer}</div>
              </div>

              <div className="text-right text-xs text-slate-400 font-mono">
                {log.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
