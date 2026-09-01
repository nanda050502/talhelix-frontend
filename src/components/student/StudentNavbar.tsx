import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  BookOpenCheck,
  FileText,
  UserCheck,
  LogOut,
  ChevronDown,
  Shield,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const StudentNavbar: React.FC = () => {
  const { currentRoute, navigateTo, user, logout, switchRole } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard', route: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Assessments', route: '/student/assessments', icon: BookOpenCheck },
    { label: 'My Results', route: '/student/results', icon: FileText },
    { label: 'Profile', route: '/student/profile', icon: UserCheck },
  ];

  const isNavActive = (itemRoute: string) => {
    if (itemRoute === '/student/assessments') {
      return currentRoute === '/student/assessments' || currentRoute.startsWith('/student/exam');
    }
    return currentRoute === itemRoute;
  };

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-white border-b border-slate-200">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between relative">
        {/* Left: Brand Logo + Student Portal Pill */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <button
            onClick={() => navigateTo('/student/dashboard')}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
            aria-label="TalHelix Student Portal"
          >
            {/* "T" in filled blue square */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              T
            </div>
            {/* "Tal" (dark navy) + "Helix" (blue) */}
            <div className="text-xl font-bold tracking-tight">
              <span className="text-[#0F172A]">Tal</span>
              <span className="text-blue-600">Helix</span>
            </div>
          </button>

          {/* Student Portal Tag */}
          <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </span>
        </div>

        {/* Center: Nav Links (Desktop) — absolutely centered */}
        <nav
          className="hidden md:flex items-center space-x-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label="Student Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.route);
            return (
              <button
                key={item.route}
                onClick={() => navigateTo(item.route)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side: Candidate Avatar Dropdown */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-400 focus:outline-none transition-all cursor-pointer"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {/* Candidate initials avatar */}
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center shadow-xs">
                {user.avatarInitials || 'ST'}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-bold text-slate-900 truncate max-w-[120px]">{user.name}</p>
                <p className="text-slate-500 text-xs truncate max-w-[120px]">{user.department || 'Student'}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 hidden sm:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Candidate Account
                    </span>
                    <span className="text-xs font-mono text-slate-500">{user.rollNumber || 'CS-2024'}</span>
                  </div>
                </div>

                <div className="px-2 py-1 space-y-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigateTo('/student/profile');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    Candidate Profile
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      switchRole('admin');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-blue-600" />
                    Preview Admin Portal
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="md:hidden flex items-center justify-around px-2 py-1 bg-white border-t border-slate-200 text-xs overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.route);
          return (
            <button
              key={item.route}
              onClick={() => navigateTo(item.route)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-md font-medium ${
                active ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
