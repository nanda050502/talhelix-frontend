import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, navigateTo, logout } = useApp();

  const getDashboardRoute = () => {
    if (user.userType === 'student') return '/student/dashboard';
    if (user.userType === 'institution' || user.userType === 'faculty') return '/institution/dashboard';
    if (user.userType === 'admin') return '/admin/dashboard';
    return '/login';
  };

  const handleGoToDashboard = () => {
    if (!user.isAuthenticated) {
      navigateTo('/login');
    } else {
      navigateTo(getDashboardRoute() as any);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Your role <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded border">{user.role || user.userType || 'unknown'}</span> does not have permission to view this page.
            {user.isAuthenticated ? ' You have been redirected to a safe page.' : ' Please log in with an authorized account.'}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-mono">Attempted: {window.location.pathname}</p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{user.isAuthenticated ? 'Go to My Dashboard' : 'Go to Login'}</span>
          </button>
          {user.isAuthenticated && (
            <button
              onClick={logout}
              className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          If you believe this is an error, contact your administrator. All access attempts are logged.
        </p>
      </div>
    </div>
  );
};
