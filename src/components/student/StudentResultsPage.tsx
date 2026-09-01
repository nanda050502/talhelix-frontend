import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentReportItem } from '../../types';
import {
  FileText,
  Search,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  X,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export const StudentResultsPage: React.FC = () => {
  const { user, studentReports, navigateTo } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportForCertificate, setSelectedReportForCertificate] = useState<StudentReportItem | null>(null);

  const reports = studentReports[user.email.toLowerCase()] || [];

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return r.assessmentTitle.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
  });

  const avgPercentage =
    reports.length > 0
      ? Math.round(reports.reduce((acc, r) => acc + r.percentage, 0) / reports.length)
      : 0;

  const passedCount = reports.filter((r) => r.status === 'Passed').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transcripts & Scorecards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official evaluation records and verified performance analytics for {user.name}
          </p>
        </div>

        <button
          onClick={() => navigateTo('/student/assessments')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Take New Assessment</span>
        </button>
      </div>

      {/* 3 Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Tests Evaluated</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{reports.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total recorded submissions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Cumulative Average</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{avgPercentage}%</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Passed: {passedCount} / {reports.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Verified Certificates</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{passedCount}</p>
          <p className="text-xs text-indigo-600 mt-1">Ready for download</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcripts by assessment title or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Graded Evaluation History</h3>
          <span className="text-xs text-slate-500">{filteredReports.length} results</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No graded assessment transcripts match your query.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">{rep.assessmentTitle}</h4>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        rep.status === 'Passed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {rep.dateTaken}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Time: {rep.timeSpent}
                    </span>
                    <span>Dept: {rep.department}</span>
                  </div>

                  {/* Topic breakdown chips */}
                  {rep.topics && rep.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {rep.topics.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                        >
                          <span>{t.name}:</span>
                          <span className="font-bold text-slate-900">{t.score}%</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-2xl font-bold text-slate-900">{rep.percentage}%</span>
                    <p className="text-xs font-semibold text-emerald-600">
                      {rep.score} / {rep.maxScore} marks
                    </p>
                  </div>

                  {rep.status === 'Passed' && (
                    <button
                      onClick={() => setSelectedReportForCertificate(rep)}
                      className="px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Certificate Modal */}
      {selectedReportForCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setSelectedReportForCertificate(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Canvas — clean */}
            <div className="border border-slate-200 p-8 rounded-xl bg-white text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">
                  T
                </div>
                <span className="font-bold text-slate-900 text-lg">TalHelix Assessment Network</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-bold tracking-widest text-blue-700">
                  Certificate of Competency
                </span>
                <h3 className="text-2xl font-serif font-bold text-slate-900">
                  {user.name}
                </h3>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Has successfully demonstrated technical proficiency and completed all standardized assessment parameters for:
              </p>

              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs inline-block px-6">
                <p className="text-base font-bold text-blue-700">{selectedReportForCertificate.assessmentTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Final Score: <span className="font-bold text-slate-900">{selectedReportForCertificate.percentage}%</span> • Grade: A
                </p>
              </div>

              <div className="pt-6 grid grid-cols-2 text-xs text-slate-500 border-t border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800">{selectedReportForCertificate.dateTaken}</p>
                  <p className="text-xs">Issue Date</p>
                </div>
                <div>
                  <p className="font-mono text-slate-800">{selectedReportForCertificate.id}</p>
                  <p className="text-xs">Verification Hash</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedReportForCertificate(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
