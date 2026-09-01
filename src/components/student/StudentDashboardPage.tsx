import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  LayoutDashboard,
  BookOpenCheck,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Calendar,
  Zap,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user, assessments, students, studentReports, navigateTo } = useApp();

  const userReports = studentReports[user.email.toLowerCase()] || [];

  // Sync with admin assignments — single source of truth is students[].assignments
  const currentStudent = students.find((s) => s.id === user.studentId || s.email.toLowerCase() === user.email.toLowerCase());
  const studentAssignments = (currentStudent?.assignments || []).filter((a) => a.status !== 'REVOKED' && a.status !== 'EXPIRED');

  const assignedAssessments = studentAssignments
    .map((a) => {
      const asm = assessments.find((x) => x.id === a.assessmentId);
      if (asm) return asm;
      // Fallback synthetic for orphan mock ids (e.g., asm-35de) so admin ↔ student stays synced
      return {
        id: a.assessmentId,
        title: a.assessmentTitle,
        description: `Assigned on ${new Date(a.assignedAt).toLocaleDateString()}`,
        duration: a.duration || 60,
        passingScore: 50,
        kind: 'Assigned',
        publishImmediately: true,
        requireSafeExamBrowser: false,
        category: 'Assigned',
        status: 'Published' as const,
        questionsCount: 12,
        createdAt: a.assignedAt,
        questions: [],
      } as typeof assessments[0];
    })
    .filter((a) => a.status === 'Published');

  // Dedupe by id (multiple assignments for same assessment)
  const publishedAssessments = Array.from(new Map(assignedAssessments.map((a) => [a.id, a])).values());
  const completedCount = publishedAssessments.filter((a) =>
    userReports.some((r) => r.assessmentId === a.id)
  ).length;
  const assignedCount = publishedAssessments.length;

  const avgScore =
    userReports.length > 0
      ? Math.round(userReports.reduce((acc, r) => acc + r.percentage, 0) / userReports.length)
      : 88;

  // Next up: first assigned & published not yet completed
  const nextAssessment =
    publishedAssessments.find((a) => !userReports.some((r) => r.assessmentId === a.id)) ||
    publishedAssessments[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Student Welcome Header / Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <span>Candidate Portal • Term 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            Track your assigned evaluations, review question analyses, and achieve verified competencies across {user.department || 'Computer Science'}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => navigateTo('/student/assessments')}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm hover:bg-blue-700 shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>View All Assessments</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Assigned Tests</p>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {assignedCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{assignedCount - completedCount} tests pending</span>
          </div>
        </div>

        {/* Completed Tests */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Completed</p>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {completedCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{Math.round((completedCount / (assignedCount || 1)) * 100)}% completion rate</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Average Performance</p>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {avgScore}%
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top tier standing</span>
          </div>
        </div>

        {/* Verified Badges */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Earned Certificates</p>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {userReports.filter((r) => r.status === 'Passed').length}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 font-medium">
            <Award className="w-3.5 h-3.5" />
            <span>Verified credentials</span>
          </div>
        </div>
      </div>

      {/* 2-Column: Next Assessment Spotlight & Competency Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Next Assessment Spotlight (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {nextAssessment && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full pointer-events-none -mr-6 -mt-6" />

              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Ready to Take
                </span>
                <span className="text-xs text-slate-500 font-medium">{nextAssessment.category}</span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {nextAssessment.title}
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {nextAssessment.description || 'Comprehensive evaluation covering core paradigms, syntax, and problem-solving scenarios.'}
              </p>

              <div className="grid grid-cols-3 gap-3 my-5 py-3 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500">Duration</span>
                  <p className="font-bold text-slate-900 mt-0.5">{nextAssessment.duration} minutes</p>
                </div>
                <div>
                  <span className="text-slate-500">Passing Score</span>
                  <p className="font-bold text-slate-900 mt-0.5">{nextAssessment.passingScore}%</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Items</span>
                  <p className="font-bold text-slate-900 mt-0.5">{nextAssessment.questionsCount} questions</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Proctoring & Integrity checks active</span>
                </div>

                <button
                  onClick={() => navigateTo(`/student/exam/${nextAssessment.id}`)}
                  className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Start Assessment Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Recent Assessment Attempts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent Test Transcripts</h3>
                <p className="text-xs text-slate-500">Your latest graded submissions</p>
              </div>

              <button
                onClick={() => navigateTo('/student/results')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View all results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {userReports.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No completed assessments yet. Take your first test above!
                </div>
              ) : (
                userReports.slice(0, 3).map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{rep.assessmentTitle}</h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            rep.status === 'Passed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {rep.dateTaken}
                        </span>
                        <span>•</span>
                        <span>Time: {rep.timeSpent}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-slate-900">{rep.percentage}%</span>
                      <p className="text-xs text-emerald-600 font-semibold">
                        {rep.score}/{rep.maxScore} marks
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Competency & Skill Mastery (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Competency Matrix</h3>
            <p className="text-xs text-slate-500">Evaluated skill levels from submitted assessments</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>Python & Data Manipulation</span>
                <span className="text-blue-600">92%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>Relational Databases & SQL</span>
                <span className="text-blue-600">88%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>Java & Object-Oriented Design</span>
                <span className="text-blue-600">85%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>Data Structures & Algorithms</span>
                <span className="text-emerald-600">90%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '90%' }} />
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>Upcoming Exam Schedule</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Final term comprehensive evaluations close on June 15, 2024. Make sure to complete all assigned tests before the deadline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
