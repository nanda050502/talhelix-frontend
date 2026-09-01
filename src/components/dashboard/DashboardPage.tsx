import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  ClipboardList,
  Users,
  CheckCircle2,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';


export const DashboardPage: React.FC = () => {
  const {
    user,
    dashboardStats,
    activityFeed,
    navigateTo,
    createAssessment,
  } = useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDuration, setDraftDuration] = useState('30');
  const [draftCategory, setDraftCategory] = useState('Programming');

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    const newAsm = createAssessment({
      title: draftTitle.trim(),
      duration: parseInt(draftDuration, 10) || 30,
      category: draftCategory,
      publishImmediately: false,
    });
    setCreateModalOpen(false);
    setDraftTitle('');
    navigateTo(`/admin/assessment-setup`);
  };

  // Status donut data — vibrant brand palette
  const statusData = [
    { name: 'Published', value: dashboardStats.published, color: '#2563EB' }, // vivid TalHelix blue
    { name: 'Draft', value: dashboardStats.draft, color: '#F59E0B' }, // vivid amber
  ];

  // Category distribution data
  const categoryData = [
    { name: 'Programming', count: 184 },
    { name: 'Database', count: 96 },
    { name: 'Cloud & DevOps', count: 88 },
    { name: 'Algorithms', count: 74 },
    { name: 'Aptitude', count: 64 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, <strong className="text-slate-800 font-semibold">{user.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Active Tenants */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {dashboardStats.activeTenants}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">Active Tenants</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>100% SLA uptime</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Users */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {dashboardStats.totalUsers.toLocaleString()}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">Total Users</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>Enterprise & campus pool</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Active Users */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {dashboardStats.activeUsers.toLocaleString()}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">Active Users</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span>99.4% engagement rate</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Assessments */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {dashboardStats.assessments}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">Assessments</p>
            <p className="mt-3 text-xs text-slate-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              {dashboardStats.published} published
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Assessment Status Chart + Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Assessment Status Chart & Categories (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Donut Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Assessment Status</h3>
                <p className="text-xs text-slate-500">Distribution of published vs draft tests</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {dashboardStats.assessments} Total
              </span>
            </div>

            {/* Custom High-DPI SVG Donut Chart */}
            <div className="relative flex items-center justify-center py-3">
              {(() => {
                const total = Math.max(1, (dashboardStats.published || 0) + (dashboardStats.draft || 0));
                const pubPct = ((dashboardStats.published || 0) / total) * 100;
                const draftPct = ((dashboardStats.draft || 0) / total) * 100;
                const r = 68;
                const circumference = 2 * Math.PI * r; // ~427.25
                const pubStroke = (pubPct / 100) * circumference;
                const draftStroke = (draftPct / 100) * circumference;

                return (
                  <div className="relative w-52 h-52 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
                      {/* Background Track */}
                      <circle
                        cx="90"
                        cy="90"
                        r={r}
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth="20"
                      />
                      {/* Published Segment (Blue) */}
                      <circle
                        cx="90"
                        cy="90"
                        r={r}
                        fill="transparent"
                        stroke="#2563EB"
                        strokeWidth="20"
                        strokeDasharray={`${pubStroke} ${circumference - pubStroke}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out hover:opacity-90 cursor-pointer"
                      />
                      {/* Draft Segment (Amber) */}
                      <circle
                        cx="90"
                        cy="90"
                        r={r}
                        fill="transparent"
                        stroke="#F59E0B"
                        strokeWidth="20"
                        strokeDasharray={`${draftStroke} ${circumference - draftStroke}`}
                        strokeDashoffset={-pubStroke}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out hover:opacity-90 cursor-pointer"
                      />
                    </svg>

                    {/* Central Metrics */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {dashboardStats.published}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Published
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Legend Stats */}
            <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-50/50 border border-blue-100/60">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shrink-0 shadow-xs"></span>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Published</p>
                  <p className="text-sm font-bold text-slate-900">
                    {dashboardStats.published}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({(((dashboardStats.published || 0) / Math.max(1, (dashboardStats.published || 0) + (dashboardStats.draft || 0))) * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50/50 border border-amber-100/60">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 shadow-xs"></span>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Drafts</p>
                  <p className="text-sm font-bold text-slate-900">
                    {dashboardStats.draft}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({(((dashboardStats.draft || 0) / Math.max(1, (dashboardStats.published || 0) + (dashboardStats.draft || 0))) * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Bar Distribution */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-0.5">Domain Distribution</h3>
              <p className="text-xs text-slate-500">Assessments broken down by technical vertical</p>
            </div>

            <div className="space-y-3.5 pt-1">
              {categoryData.map((cat, idx) => {
                const maxCount = 200;
                const pct = ((cat.count / maxCount) * 100).toFixed(0);
                const colors = [
                  { bg: 'bg-blue-600', text: 'text-blue-700', light: 'bg-blue-50' },
                  { bg: 'bg-indigo-600', text: 'text-indigo-700', light: 'bg-indigo-50' },
                  { bg: 'bg-sky-600', text: 'text-sky-700', light: 'bg-sky-50' },
                  { bg: 'bg-purple-600', text: 'text-purple-700', light: 'bg-purple-50' },
                  { bg: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50' },
                ];
                const c = colors[idx % colors.length];

                return (
                  <div key={cat.name} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{cat.count}</span>
                        <span className="text-[11px] text-slate-500 font-medium">tests</span>
                      </div>
                    </div>
                    {/* Progress Track */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full ${c.bg} rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Recent Activity Feed (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Recent Activity Feed</h3>
                  <p className="text-xs text-slate-500">Live candidate assessment submissions & scores</p>
                </div>
                <button
                  onClick={() => navigateTo('/reports')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View all reports</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {activityFeed.map((item) => {
                  const isHigh = item.score >= 90;
                  const isMed = item.score >= 75 && item.score < 90;
                  const scoreBadgeStyle = isHigh
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : isMed
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200';

                  return (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 flex-shrink-0">
                          {item.studentAvatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{item.studentName}</p>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-mono">{item.studentEmail}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{item.assessmentTitle}</p>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${scoreBadgeStyle}`}
                        >
                          {item.score}% Score
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timeAgo}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create New Assessment (Prompt spec) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Assessment"
        subtitle="Fill in the details to create a new assessment draft."
      >
        <form onSubmit={handleCreateDraft} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Java Basics"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={draftDuration}
                onChange={(e) => setDraftDuration(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Programming">Programming</option>
                <option value="Database">Database</option>
                <option value="Cloud">Cloud</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Aptitude">Aptitude</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Create Draft
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
