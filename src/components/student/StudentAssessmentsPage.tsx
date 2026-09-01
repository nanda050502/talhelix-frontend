import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Assessment, StudentAssignment } from '../../types';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Play,
  FileText,
  Sparkles,
  X,
  HelpCircle,
} from 'lucide-react';

export const StudentAssessmentsPage: React.FC = () => {
  const { assessments, students, user, studentReports, navigateTo } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'completed'>('all');
  const [selectedAssessmentForModal, setSelectedAssessmentForModal] = useState<(Assessment & { _assignment?: StudentAssignment }) | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const userReports = studentReports[user.email.toLowerCase()] || [];

  // Single source of truth: derive assigned assessments from the student's assignments (synced with admin panel)
  const currentStudent = useMemo(
    () => students.find((s) => s.id === user.studentId || s.email.toLowerCase() === user.email.toLowerCase()),
    [students, user]
  );

  const studentAssignments = useMemo(
    () => (currentStudent?.assignments || []).filter((a) => a.status !== 'REVOKED' && a.status !== 'EXPIRED'),
    [currentStudent]
  );

  const assignedAssessments = useMemo(() => {
    // Join assignments → assessments; fallback to synthetic assessment if global assessment missing (e.g., orphan mock ids)
    const list: Array<Assessment & { _assignment: StudentAssignment }> = studentAssignments.map((a) => {
      const assessment = assessments.find((asm) => asm.id === a.assessmentId);
      if (assessment) return { ...assessment, _assignment: a } as Assessment & { _assignment: StudentAssignment };
      return {
        id: a.assessmentId,
        title: a.assessmentTitle,
        description: `Assigned on ${new Date(a.assignedAt).toLocaleDateString()} • ${a.validUntil ? `Due ${new Date(a.validUntil).toLocaleDateString()}` : 'No due date'}`,
        instructions: 'Complete within the assigned window. Contact admin if attendance verification is pending.',
        duration: a.duration || 60,
        passingScore: 50,
        kind: 'Assigned assessment',
        publishImmediately: true,
        requireSafeExamBrowser: false,
        category: 'Assigned',
        status: 'Published' as const,
        questionsCount: 12,
        createdAt: a.assignedAt,
        questions: [],
        _assignment: a,
      } as Assessment & { _assignment: StudentAssignment };
    });
    // Dedupe by assessmentId (keep most recent assignment for duplicate assigns)
    const seen = new Map<string, (Assessment & { _assignment: StudentAssignment })>();
    for (const item of list) {
      const existing = seen.get(item.id);
      if (!existing || new Date(item._assignment.assignedAt) > new Date(existing._assignment.assignedAt)) {
        seen.set(item.id, item);
      }
    }
    return Array.from(seen.values());
  }, [studentAssignments, assessments]);

  // For backward compatibility, publishedAssessments now means "assigned & published"
  const publishedAssessments = assignedAssessments;

  const categories = ['All', ...Array.from(new Set(publishedAssessments.map((a) => a.category).filter(Boolean)))];

  const filteredAssessments = publishedAssessments.filter((asm) => {
    const assignment = (asm as any)._assignment as StudentAssignment | undefined;
    // Completed if either a report exists OR assignment is marked COMPLETED/submitted
    const isCompleted =
      userReports.some((r) => r.assessmentId === asm.id) ||
      assignment?.status === 'COMPLETED' ||
      assignment?.sessionStatus === 'submitted';

    // Tab filter
    if (filterTab === 'available' && isCompleted) return false;
    if (filterTab === 'completed' && !isCompleted) return false;

    // Category filter
    if (selectedCategory !== 'All' && asm.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        asm.title.toLowerCase().includes(q) ||
        (asm.description && asm.description.toLowerCase().includes(q)) ||
        (asm.category && asm.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStartClick = (asm: Assessment) => {
    setSelectedAssessmentForModal(asm);
    setAgreeTerms(false);
  };

  const handleLaunchExam = async () => {
    if (!selectedAssessmentForModal) return;
    const asmId = selectedAssessmentForModal.id;
    setSelectedAssessmentForModal(null);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch {
      // Ignored if browser blocks, the ExamSecurityOverlay will re-prompt
    }
    navigateTo(`/student/exam/${asmId}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Assigned Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse and take scheduled evaluations for {user.department || 'Computer Science'}
          </p>
        </div>

        {/* Quick Filter Tabs — counts synced with assignments (admin ↔ student) */}
        {(() => {
          const isCompletedForTab = (asm: Assessment & { _assignment?: StudentAssignment }) =>
            userReports.some((r) => r.assessmentId === asm.id) ||
            asm._assignment?.status === 'COMPLETED' ||
            asm._assignment?.sessionStatus === 'submitted';
          const completedCount = publishedAssessments.filter(isCompletedForTab).length;
          const availableCount = publishedAssessments.length - completedCount;
          return (
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tests ({publishedAssessments.length})
              </button>
              <button
                onClick={() => setFilterTab('available')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterTab === 'available' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Available ({availableCount})
              </button>
              <button
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterTab === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          );
        })()}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assessments by title, subject, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Assessment Cards Grid — now synced with admin assignments */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {publishedAssessments.length === 0 ? 'No assessments assigned yet' : 'No assessments found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {publishedAssessments.length === 0
              ? 'Your administrator has not assigned any assessments to your account yet. Contact your instructor if you expect an assignment.'
              : 'Try adjusting your search criteria or switching filter tabs.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssessments.map((asm) => {
            const report = userReports.find((r) => r.assessmentId === asm.id);
            const assignment = (asm as any)._assignment as StudentAssignment | undefined;
            const isCompleted =
              Boolean(report) ||
              assignment?.status === 'COMPLETED' ||
              assignment?.sessionStatus === 'submitted';
            const isGated =
              assignment?.attendanceGated && assignment?.attendanceStatus === 'PENDING_CHECKIN';
            const isRevoked = assignment?.status === 'REVOKED';

            return (
              <div
                key={asm.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {asm.category || 'General'}
                    </span>

                    {asm.requireSafeExamBrowser && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Shield className="w-3 h-3 text-slate-500" />
                        Safe Browser
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{asm.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {asm.description || 'Evaluation covering technical foundations and scenario questions.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-xs">Duration</span>
                      <span className="font-bold text-slate-800">{asm.duration} min</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Questions</span>
                      <span className="font-bold text-slate-800">{asm.questionsCount} items</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Pass Mark</span>
                      <span className="font-bold text-slate-800">{asm.passingScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer / Action — assignment-aware with attendance gate & revocation */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  {isRevoked ? (
                    <>
                      <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Revoked
                      </span>
                      <span className="text-xs text-slate-500">{assignment?.revocationReason || 'Contact admin'}</span>
                    </>
                  ) : isCompleted ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700">
                          {report?.percentage ?? assignment?.scoreSummary?.percentage ?? 0}% ({report?.status || 'Completed'})
                        </span>
                      </div>
                      <button
                        onClick={() => navigateTo('/student/results')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Scorecard</span>
                      </button>
                    </>
                  ) : isGated ? (
                    <>
                      <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Attendance Required
                      </span>
                      <span className="text-xs text-slate-500">Check in with proctor</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-slate-500">
                        {assignment ? `Due ${assignment.validUntil ? new Date(assignment.validUntil).toLocaleDateString() : 'anytime'}` : 'Not Attempted'}
                      </span>
                      <button
                        onClick={() => handleStartClick(asm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Take Test</span>
                      </button>
                    </>
                  )}
                </div>
                {/* Assignment meta row — keeps admin and student views in sync */}
                {assignment && (
                  <div className="px-5 pb-3 -mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono">{assignment.id}</span>
                    <span>•</span>
                    <span>{assignment.attendanceStatus}</span>
                    {assignment.windowLabel && (
                      <>
                        <span>•</span>
                        <span>{assignment.windowLabel}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pre-Exam Instructions Modal */}
      {selectedAssessmentForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Pre-Examination Briefing
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedAssessmentForModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssessmentForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-blue-900 text-sm">Exam Parameters</h4>
                <div className="grid grid-cols-2 gap-2 text-blue-800">
                  <p>• Duration: <span className="font-bold">{selectedAssessmentForModal.duration} Minutes</span></p>
                  <p>• Passing Score: <span className="font-bold">{selectedAssessmentForModal.passingScore}%</span></p>
                  <p>• Total Questions: <span className="font-bold">{selectedAssessmentForModal.questionsCount}</span></p>
                  <p>• Mode: <span className="font-bold">Automated Proctoring</span></p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Proctoring & Lockdown Security Rules:</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  <li><strong>Full-Screen Lockdown:</strong> The test will automatically enter and enforce full-screen mode.</li>
                  <li><strong>Clipboard Security:</strong> Copy, paste, and cut operations are strictly blocked.</li>
                  <li><strong>Anti-Screenshot:</strong> PrintScreen, screen snipping, and capture shortcuts are disabled.</li>
                  <li><strong>Continuous Proctoring:</strong> Tab switching and window focus losses are recorded.</li>
                </ul>
              </div>

              {/* Acknowledgement Checkbox */}
              <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I agree to enter Full-Screen mode and follow all examination integrity rules.
                </span>
              </label>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAssessmentForModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!agreeTerms}
                onClick={handleLaunchExam}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Assessment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
