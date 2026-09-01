import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Award,
  ShieldCheck,
  Sparkles,
  LogOut,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, studentReports, logout } = useApp();

  const reports = studentReports[user.email.toLowerCase()] || [];
  const passedCount = reports.filter((r) => r.status === 'Passed').length;
  const avgPercentage =
    reports.length > 0
      ? Math.round(reports.reduce((acc, r) => acc + r.percentage, 0) / reports.length)
      : 92;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {user.avatarInitials || 'ST'}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Candidate
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">{user.email}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                {user.department || 'Computer Science'}
              </span>
              <span>•</span>
              <span>Roll No: {user.rollNumber || 'CS-2024-042'}</span>
              <span>•</span>
              <span>Batch: 2024–2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Completed Evaluations</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{reports.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total submissions</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Average Performance</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{avgPercentage}%</p>
          <p className="text-xs text-emerald-600 mt-1">Passing rate: 100%</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Earned Certificates</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{passedCount}</p>
          <p className="text-xs text-indigo-600 mt-1">Verified accreditations</p>
        </div>
      </div>

      {/* Candidate Badges & Accreditations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Earned Skill Badges</h3>
        <p className="text-xs text-slate-500">Milestone achievements earned through assessment completions</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Python Specialist</h4>
              <p className="text-xs text-slate-500 mt-0.5">Scored 90%+ in Python Foundations</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Database Architect</h4>
              <p className="text-xs text-slate-500 mt-0.5">Mastered Normalization & SQL</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Integrity Honors</h4>
              <p className="text-xs text-slate-500 mt-0.5">100% Proctored Clean Attempts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Sign Out</h4>
          <p className="text-xs text-slate-500">End your student examination session</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
