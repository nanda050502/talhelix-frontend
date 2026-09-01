import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  Calendar,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  Smartphone,
  Globe,
  Radio,
} from 'lucide-react';

export const InstitutionReports: React.FC = () => {
  const { students, batches, attendanceRecords, showToast } = useApp();

  const [selectedBatch, setSelectedBatch] = useState('ALL');

  const atRiskStudents = students.filter(
    (s) => (s.academicRecord?.attendancePercentage ?? 92) < 75
  );

  const totalRecords = attendanceRecords.length || 1;
  const mobileCount = attendanceRecords.filter((r) => r.source === 'mobile-app').length;
  const webCount = attendanceRecords.filter((r) => r.source === 'web-manual').length;
  const rfidCount = attendanceRecords.filter((r) => r.source === 'rfid').length;

  const handleExportCSV = () => {
    const headers = 'RegisterNumber,NetID,StudentName,Batch,Section,AttendanceRate,CGPA,Status\n';
    const rows = students
      .map(
        (s) =>
          `"${s.registerNumber || s.studentIdentifier}","${s.netId || ''}","${s.name}","${
            s.batchName || 'CS'
          }","${s.section || 'A'}",${s.academicRecord?.attendancePercentage || 92}%,${
            s.academicRecord?.cgpa || 3.85
          },${s.status}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TalHelix_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Exported official attendance report CSV', 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <span>Institutional Reports & Compliance</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregate attendance rates, channel reconciliation breakdown, and student eligibility audits.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Compliance CSV</span>
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Campus Attendance Average</span>
          <div className="text-3xl font-bold text-slate-900 mt-2">91.4%</div>
          <div className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.1% from previous semester</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">At-Risk Eligibility (&lt;75%)</span>
          <div className="text-3xl font-bold text-amber-600 mt-2">{atRiskStudents.length} Students</div>
          <div className="text-xs text-slate-500 mt-1.5">Require academic dean counseling</div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Mobile Marking Adoption</span>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {Math.round((mobileCount / totalRecords) * 100)}%
          </div>
          <div className="text-xs text-slate-500 mt-1.5">via TalHelix Mobile Scanner App</div>
        </div>
      </div>

      {/* 2-Column: Batch Breakdown & Channel Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Batch Performance */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Batch Attendance Breakdown</h2>
          <div className="space-y-3">
            {batches.map((batch) => (
              <div key={batch.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-slate-900">
                    {batch.name} ({batch.section})
                  </div>
                  <span className="font-bold text-emerald-600">92.8%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92.8%' }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span>Enrolled: {batch.studentCount} candidates</span>
                  <span>Faculty: {batch.assignedFacultyNames?.[0] || 'Prof. David Malan'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Channel Breakdown */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Capture Channel Integrity</h2>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Mobile App Marking</div>
                  <div className="text-xs text-slate-500">Faculty standalone mobile application</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">{mobileCount} Records</div>
                <div className="text-xs text-slate-500 font-medium">{Math.round((mobileCount / totalRecords) * 100)}% of total</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Web Manual Portal</div>
                  <div className="text-xs text-slate-500">Desktop browser roster marking</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">{webCount} Records</div>
                <div className="text-xs text-slate-500 font-medium">{Math.round((webCount / totalRecords) * 100)}% of total</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">RFID Turnstile Gateway</div>
                  <div className="text-xs text-slate-500">Hardware card swipe logs</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">{rfidCount} Records</div>
                <div className="text-xs text-slate-500 font-medium">{Math.round((rfidCount / totalRecords) * 100)}% of total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Students Table */}
      {atRiskStudents.length > 0 && (
        <div className="p-6 rounded-xl bg-white border border-amber-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>At-Risk Students Requiring Attendance Remediation</span>
            </h2>
            <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              &lt; 75% Minimum Bar
            </span>
          </div>

          <div className="divide-y divide-slate-100 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden text-xs">
            {atRiskStudents.map((s) => (
              <div key={s.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors">
                <div>
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    {s.registerNumber} • {s.batchName} ({s.section})
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-rose-600 font-bold text-sm">
                    {s.academicRecord?.attendancePercentage || 68}%
                  </span>
                  <button
                    onClick={() => showToast(`Counseling notice dispatched to ${s.name}`, 'info')}
                    className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-medium cursor-pointer text-xs transition-colors"
                  >
                    Send Warning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
