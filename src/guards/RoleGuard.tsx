import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

type Role = 'admin' | 'super_admin' | 'student' | 'institution' | 'faculty' | 'university_admin';

// Maps frontend userType to backend role for strict check
const mapUserTypeToRole = (userType: string, role: string): Role => {
  // Prefer explicit role string if it matches backend enum
  const lowerRole = role?.toLowerCase().replace(/\s+/g, '_');
  if (['admin', 'super_admin', 'student', 'institution', 'faculty', 'university_admin'].includes(lowerRole)) {
    return lowerRole as Role;
  }
  // Fallback to userType
  if (userType === 'admin') return 'admin';
  if (userType === 'student') return 'student';
  if (userType === 'institution') return 'institution';
  if (userType === 'faculty') return 'faculty';
  return userType as Role;
};

interface RoleGuardProps {
  allow: Role[];
  children: React.ReactNode;
  redirectTo?: string;
  requireTenant?: boolean;
}

/**
 * RoleGuard — enforces role + tenant before rendering.
 * - Checks on mount and on every role change (covers initial load + client navigation)
 * - Never partially renders children if unauthorized — returns null and redirects immediately
 * - Uses window.history.replaceState to prevent back-button to guarded page
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allow, children, redirectTo = '/unauthorized', requireTenant = false }) => {
  const { user, currentRoute } = useApp();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    // 1. Not authenticated → redirect to /login (not /unauthorized, to allow login)
    if (!user.isAuthenticated) {
      if (currentRoute !== '/login' && currentRoute !== '/unauthorized') {
        window.history.replaceState({}, '', '/login');
        // Use replace to avoid history pollution; AppContext will pick up popstate
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      setIsAllowed(false);
      setIsChecking(false);
      return;
    }

    const userRole = mapUserTypeToRole(user.userType, user.role);

    // 2. Role check — strict, no fallback
    if (!allow.includes(userRole)) {
      console.warn(`[RoleGuard] DENIED: userType=${user.userType} role=${user.role} (${userRole}) attempted ${currentRoute}, allow=${allow.join(',')}`);
      if (window.location.pathname !== redirectTo) {
        window.history.replaceState({}, '', redirectTo);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      setIsAllowed(false);
      setIsChecking(false);
      return;
    }

    // 3. Tenant check for institution namespace
    if (requireTenant && !user.institutionId && !['admin', 'super_admin'].includes(userRole)) {
      console.warn(`[RoleGuard] DENIED: institution user without institutionId attempted ${currentRoute}`);
      window.history.replaceState({}, '', redirectTo);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setIsAllowed(false);
      setIsChecking(false);
      return;
    }

    setIsAllowed(true);
    setIsChecking(false);
  }, [user.isAuthenticated, user.userType, user.role, user.institutionId, currentRoute, allow, redirectTo, requireTenant]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-medium">Verifying session…</span>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    // Render nothing — redirect already happened, prevents flash of guarded content
    return null;
  }

  return <>{children}</>;
};

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allow={['admin', 'super_admin']}>{children}</RoleGuard>
);

export const StudentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allow={['student']}>{children}</RoleGuard>
);

export const InstitutionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allow={['institution', 'faculty', 'university_admin']} requireTenant>
    {children}
  </RoleGuard>
);
