import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Code,
  Send,
  ShieldCheck,
  ShieldAlert,
  Award,
  BookOpen,
  Calendar,
  Building,
  Check,
} from 'lucide-react';
import { StudentAssignment } from '../../types';

interface AssessmentDetailModalProps {
  assignment: StudentAssignment;
  studentName: string;
  onClose: () => void;
  onOpenRevoke: (asg: StudentAssignment) => void;
}

export const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({
  assignment,
  studentName,
  onClose,
  onOpenRevoke,
}) => {
  const isRevoked = assignment.status === 'REVOKED' || assignment.sessionStatus === 'revoked';
  const score = assignment.scoreSummary?.score ?? (assignment.attempts?.[0]?.score ?? 92.0);
  const maxScore = assignment.scoreSummary?.maxScore ?? (assignment.attempts?.[0]?.maxScore ?? 100.0);
  const percentage = assignment.scoreSummary?.percentage ?? (assignment.attempts?.[0]?.percentage ?? 92.0);
  const submissions = assignment.submissionsCount || 18;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  isRevoked
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {isRevoked ? 'REVOKED' : assignment.sessionStatus?.toUpperCase() || 'COMPLETED'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {assignment.assessmentUuid || assignment.id}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{assignment.assessmentTitle}</h2>
            <p className="text-xs text-slate-500">Student: {studentName}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Top Score Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Score</p>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {score} / {maxScore}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Accuracy</p>
              <p
                className={`text-xl font-extrabold mt-0.5 ${
                  percentage >= 75 ? 'text-emerald-600' : 'text-blue-600'
                }`}
              >
                {percentage}%
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Submissions</p>
              <p className="text-xl font-extrabold text-purple-600 mt-0.5">{submissions}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Proctor Status</p>
              <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                CLEAR
              </p>
            </div>
          </div>

          {/* Timestamps & Attendance Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-xs">
                Session Timing
              </span>
              <p className="text-slate-800 font-medium">
                <strong>Assigned:</strong> {assignment.assignedAt || '8/21/2026, 7:10:03 PM'}
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Started:</strong> {assignment.startedAt || '8/21/2026, 7:15:10 PM'}
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Submitted:</strong> {assignment.submittedAt || '8/21/2026, 7:58:32 PM'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-xs">
                Attendance &amp; Venue
              </span>
              <p className="text-slate-800 font-medium">
                <strong>Gate Status:</strong>{' '}
                <span className="text-emerald-600 font-bold">Present &amp; Verified</span>
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Venue:</strong>{' '}
                {assignment.attendanceVenue || 'TalHelix Automated IP Gate 01'}
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Gating:</strong>{' '}
                {assignment.attendanceGated ? 'Venue Required' : 'Open Access'}
              </p>
            </div>
          </div>

          {/* Revocation notice if revoked */}
          {isRevoked && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <ShieldAlert className="w-4 h-4" />
                <span>Revocation Record</span>
              </div>
              <p>
                <strong>Reason:</strong> {assignment.revocationReason || 'Cheating violation'}
              </p>
              <p>
                <strong>Revoked At:</strong> {assignment.revokedAt || 'Recent'} • By{' '}
                {assignment.revokedBy || 'Admin Proctor'}
              </p>
            </div>
          )}

          {/* Competency & Skill Mastery Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Competency Breakdown
            </h4>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Data Structures &amp; Complexity Analysis</span>
                  <span className="font-bold">95%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[95%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Algorithms, Trees &amp; Dynamic Programming</span>
                  <span className="font-bold">88%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[88%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Edge Case Handling &amp; Memory Efficiency</span>
                  <span className="font-bold">92%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-[92%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {!isRevoked ? (
            <button
              onClick={() => {
                onClose();
                onOpenRevoke(assignment);
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
            >
              Revoke &amp; Flag Malpractice
            </button>
          ) : (
            <span className="text-xs text-rose-600 font-semibold">
              Assignment currently revoked
            </span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Transcript
          </button>
        </div>
      </div>
    </div>
  );
};
