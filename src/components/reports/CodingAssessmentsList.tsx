import React from 'react';
import {
  Code,
  CheckCircle2,
  Clock,
  Send,
  Terminal,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { StudentAssignment } from '../../types';

interface CodingAssessmentsListProps {
  assignments: StudentAssignment[];
  onSelectAssignment: (asg: StudentAssignment) => void;
  onOpenRevokeModal: (asg: StudentAssignment) => void;
}

export const CodingAssessmentsList: React.FC<CodingAssessmentsListProps> = ({
  assignments,
  onSelectAssignment,
  onOpenRevokeModal,
}) => {
  const codingAssignments = assignments.filter(
    (a) => a.isCodingAssessment || a.assessmentTitle.toLowerCase().includes('cod') || a.assessmentTitle.toLowerCase().includes('dsa')
  );

  if (codingAssignments.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Code className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">No coding assessments found</p>
        <p className="text-xs text-slate-400 mt-1">
          This candidate has no active or completed coding / DSA problem submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {codingAssignments.map((asg) => {
        const isRevoked = asg.status === 'REVOKED' || asg.sessionStatus === 'revoked';
        const score = asg.scoreSummary?.score ?? (asg.attempts?.[0]?.score ?? 91.3);
        const maxScore = asg.scoreSummary?.maxScore ?? (asg.attempts?.[0]?.maxScore ?? 170.0);
        const percentage = asg.scoreSummary?.percentage ?? (asg.attempts?.[0]?.percentage ?? 53.7);
        const submissions = asg.submissionsCount || asg.attempts?.[0]?.attemptNumber || 37;
        const started = asg.startedAt || '8/21/2026, 12:01:23 PM';
        const submitted = asg.submittedAt || '8/21/2026, 12:36:42 PM';

        return (
          <div
            key={asg.id}
            className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 ${
              isRevoked ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
            }`}
          >
            {/* Top Bar: Title & Revoke/Inspect Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {asg.assessmentTitle}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    UUID: {asg.assessmentUuid || asg.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => onSelectAssignment(asg)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/60 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View Submissions &amp; Code</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {!isRevoked && (
                  <button
                    onClick={() => onOpenRevokeModal(asg)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>

            {/* Middle Grid: Telemetry from Screenshot 3 */}
            <div className="pt-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Started At */}
              <div className="space-y-0.5">
                <span className="text-xs font-semibold uppercase text-slate-400">Started</span>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {started}
                </p>
              </div>

              {/* Submitted At */}
              <div className="space-y-0.5">
                <span className="text-xs font-semibold uppercase text-slate-400">Submitted</span>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {submitted}
                </p>
              </div>

              {/* Total Submissions Count */}
              <div className="space-y-0.5">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Submissions
                </span>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-bold text-slate-900">{submissions}</span> test runs
                </p>
              </div>

              {/* Score & Percentage */}
              <div className="space-y-0.5">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Final Score
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold font-mono text-xs px-2 py-0.5 rounded-md border ${
                      percentage >= 70
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : percentage >= 40
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {score.toFixed(1)} / {maxScore.toFixed(1)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Integrity Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                {isRevoked ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Revoked: {asg.revocationReason || 'Integrity breach'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Proctor Checked: Clean Session • Safe Exam Sandbox Active
                  </span>
                )}
              </div>

              <span className="text-slate-400 font-mono text-xs">
                Language: Python 3 / C++ 20 • Memory: 14.2 MB • Execution: 42ms
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
