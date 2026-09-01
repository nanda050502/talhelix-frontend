import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { StudentNavbar } from './components/student/StudentNavbar';
import { ToastContainer } from './components/common/ToastContainer';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { AssessmentsPage } from './components/assessments/AssessmentsPage';
import { AssessmentSetupPage } from './components/assessmentSetup/AssessmentSetupPage';
import { LibrariesPage } from './components/libraries/LibrariesPage';
import { StudentsPage } from './components/students/StudentsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { AuthoringEditorPage } from './components/authoring/AuthoringEditorPage';
import { LoginPage } from './components/auth/LoginPage';
import { StudentDashboardPage } from './components/student/StudentDashboardPage';
import { StudentAssessmentsPage } from './components/student/StudentAssessmentsPage';
import { StudentExamPage } from './components/student/StudentExamPage';
import { StudentResultsPage } from './components/student/StudentResultsPage';
import { StudentProfilePage } from './components/student/StudentProfilePage';
import { UnauthorizedPage } from './routes/auth/UnauthorizedPage';
import { AdminGuard, StudentGuard, InstitutionGuard } from './guards/RoleGuard';

// Institution Components
import { InstitutionLayout } from './components/institution/InstitutionLayout';
import { InstitutionDashboard } from './components/institution/InstitutionDashboard';
import { InstitutionStudents } from './components/institution/InstitutionStudents';
import { InstitutionBatches } from './components/institution/InstitutionBatches';
import { InstitutionAttendanceHub } from './components/institution/InstitutionAttendanceHub';
import { InstitutionEmergencyAttendance } from './components/institution/InstitutionEmergencyAttendance';
import { InstitutionReports } from './components/institution/InstitutionReports';
import { InstitutionAnnouncements } from './components/institution/InstitutionAnnouncements';
import { InstitutionMobileSync } from './components/institution/InstitutionMobileSync';

const MainContent: React.FC = () => {
  const { currentRoute, user } = useApp();

  // Public routes — no guard, but redirect authenticated users away from /login is handled in LoginPage
  if (!user.isAuthenticated || currentRoute === '/login') {
    // Allow /unauthorized even when not authenticated to show 403 page
    if (currentRoute === '/unauthorized' && user.isAuthenticated) {
      return (
        <main className="min-h-screen bg-slate-100">
          <UnauthorizedPage />
          <ToastContainer />
        </main>
      );
    }
    // Unauthenticated users see login for any route except /unauthorized
    if (currentRoute !== '/login' && currentRoute !== '/unauthorized') {
      // This will be caught by RoleGuard as well, but we short-circuit to login for unauthenticated
      return (
        <main className="min-h-screen bg-slate-100">
          <LoginPage />
          <ToastContainer />
        </main>
      );
    }
    if (currentRoute === '/unauthorized') {
      return (
        <main className="min-h-screen bg-slate-100">
          <UnauthorizedPage />
          <ToastContainer />
        </main>
      );
    }
    return (
      <main className="min-h-screen bg-slate-100">
        <LoginPage />
        <ToastContainer />
      </main>
    );
  }

  // Authenticated — handle /unauthorized explicitly
  if (currentRoute === '/unauthorized') {
    return (
      <main className="min-h-screen bg-slate-100">
        <UnauthorizedPage />
        <ToastContainer />
      </main>
    );
  }

  // ==========================================
  // STUDENT PORTAL — /student/* (isolated, StudentGuard)
  // ==========================================
  if (currentRoute.startsWith('/student/')) {
    return (
      <StudentGuard>
        <StudentPortalContent />
      </StudentGuard>
    );
  }

  // ==========================================
  // INSTITUTION PORTAL — /institution/* (isolated, InstitutionGuard + tenant)
  // ==========================================
  if (currentRoute.startsWith('/institution/')) {
    return (
      <InstitutionGuard>
        <InstitutionPortalContent />
      </InstitutionGuard>
    );
  }

  // ==========================================
  // ADMIN PORTAL — /admin/* + legacy /assessments, /students, etc. (isolated, AdminGuard)
  // Strict namespace: /admin/* is canonical. Legacy top-level routes are deprecated but still guarded.
  // ==========================================
  if (
    currentRoute.startsWith('/admin/') ||
    currentRoute === '/' ||
    currentRoute === '/assessments' ||
    currentRoute === '/libraries' ||
    currentRoute === '/students' ||
    currentRoute === '/reports' ||
    currentRoute.startsWith('/authoring/')
  ) {
    return (
      <AdminGuard>
        <AdminPortalContent />
      </AdminGuard>
    );
  }

  // Fallback — unknown route: show 403, never leak which routes exist
  return (
    <main className="min-h-screen bg-slate-100">
      <UnauthorizedPage />
      <ToastContainer />
    </main>
  );
};

// Isolated Student portal content — never mounted for non-student (guard prevents mount)
const StudentPortalContent: React.FC = () => {
  const { currentRoute } = useApp();

  if (currentRoute.startsWith('/student/exam/')) {
    const parts = currentRoute.split('/');
    const id = parts[parts.length - 1] || 'asm-1';
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-900 text-slate-900 z-50">
        <StudentExamPage assessmentId={id} />
        <ToastContainer />
      </div>
    );
  }

  const renderStudentView = () => {
    if (currentRoute === '/student/assessments') return <StudentAssessmentsPage />;
    if (currentRoute === '/student/results') return <StudentResultsPage />;
    if (currentRoute === '/student/profile') return <StudentProfilePage />;
    return <StudentDashboardPage />;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <StudentNavbar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8">
        {renderStudentView()}
      </main>
      <ToastContainer />
    </div>
  );
};

// Isolated Institution portal content
const InstitutionPortalContent: React.FC = () => {
  const { currentRoute } = useApp();
  const renderInstitutionView = () => {
    switch (currentRoute) {
      case '/institution/students':
        return <InstitutionStudents />;
      case '/institution/batches':
        return <InstitutionBatches />;
      case '/institution/attendance':
        return <InstitutionAttendanceHub />;
      case '/institution/emergency-attendance':
        return <InstitutionEmergencyAttendance />;
      case '/institution/reports':
        return <InstitutionReports />;
      case '/institution/announcements':
        return <InstitutionAnnouncements />;
      case '/institution/mobile-sync':
        return <InstitutionMobileSync />;
      case '/institution/dashboard':
      default:
        return <InstitutionDashboard />;
    }
  };

  return (
    <InstitutionLayout>
      {renderInstitutionView()}
      <ToastContainer />
    </InstitutionLayout>
  );
};

// Isolated Admin portal content — never mounted for non-admin
const AdminPortalContent: React.FC = () => {
  const { currentRoute } = useApp();
  const renderAdminView = () => {
    if (currentRoute === '/admin/dashboard' || currentRoute === '/') return <DashboardPage />;
    // Canonical /admin/* and legacy fallbacks — both guarded by AdminGuard above
    if (currentRoute === '/assessments' || currentRoute === '/admin/assessments') return <AssessmentsPage />;
    if (currentRoute === '/admin/assessment-setup') return <AssessmentSetupPage />;
    if (currentRoute === '/libraries' || currentRoute === '/admin/libraries') return <LibrariesPage />;
    if (currentRoute === '/students' || currentRoute === '/admin/students') return <StudentsPage />;
    if (currentRoute === '/reports' || currentRoute === '/admin/reports') return <ReportsPage />;
    if (currentRoute.startsWith('/authoring/editor') || currentRoute.startsWith('/admin/authoring/editor')) {
      const parts = currentRoute.split('/');
      const id = parts[parts.length - 1] || 'asm-1';
      return <AuthoringEditorPage assessmentId={id} />;
    }
    return <DashboardPage />;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8">
        {renderAdminView()}
      </main>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
