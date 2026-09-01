import React from 'react';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Clock,
  Code,
  FileText,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  UserX,
  XCircle,
} from 'lucide-react';
import { StudentAssignment } from '../../types';

interface AssignmentsTableProps {
  assignments: StudentAssignment[];
  onOpenRevokeModal: (assignment: StudentAssignment) => void;
  onReinstate?: (assignmentId: string) => void;
  onViewDetails: (assignment: StudentAssignment) => void;
}

export const AssignmentsTable: React.FC<AssignmentsTableProps> = ({
  assignments,
  onOpenRevokeModal,
  onReinstate,
  onViewDetails,
}) => {
  if (assignments.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">No assessments assigned</p>
        <p className="text-xs text-slate-400 mt-1">
          No assessment assignments found matching the current filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-xs">
              <th className="py-3 px-4">Assessment</th>
              <th className="py-3 px-3 text-center">Published</th>
              <th className="py-3 px-3">Assigned</th>
              <th className="py-3 px-3">Window</th>
              <th className="py-3 px-3">Attendance</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {assignments.map((asg) => {
              const isRevoked = asg.status === 'REVOKED' || asg.sessionStatus === 'revoked';
              const isMalpractice = asg.revocationType === 'MALPRACTICE_CHEATING';
              const isSubmitted = asg.sessionStatus === 'submitted' || asg.status === 'COMPLETED';
              const isNotStarted = asg.sessionStatus === 'not started' && !isRevoked;
              const isInProgress = asg.sessionStatus === 'in progress' && !isRevoked;

              const uuid =
                asg.assessmentUuid ||
                (asg.id.startsWith('asg-')
                  ? `${asg.id.replace('asg-', '')}-3a0c-490b-b324-e128640cd62e`
                  : asg.id);

              return (
                <tr
                  key={asg.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isRevoked ? 'bg-rose-50/30' : ''
                  }`}
                >
                  {/* Assessment Title & UUID */}
                  <td className="py-3 px-4 max-w-[280px] sm:max-w-xs">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        {asg.isCodingAssessment && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold"
                            title="Coding Assessment"
                          >
                            <Code className="w-3 h-3" />
                            COD
                          </span>
                        )}
                        <span
                          className="font-bold text-slate-900 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => onViewDetails(asg)}
                        >
                          {asg.assessmentTitle}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-500 truncate" title={uuid}>
                        {uuid}
                      </span>
                    </div>
                  </td>

                  {/* Published */}
                  <td className="py-3 px-3 text-center">
                    <span className="text-slate-700 font-medium">
                      {asg.published !== false ? 'Yes' : 'No'}
                    </span>
                  </td>

                  {/* Assigned Timestamp */}
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                    {asg.assignedAt || '8/21/2026, 7:10:03 PM'}
                  </td>

                  {/* Window */}
                  <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                    {asg.windowLabel || 'anytime'}
                  </td>

                  {/* Attendance Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {asg.attendanceStatus === 'VERIFIED' || asg.attendanceStatus === 'CONSUMED' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Present
                      </span>
                    ) : asg.attendanceStatus === 'ABSENT' ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-medium text-xs bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Absent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Gate Ready
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isRevoked ? (
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-xs border ${
                            isMalpractice
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <ShieldAlert className="w-3 h-3" />
                          {isMalpractice ? 'Malpractice Revoked' : 'Revoked'}
                        </span>
                        {asg.revocationReason && (
                          <span
                            className="text-xs text-slate-500 truncate max-w-[140px]"
                            title={asg.revocationReason}
                          >
                            {asg.revocationReason}
                          </span>
                        )}
                      </div>
                    ) : isSubmitted ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          submitted
                        </span>
                        {asg.scoreSummary && (
                          <span className="text-xs text-slate-500 font-mono">
                            {asg.scoreSummary.score}/{asg.scoreSummary.maxScore} (
                            {asg.scoreSummary.percentage}%)
                          </span>
                        )}
                      </div>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-xs">
                        <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                        in progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-xs">
                        not started
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetails(asg)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-xs transition-colors cursor-pointer"
                        title="View Submission Details & Scorecard"
                      >
                        Details
                      </button>

                      {isRevoked ? (
                        onReinstate && (
                          <button
                            onClick={() => onReinstate(asg.id)}
                            className="px-2.5 py-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Reinstate Assessment for Student"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reinstate</span>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => onOpenRevokeModal(asg)}
                          className="px-2.5 py-1 text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-md font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Revoke Assignment & Mark Malpractice"
                        >
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
