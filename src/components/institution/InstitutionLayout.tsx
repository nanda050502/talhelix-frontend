import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RoutePath } from '../../types';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  Bell,
  Smartphone,
  LogOut,
  ChevronDown,
  Building2,
  ExternalLink,
  Shield,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface InstitutionLayoutProps {
  children: React.ReactNode;
}

export const InstitutionLayout: React.FC<InstitutionLayoutProps> = ({ children }) => {
  const {
    currentRoute,
    navigateTo,
    user,
    logout,
    switchRole,
    announcements,
    getLiveBatchForFaculty,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const liveBatchInfo = getLiveBatchForFaculty();
  const unreadAnnouncements = announcements.slice(0, 3);

  const navItems: Array<{ label: string; route: RoutePath; icon: React.ComponentType<{ className?: string }>; badge?: string | number }> = [
    { label: 'Dashboard', route: '/institution/dashboard', icon: LayoutDashboard },
    { label: 'Student Rosters', route: '/institution/students', icon: GraduationCap },
    { label: 'Batches & Schedules', route: '/institution/batches', icon: CalendarDays },
    {
      label: 'Attendance Marking',
      route: '/institution/attendance',
      icon: ClipboardCheck,
      badge: liveBatchInfo.isLive ? 'LIVE' : undefined,
    },
    { label: 'Emergency Override', route: '/institution/emergency-attendance', icon: AlertTriangle },
    { label: 'Institutional Reports', route: '/institution/reports', icon: BarChart3 },
    { label: 'Announcements', route: '/institution/announcements', icon: Bell, badge: announcements.length },
    { label: 'Mobile App API Sync', route: '/institution/mobile-sync', icon: Smartphone, badge: 'API' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header — fluid width */}
      <header className="h-14 border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between">
          {/* Left: Brand & Institution Info */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('/institution/dashboard')}
              className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
              aria-label="TalHelix Institution Home"
            >
              {/* "T" in filled blue square */}
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
                T
              </div>
              {/* "Tal" (dark navy) + "Helix" (blue) */}
              <div className="flex items-center gap-1.5">
                <div className="text-xl font-bold tracking-tight">
                  <span className="text-[#0F172A]">Tal</span>
                  <span className="text-blue-600">Helix</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ml-1">
                  Institution
                </span>
              </div>
            </button>

            {/* Institution Name Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">{user.institutionName || 'Stanford University'}</span>
            </div>

            {/* Live Batch Indicator Pill — minimal */}
            {liveBatchInfo.isLive && liveBatchInfo.batch && (
              <button
                onClick={() => navigateTo('/institution/attendance')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium cursor-pointer hover:bg-emerald-100 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-emerald-800">Live Session:</span>
                <span className="truncate max-w-[140px]">{liveBatchInfo.batch.name}</span>
                <span className="text-emerald-600 text-xs">({liveBatchInfo.schedule?.startTime} - {liveBatchInfo.schedule?.endTime})</span>
              </button>
            )}
          </div>

          {/* Right: Quick Role Switcher, Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher Dropdown */}
            <div className="relative" ref={roleMenuRef}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline font-semibold">{user.role || 'Institution Admin'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">Switch TalHelix Portal</div>
                    <div className="text-xs text-slate-500">Preview different workspace views</div>
                  </div>

                  <button
                    onClick={() => switchRole('institution')}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      user.userType === 'institution' ? 'text-blue-700 font-bold bg-blue-50/60' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <div>
                        <div>Institution Admin</div>
                        <div className="text-xs text-slate-500 font-normal">Dr. Arthur Mitchell</div>
                      </div>
                    </div>
                    {user.userType === 'institution' && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded">Active</span>}
                  </button>

                  <button
                    onClick={() => switchRole('admin')}
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-slate-600" />
                    <div>
                      <div>Super Admin Portal</div>
                      <div className="text-xs text-slate-500">TalHelix Root Admin</div>
                    </div>
                  </button>

                  <button
                    onClick={() => switchRole('student', 'alice@stanford.edu')}
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div>Student Candidate Portal</div>
                      <div className="text-xs text-slate-500">Alice Chen (CS Batch)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Drawer */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title="Institutional Notices"
              >
                <Bell className="w-4 h-4" />
                {unreadAnnouncements.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95"
                  onClick={() => setShowNotifications(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Institutional Notices</span>
                    <button
                      onClick={() => navigateTo('/institution/announcements')}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      View all
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {unreadAnnouncements.map((ann) => (
                      <div key={ann.id} className="p-3 hover:bg-slate-50 text-xs">
                        <div className="flex items-center justify-between gap-1 text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{ann.targetAudience}</span>
                          <span>{ann.publishedAt}</span>
                        </div>
                        <div className="font-semibold text-slate-800">{ann.title}</div>
                        <p className="text-slate-500 line-clamp-2 mt-0.5">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                {user.avatarInitials || 'IA'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</span>
                <span className="text-xs text-slate-500">{user.role}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body: Sidebar + Main Content — fluid width */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Navigation Sidebar */}
          <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex md:flex-col gap-1 shrink-0 overflow-x-auto md:overflow-x-visible h-fit md:sticky md:top-[4.5rem]">
          <div className="hidden md:block px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            Campus Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;

            return (
              <button
                key={item.route}
                onClick={() => navigateTo(item.route)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                      item.badge === 'LIVE'
                        ? 'bg-emerald-600 text-white'
                        : item.badge === 'API'
                        ? isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        : isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          </aside>

          {/* Primary Page Canvas */}
          <main className="flex-1 min-w-0 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
