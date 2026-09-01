import React from 'react';
import {
  Shield,
  ShieldAlert,
  Maximize,
  AlertTriangle,
  Lock,
  EyeOff,
  Copy,
  Camera,
  XCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ExamSecurityState } from './useExamSecurity';

interface ExamSecurityOverlayProps {
  security: ExamSecurityState;
  assessmentTitle: string;
  studentName?: string;
  studentEmail?: string;
  durationMinutes?: number;
}

export const ExamSecurityOverlay: React.FC<ExamSecurityOverlayProps> = ({
  security,
  assessmentTitle,
  studentName = 'Candidate',
  studentEmail = '',
  durationMinutes = 45,
}) => {
  const {
    hasStartedExam,
    showFullscreenWarning,
    securityToast,
    violationsCount,
    startExamInFullscreen,
    reEnterFullscreen,
    dismissFullscreenWarning,
    clearToast,
  } = security;

  return (
    <>
      {/* 1. INITIAL FULLSCREEN ENTRY LOCK SCREEN (Before student confirms fullscreen start) */}
      {!hasStartedExam && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header — clean minimal */}
            <div className="bg-slate-900 p-6 text-white text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                Secure Proctoring Lockdown
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">{assessmentTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Candidate: <strong className="text-white">{studentName}</strong> {studentEmail ? `(${studentEmail})` : ''}
              </p>
            </div>

            {/* Security Policies Box */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-slate-600 font-medium text-center">
                This assessment requires a strict anti-cheating environment. By starting, the following security constraints will be enforced:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <Maximize className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Full-Screen Mode</span>
                    <span className="text-xs text-slate-500">Must stay full-screen throughout</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <Copy className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Copy & Paste Disabled</span>
                    <span className="text-xs text-slate-500">Clipboard shortcuts blocked</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <Camera className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Anti-Screenshot</span>
                    <span className="text-xs text-slate-500">PrintScreen & capture disabled</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <EyeOff className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Tab Switch Tracking</span>
                    <span className="text-xs text-slate-500">Focus loss logs recorded</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Exiting full screen, switching tabs, or attempting screen captures will record security flags on your final audit transcript.
                </span>
              </div>
            </div>

            {/* Launch Action */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={startExamInFullscreen}
                className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-[0.99]"
              >
                <Maximize className="w-4 h-4" />
                <span>Enter Full-Screen & Start Assessment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULLSCREEN EXITED WARNING MODAL */}
      {hasStartedExam && showFullscreenWarning && (
        <div className="fixed inset-0 z-50 bg-rose-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Full-Screen Mode Exited</h3>
                <p className="text-xs text-rose-600 font-semibold">Security Protocol Violation Detected</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-2">
              <p>
                You have exited full-screen mode. In accordance with examination regulations, you must remain in full-screen mode during the entire evaluation.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-rose-200 text-xs font-bold text-rose-800">
                <span>Security Violations Recorded:</span>
                <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900">{violationsCount}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={reEnterFullscreen}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Maximize className="w-4 h-4" />
                <span>Re-Enter Full-Screen Mode to Resume</span>
              </button>

              <button
                type="button"
                onClick={dismissFullscreenWarning}
                className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Continue in current window (Security logged)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FLOATING SECURITY TOAST NOTIFICATION */}
      {securityToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-lg w-[92%] sm:w-auto">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold border ${
              securityToast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : securityToast.type === 'warning'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-blue-900 text-white border-blue-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1">{securityToast.message}</span>
            <button
              onClick={clearToast}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. ANTI-CAMERA WATERMARK BACKGROUND (Non-intrusive diagonal security watermark) */}
      {hasStartedExam && (
        <div
          className="fixed inset-0 pointer-events-none z-10 opacity-[0.03] select-none overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        >
          <div className="w-full h-full flex flex-wrap items-center justify-around gap-16 p-8 transform -rotate-12 text-xs font-mono font-bold text-slate-900 uppercase">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="whitespace-nowrap">
                PROCTOR LOCKED • {studentEmail || studentName} • SECURE EXAM
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const ExamSecurityBadge: React.FC<{
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  violationsCount: number;
}> = ({ isFullscreen, onToggleFullscreen, violationsCount }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
        <Shield className="w-3.5 h-3.5 text-emerald-600" />
        <span>Anti-Cheat Locked</span>
      </div>

      <button
        type="button"
        onClick={onToggleFullscreen}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
          isFullscreen
            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
        }`}
        title={isFullscreen ? 'Full screen active' : 'Click to enter full screen mode'}
      >
        <Maximize className="w-3 h-3" />
        <span>{isFullscreen ? 'Full Screen' : 'Enable Full Screen'}</span>
      </button>

      {violationsCount > 0 && (
        <span
          className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold"
          title="Security violations count"
        >
          Flags: {violationsCount}
        </span>
      )}
    </div>
  );
};
