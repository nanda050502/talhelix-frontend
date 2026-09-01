import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  Smartphone,
  Radio,
  Globe,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

export const InstitutionDashboard: React.FC = () => {
  const {
    user,
    students,
    batches,
    attendanceRecords,
    announcements,
    navigateTo,
    getLiveBatchForFaculty,
  } = useApp();

  const liveBatchInfo = getLiveBatchForFaculty();

  // Metrics calculations
  const totalStudents = students.length;
  const totalBatches = batches.length;

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === today);

  const presentCount = todayRecords.filter((r) => r.status === 'PRESENT').length;
  const absentCount = todayRecords.filter((r) => r.status === 'ABSENT').length;
  const lateCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const totalMarked = todayRecords.length || 1;

  const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 92;

  // Channel breakdown
  const mobileCount = attendanceRecords.filter((r) => r.source === 'mobile-app').length;
  const webManualCount = attendanceRecords.filter((r) => r.source === 'web-manual').length;
  const rfidCount = attendanceRecords.filter((r) => r.source === 'rfid').length;
  const totalSourceRecords = attendanceRecords.length || 1;

  const lowAttendanceStudents = students.filter(
    (s) => (s.academicRecord?.attendancePercentage ?? 90) < 75
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
              {user.institutionName || 'Stanford University'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Institution Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800 font-semibold">{user.name}</strong>. Monitor campus attendance, batch schedules, and sync channels in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/institution/mobile-sync')}
            className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-slate-500" />
            <span>Mobile App API</span>
          </button>
          <button
            onClick={() => navigateTo('/institution/attendance')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* Top Highlight: Live Class Session Query Card — clean minimal */}
      {liveBatchInfo.isLive && liveBatchInfo.batch && (
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    Live Session In Progress
                  </span>
                  <span className="text-xs text-slate-500">• Room {liveBatchInfo.schedule?.venueRoom || 'Turing Hall 301'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {liveBatchInfo.batch.name} — {liveBatchInfo.schedule?.subjectName}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Scheduled Window: <span className="font-semibold text-slate-800">{liveBatchInfo.schedule?.startTime} – {liveBatchInfo.schedule?.endTime}</span> • Assigned Faculty: <span className="text-blue-700 font-medium">{liveBatchInfo.schedule?.facultyName || user.name}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('/institution/attendance')}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Take Live Attendance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Students */}
        <div
          onClick={() => navigateTo('/institution/students')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Enrolled</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{totalStudents}</div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">100%</span> roster synchronized
            </div>
          </div>
        </div>

        {/* Card 2: Batches */}
        <div
          onClick={() => navigateTo('/institution/batches')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Academic Batches</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{totalBatches}</div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="text-indigo-600 font-semibold">{totalBatches} active</span> cohorts
            </div>
          </div>
        </div>

        {/* Card 3: Today's Attendance Rate */}
        <div
          onClick={() => navigateTo('/institution/reports')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Today Attendance</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-emerald-600 tracking-tight">{attendanceRate}%</div>
            <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
              <span className="text-emerald-700 font-medium">{presentCount || 7} Present</span>
              <span>•</span>
              <span className="text-rose-600 font-medium">{absentCount || 1} Absent</span>
            </div>
          </div>
        </div>

        {/* Card 4: Low Attendance Alert */}
        <div
          onClick={() => navigateTo('/institution/students')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Attendance At-Risk</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-amber-600 tracking-tight">
              {lowAttendanceStudents.length} Students
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              Below 75% minimum threshold
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Channel Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Multi-Channel Attendance Reconciliation */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span>Attendance Capture by Channel</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Reconciliation across Mobile App, Web Manual, and RFID hardware interfaces
              </p>
            </div>
            <button
              onClick={() => navigateTo('/institution/mobile-sync')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>API Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  Mobile App
                </span>
                <span className="font-bold text-blue-700">
                  {Math.round((mobileCount / totalSourceRecords) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{mobileCount}</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${(mobileCount / totalSourceRecords) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Web Manual
                </span>
                <span className="font-bold text-indigo-700">
                  {Math.round((webManualCount / totalSourceRecords) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{webManualCount}</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${(webManualCount / totalSourceRecords) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Radio className="w-4 h-4 text-amber-600" />
                  RFID Gateway
                </span>
                <span className="font-bold text-amber-700">
                  {Math.round((rfidCount / totalSourceRecords) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{rfidCount}</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(rfidCount / totalSourceRecords) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Recent Marking Audit Log */}
          <div className="pt-2">
            <div className="text-sm font-bold text-slate-900 mb-3">Recent Attendance Activity</div>
            <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
              {attendanceRecords.slice(0, 4).map((record) => (
                <div key={record.id} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        record.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : record.status === 'LATE'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {record.status === 'PRESENT' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : record.status === 'LATE' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{record.studentName}</div>
                      <div className="text-xs text-slate-500">
                        {record.registerNumber} • {record.batchName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        record.source === 'mobile-app'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : record.source === 'rfid'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {record.source}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{record.sessionTimeWindow}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right (1 col): Notices & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3">Quick Navigation</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigateTo('/institution/attendance')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition-colors cursor-pointer group"
              >
                <ClipboardCheck className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-900">Mark Session</div>
                <div className="text-xs text-slate-500">Manual / Batch</div>
              </button>

              <button
                onClick={() => navigateTo('/institution/batches')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition-colors cursor-pointer group"
              >
                <CalendarDays className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-900">Batches</div>
                <div className="text-xs text-slate-500">Class schedules</div>
              </button>

              <button
                onClick={() => navigateTo('/institution/students')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition-colors cursor-pointer group"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-900">Students</div>
                <div className="text-xs text-slate-500">CSV bulk import</div>
              </button>

              <button
                onClick={() => navigateTo('/institution/emergency-attendance')}
                className="p-3 rounded-lg bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-left transition-colors cursor-pointer group"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-900">Override</div>
                <div className="text-xs text-slate-500">Emergency audit</div>
              </button>
            </div>
          </div>

          {/* Active Notices Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Campus Notices</h2>
              <button
                onClick={() => navigateTo('/institution/announcements')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {announcements.slice(0, 2).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={`font-semibold uppercase px-1.5 py-0.5 rounded ${
                        ann.priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : ann.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-slate-500">{ann.publishedAt}</span>
                  </div>
                  <div className="font-semibold text-slate-800">{ann.title}</div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
