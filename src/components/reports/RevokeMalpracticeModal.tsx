import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  UserMinus,
  CheckCircle2,
  FileWarning,
  Info,
} from 'lucide-react';
import { StudentAssignment, MalpracticeFlagCategory } from '../../types';

interface RevokeMalpracticeModalProps {
  assignment: StudentAssignment;
  studentName: string;
  studentId: number;
  onClose: () => void;
  onConfirmRevoke: (
    assignmentId: string,
    reason: string,
    isMalpractice: boolean,
    malpracticeCategory: MalpracticeFlagCategory,
    simulateTenantError?: boolean
  ) => void;
}

export const RevokeMalpracticeModal: React.FC<RevokeMalpracticeModalProps> = ({
  assignment,
  studentName,
  studentId,
  onClose,
  onConfirmRevoke,
}) => {
  const [actionType, setActionType] = useState<'MALPRACTICE' | 'ADMINISTRATIVE'>('MALPRACTICE');
  const [category, setCategory] = useState<MalpracticeFlagCategory>('MANUAL_PROCTOR');
  const [reasonPreset, setReasonPreset] = useState('Cheating / Malpractice detected during active session');
  const [customNotes, setCustomNotes] = useState('');
  const [simulateTenantError, setSimulateTenantError] = useState(false);

  const presets = [
    'Cheating / Malpractice detected during active session',
    'Multiple unauthorized tab switches / browser exit detected',
    'Simultaneous login and assessment access from secondary device',
    'Proctor recorded candidate communicating or looking away from camera',
    'Safe Exam Browser sandbox tampering / VM detection breach',
    'Plagiarism or unauthorized copy-pasting of code solutions',
  ];

  const handleConfirm = () => {
    const finalReason = customNotes.trim()
      ? `${reasonPreset} — ${customNotes.trim()}`
      : reasonPreset;

    onConfirmRevoke(
      assignment.id,
      finalReason,
      actionType === 'MALPRACTICE',
      category,
      simulateTenantError
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                actionType === 'MALPRACTICE'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {actionType === 'MALPRACTICE' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <UserMinus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {actionType === 'MALPRACTICE'
                  ? 'Mark Malpractice & Revoke Assessment'
                  : 'Administrative Unassign / Revocation'}
              </h3>
              <p className="text-xs text-slate-500">Candidate: {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm">
          {/* Target Assessment Badge */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Assessment
            </p>
            <p className="font-bold text-slate-900">{assignment.assessmentTitle}</p>
            <p className="font-mono text-xs text-slate-500">
              UUID: {assignment.assessmentUuid || assignment.assessmentId}
            </p>
          </div>

          {/* Action Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Revocation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType('MALPRACTICE')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  actionType === 'MALPRACTICE'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Malpractice / Cheating</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('ADMINISTRATIVE')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  actionType === 'ADMINISTRATIVE'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserMinus className="w-3.5 h-3.5 text-blue-600" />
                <span>Standard Unassign</span>
              </button>
            </div>
          </div>

          {actionType === 'MALPRACTICE' ? (
            <>
              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Violation Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MalpracticeFlagCategory)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="MANUAL_PROCTOR">Manual Proctor Flag (Visual / Audio Cheat)</option>
                  <option value="TAB_SWITCH">Tab Switch / Background Application</option>
                  <option value="MULTIPLE_DEVICES">Multiple Device Concurrent Session</option>
                  <option value="COPY_PASTE_VIOLATION">Copy-Paste Violation / Plagiarism</option>
                  <option value="SEB_BREACH">Safe Exam Browser Integrity Breach</option>
                  <option value="IMPERSONATION">Impersonation / Multiple Faces Detected</option>
                </select>
              </div>

              {/* Reason Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason Description
                </label>
                <select
                  value={reasonPreset}
                  onChange={(e) => setReasonPreset(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none mb-2"
                >
                  {presets.map((p, i) => (
                    <option key={i} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <textarea
                  rows={2}
                  placeholder="Additional proctor audit notes (optional)..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Warning box */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Security Enforcement:</strong> This will revoke the candidate's active
                  assessment session, mark their transcript as <strong>MALPRACTICE</strong>, and
                  record an official integrity violation in their security audit logs.
                </p>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Unassign Reason
              </label>
              <input
                type="text"
                value={reasonPreset}
                onChange={(e) => setReasonPreset(e.target.value)}
                placeholder="Reason for administrative unassignment..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Simulate Tenant Error Option (to test exact production screenshot toast behavior) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={simulateTenantError}
                onChange={(e) => setSimulateTenantError(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Simulate tenant error (Unassign failed toast)</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              actionType === 'MALPRACTICE'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {actionType === 'MALPRACTICE' ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Revoke &amp; Flag Malpractice</span>
              </>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                <span>Confirm Unassign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
