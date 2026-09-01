import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Trash2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { MalpracticeFlag, MalpracticeFlagCategory, Student } from '../../types';

interface StudentFlagsSectionProps {
  student: Student;
  onAddFlag: (flagData: {
    reason: string;
    category: MalpracticeFlagCategory;
    sessionId?: string;
    flaggedBy?: string;
  }) => void;
  onResolveFlag: (flagId: string, notes: string, action?: 'RESOLVE' | 'DISMISS') => void;
  onDeleteFlag: (flagId: string, reason?: string) => void;
}

export const StudentFlagsSection: React.FC<StudentFlagsSectionProps> = ({
  student,
  onAddFlag,
  onResolveFlag,
  onDeleteFlag,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<MalpracticeFlagCategory>('TAB_SWITCH');
  const [reason, setReason] = useState('');
  const [resolvingFlagId, setResolvingFlagId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const flags = student.flagsHistory || [];
  const activeFlags = flags.filter((f) => f.status === 'ACTIVE');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    onAddFlag({
      reason: reason.trim(),
      category,
      flaggedBy: 'Admin Proctor',
    });

    setReason('');
    setShowAddForm(false);
  };

  const handleResolveSubmit = (flagId: string, action: 'RESOLVE' | 'DISMISS') => {
    onResolveFlag(flagId, resolutionNotes.trim() || 'Reviewed and closed by proctor.', action);
    setResolvingFlagId(null);
    setResolutionNotes('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Malpractice &amp; Exam Integrity Record
            </h3>
            <p className="text-xs text-slate-500">
              {activeFlags.length} active flag(s) • {flags.length} total integrity incidents logged
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cancel' : 'Add Integrity Flag'}</span>
        </button>
      </div>

      {/* Add Flag inline form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-3 animate-in fade-in duration-150 text-xs"
        >
          <p className="font-bold text-rose-900">Record Manual Malpractice / Integrity Flag</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Violation Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MalpracticeFlagCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="TAB_SWITCH">Tab Switch / Background Application</option>
                <option value="MULTIPLE_DEVICES">Multiple Device Concurrent Session</option>
                <option value="COPY_PASTE_VIOLATION">Copy-Paste Violation / Plagiarism</option>
                <option value="SEB_BREACH">Safe Exam Browser Integrity Breach</option>
                <option value="MANUAL_PROCTOR">Manual Proctor Flag (Visual / Audio Cheat)</option>
                <option value="IMPERSONATION">Impersonation / Multiple Faces Detected</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Violation Description</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Student navigated to external IDE during active test"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 shadow-2xs"
            >
              Save Flag to Record
            </button>
          </div>
        </form>
      )}

      {/* Flags List */}
      {flags.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
          <p className="font-semibold text-slate-700">Clean Integrity Record</p>
          <p className="text-slate-400 text-xs">
            No cheating, multi-device, or proctor violations detected for this candidate.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {flags.map((flag) => {
            const isActive = flag.status === 'ACTIVE';

            return (
              <div
                key={flag.id}
                className={`p-3.5 rounded-lg border text-xs transition-colors ${
                  isActive ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50/50 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-xs tracking-wider uppercase border ${
                        isActive
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {flag.status}
                    </span>
                    <span className="font-bold text-slate-900">{flag.category.replace('_', ' ')}</span>
                  </div>

                  <span className="text-xs text-slate-500 font-mono">
                    {flag.timestamp} • Flagged by {flag.flaggedBy || 'System AI Proctor'}
                  </span>
                </div>

                <p className="mt-1.5 text-slate-700 font-medium">{flag.reason}</p>

                {flag.resolutionNotes && (
                  <p className="mt-1 text-xs text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                    <strong>Resolution note:</strong> {flag.resolutionNotes} (by{' '}
                    {flag.resolvedBy || 'Proctor'})
                  </p>
                )}

                {isActive && (
                  <div className="mt-2.5 pt-2 border-t border-rose-100 flex items-center justify-end gap-2">
                    {resolvingFlagId === flag.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add resolution explanation..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleResolveSubmit(flag.id, 'RESOLVE')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleResolveSubmit(flag.id, 'DISMISS')}
                          className="px-2.5 py-1 bg-slate-600 text-white rounded text-xs font-semibold hover:bg-slate-700"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => setResolvingFlagId(null)}
                          className="px-2 py-1 text-slate-500 text-xs hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setResolvingFlagId(flag.id)}
                          className="px-2.5 py-1 text-blue-700 hover:text-blue-900 bg-blue-50 rounded border border-blue-200 text-xs font-medium transition-colors"
                        >
                          Resolve Flag
                        </button>
                        <button
                          onClick={() => onDeleteFlag(flag.id, 'Admin dismissed')}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete flag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
