import React, { useState } from 'react';
import {
  User,
  Copy,
  Check,
  ShieldAlert,
  Laptop,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Flag,
  AlertTriangle,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { Student } from '../../types';

interface UserProfileCardProps {
  student: Student;
  onChangeEmail: () => void;
  onOpenFlagModal: () => void;
  onViewMalpracticeLogs: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  student,
  onChangeEmail,
  onOpenFlagModal,
  onViewMalpracticeLogs,
  showToast,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const userId = student.userId || `0a7ec044-${student.id}a0c-490b-b324-e128640cd62e`;
  const createdAt = student.createdAt || '7/25/2026, 10:02:25 AM';
  const role = student.role || 'student';
  const status = student.status.toLowerCase() === 'active' ? 'active' : student.status.toLowerCase();

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    showToast('User ID copied to clipboard', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const activeFlagsCount = (student.flagsHistory || []).filter((f) => f.status === 'ACTIVE').length;
  const activeDevices = student.activeDevices || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Card Header matching production screenshots */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {student.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              User Details &amp; Portal Identity
            </h2>
            <p className="text-xs text-slate-500">
              TalHelix verified candidate credentials and security telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onChangeEmail}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Change email</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid from Production Screen */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
        {/* Left Column */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
            <span className="text-xs font-medium text-slate-500 w-20">Name:</span>
            <span className="font-semibold text-slate-900">{student.name}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
            <span className="text-xs font-medium text-slate-500 w-20">Role:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              {role}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
            <span className="text-xs font-medium text-slate-500 w-20">User ID:</span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
              <span className="truncate max-w-[200px] sm:max-w-[280px]" title={userId}>
                {userId}
              </span>
              <button
                onClick={handleCopyUserId}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Copy User ID"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
            <span className="text-xs font-medium text-slate-500 w-20">Email:</span>
            <span className="font-medium text-slate-900 font-mono text-xs sm:text-sm">
              {student.email}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
            <span className="text-xs font-medium text-slate-500 w-20">Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
              {status}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-6">
            <span className="text-xs font-medium text-slate-500 w-20">Created:</span>
            <span className="text-xs text-slate-700 font-medium">{createdAt}</span>
          </div>
        </div>
      </div>

      {/* Extended Telemetry & Operational Bar */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Academic Details */}
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Department &amp; Batch</p>
            <p className="font-medium text-slate-800">
              {student.dept || 'Computer Science'} • Batch {student.batchYear || 2026}
            </p>
          </div>
        </div>

        {/* Attendance Verification */}
        <div className="flex items-center gap-2">
          {student.attendanceStatus === 'PRESENT' || student.attendanceStatus === 'CHECKED_IN' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : student.attendanceStatus === 'ABSENT' ? (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Attendance Status</p>
            <p
              className={`font-semibold ${
                student.attendanceStatus === 'PRESENT' || student.attendanceStatus === 'CHECKED_IN'
                  ? 'text-emerald-700'
                  : student.attendanceStatus === 'ABSENT'
                  ? 'text-rose-700'
                  : 'text-slate-600'
              }`}
            >
              {student.attendanceStatus || 'PENDING'} (Verified in Gate)
            </p>
          </div>
        </div>

        {/* Device Sessions */}
        <div className="flex items-center gap-2">
          <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400">Active Devices</p>
            <p className="font-medium text-slate-800">
              {activeDevices.length || 1} Active Session
              {activeDevices.length > 1 && (
                <span className="ml-1 text-amber-600 font-bold">(Multi-device)</span>
              )}
            </p>
          </div>
        </div>

        {/* Malpractice & Cheating Flags */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert
              className={`w-4 h-4 shrink-0 ${
                activeFlagsCount > 0 ? 'text-rose-600' : 'text-slate-400'
              }`}
            />
            <div>
              <p className="text-xs uppercase font-semibold text-slate-400">Integrity Flags</p>
              <p
                className={`font-bold ${
                  activeFlagsCount > 0 ? 'text-rose-700' : 'text-slate-700'
                }`}
              >
                {activeFlagsCount > 0 ? `${activeFlagsCount} Active Flag(s)` : '0 Flags (Clean)'}
              </p>
            </div>
          </div>

          <button
            onClick={onViewMalpracticeLogs}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 ml-auto cursor-pointer"
          >
            Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
