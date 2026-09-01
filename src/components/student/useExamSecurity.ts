import { useState, useEffect, useCallback, useRef } from 'react';
import { MalpracticeFlagCategory } from '../../types';

export interface ExamSecurityOptions {
  enabled?: boolean;
  studentName?: string;
  studentEmail?: string;
  onViolation?: (violation: string, category?: MalpracticeFlagCategory) => void;
}

export interface ExamSecurityState {
  isFullscreen: boolean;
  isLocked: boolean;
  hasStartedExam: boolean;
  violationsCount: number;
  violationsLog: { time: string; reason: string; category?: MalpracticeFlagCategory }[];
  showFullscreenWarning: boolean;
  securityToast: { message: string; type: 'warning' | 'error' | 'info'; id: number } | null;
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<void>;
  startExamInFullscreen: () => Promise<boolean>;
  dismissFullscreenWarning: () => void;
  reEnterFullscreen: () => Promise<boolean>;
  clearToast: () => void;
}

export const useExamSecurity = ({
  enabled = true,
  studentName = 'Student',
  studentEmail = '',
  onViolation,
}: ExamSecurityOptions = {}): ExamSecurityState => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasStartedExam, setHasStartedExam] = useState<boolean>(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState<boolean>(false);
  const [violationsCount, setViolationsCount] = useState<number>(0);
  const [violationsLog, setViolationsLog] = useState<{ time: string; reason: string; category?: MalpracticeFlagCategory }[]>([]);
  const [securityToast, setSecurityToast] = useState<{
    message: string;
    type: 'warning' | 'error' | 'info';
    id: number;
  } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSecurityWarning = useCallback(
    (message: string, type: 'warning' | 'error' | 'info' = 'warning') => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setSecurityToast({ message, type, id: Date.now() });
      toastTimerRef.current = setTimeout(() => {
        setSecurityToast(null);
      }, 3800);
    },
    []
  );

  const recordViolation = useCallback(
    (reason: string, category: MalpracticeFlagCategory = 'TAB_SWITCH') => {
      const timeStr = new Date().toLocaleTimeString();
      setViolationsCount((prev) => prev + 1);
      setViolationsLog((prev) => [{ time: timeStr, reason, category }, ...prev.slice(0, 19)]);
      if (onViolation) onViolation(reason, category);
    },
    [onViolation]
  );

  const checkIsFullscreen = (): boolean => {
    return Boolean(
      document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
    );
  };

  const enterFullscreen = async (): Promise<boolean> => {
    try {
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
      return true;
    } catch (err) {
      console.warn('Fullscreen request error:', err);
      // In some iframe / sandboxed setups, requestFullscreen may be constrained
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
      return false;
    }
  };

  const exitFullscreen = async (): Promise<void> => {
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen && (document as any).webkitFullscreenElement) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen && (document as any).mozFullScreenElement) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen && (document as any).msFullscreenElement) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
      setIsFullscreen(false);
    }
  };

  const startExamInFullscreen = async (): Promise<boolean> => {
    setHasStartedExam(true);
    const success = await enterFullscreen();
    return success;
  };

  const reEnterFullscreen = async (): Promise<boolean> => {
    const success = await enterFullscreen();
    setShowFullscreenWarning(false);
    return success;
  };

  const dismissFullscreenWarning = () => {
    setShowFullscreenWarning(false);
  };

  const clearToast = () => setSecurityToast(null);

  // Sync fullscreen state
  useEffect(() => {
    if (!enabled) return;

    const handleFsChange = () => {
      const inFull = checkIsFullscreen();
      setIsFullscreen(inFull);
      if (!inFull && hasStartedExam) {
        setShowFullscreenWarning(true);
        recordViolation('Exited Full-Screen Mode', 'FULLSCREEN_EXIT');
        triggerSecurityWarning(
          'Security Alert: Full-screen mode exited! Re-enter fullscreen to continue your assessment.',
          'error'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, [enabled, hasStartedExam, recordViolation, triggerSecurityWarning]);

  // Anti-Cheat Event Listeners (Copy, Paste, Cut, ContextMenu, Key Shortcuts, Tab Switch)
  useEffect(() => {
    if (!enabled || !hasStartedExam) return;

    // 1. Disable Copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      recordViolation('Copy attempt blocked', 'COPY_PASTE_VIOLATION');
      triggerSecurityWarning(
        'Clipboard Disabled: Copying exam text is strictly prohibited.',
        'warning'
      );
    };

    // 2. Disable Paste
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      recordViolation('Paste attempt blocked', 'COPY_PASTE_VIOLATION');
      triggerSecurityWarning(
        'Clipboard Disabled: Pasting external content is strictly prohibited.',
        'warning'
      );
    };

    // 3. Disable Cut
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      recordViolation('Cut attempt blocked', 'COPY_PASTE_VIOLATION');
      triggerSecurityWarning('Clipboard Disabled: Cut operation is prohibited.', 'warning');
    };

    // 4. Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerSecurityWarning('Right-click context menu is disabled during the exam.', 'warning');
    };

    // 5. Disable Screenshot, DevTools & System Keys
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // PrintScreen (PrtScn)
      if (
        e.key === 'PrintScreen' ||
        e.code === 'PrintScreen' ||
        e.keyCode === 44 ||
        e.key === 'Snapshot'
      ) {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('');
          }
        } catch {}
        recordViolation('Screenshot attempt (PrintScreen)', 'UNAUTHORIZED_DEVICE');
        triggerSecurityWarning(
          'Screenshot Prohibited: Screen captures and recording are disabled by exam security.',
          'error'
        );
        return;
      }

      // Windows Snipping Tool (Win + Shift + S) or Ctrl + Shift + S
      if ((e.key === 'S' || e.key === 's') && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Screenshot attempt (Snipping shortcut)', 'UNAUTHORIZED_DEVICE');
        triggerSecurityWarning('Screenshots Prohibited: Snipping tool shortcut is disabled.', 'error');
        return;
      }

      // Mac Screenshot Shortcuts (Cmd + Shift + 3 / 4 / 5 / 6)
      if (e.metaKey && e.shiftKey && ['3', '4', '5', '6', '#', '$', '%', '^'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Screenshot attempt (macOS capture shortcut)', 'UNAUTHORIZED_DEVICE');
        triggerSecurityWarning('Screenshots Prohibited: macOS screenshot shortcuts are disabled.', 'error');
        return;
      }

      // Block Copy shortcut (Ctrl+C / Cmd+C)
      if (modifier && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Copy keyboard shortcut attempted', 'COPY_PASTE_VIOLATION');
        triggerSecurityWarning('Copy shortcut (Ctrl+C / Cmd+C) is disabled.', 'warning');
        return;
      }

      // Block Paste shortcut (Ctrl+V / Cmd+V)
      if (modifier && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Paste keyboard shortcut attempted', 'COPY_PASTE_VIOLATION');
        triggerSecurityWarning('Paste shortcut (Ctrl+V / Cmd+V) is disabled.', 'warning');
        return;
      }

      // Block Cut shortcut (Ctrl+X / Cmd+X)
      if (modifier && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Cut keyboard shortcut attempted', 'COPY_PASTE_VIOLATION');
        triggerSecurityWarning('Cut shortcut (Ctrl+X / Cmd+X) is disabled.', 'warning');
        return;
      }

      // Block Print dialog (Ctrl+P / Cmd+P)
      if (modifier && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Print attempt', 'UNAUTHORIZED_DEVICE');
        triggerSecurityWarning('Printing exam content is disabled.', 'error');
        return;
      }

      // Block Save Page (Ctrl+S / Cmd+S)
      if (modifier && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityWarning('Saving page is disabled.', 'warning');
        return;
      }

      // Block DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
      if (
        e.key === 'F12' ||
        (modifier &&
          e.shiftKey &&
          (e.key === 'I' ||
            e.key === 'i' ||
            e.key === 'J' ||
            e.key === 'j' ||
            e.key === 'C' ||
            e.key === 'c')) ||
        (modifier && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Developer inspection shortcut attempt', 'SEB_BREACH');
        triggerSecurityWarning('Developer tools and source inspection are disabled.', 'error');
        return;
      }
    };

    // 6. Tab Switch & Blur
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Tab switched / window minimized', 'TAB_SWITCH');
        triggerSecurityWarning(
          'Security Alert: Tab switch detected! Please stay focused on the assessment.',
          'error'
        );
      }
    };

    const handleWindowBlur = () => {
      recordViolation('Window focus lost / application navigation detected', 'TAB_SWITCH');
      triggerSecurityWarning(
        'Security Notice: Assessment window focus lost. Remain inside the test screen.',
        'warning'
      );
    };

    window.addEventListener('copy', handleCopy, true);
    window.addEventListener('paste', handlePaste, true);
    window.addEventListener('cut', handleCut, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('paste', handlePaste, true);
      window.removeEventListener('cut', handleCut, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, hasStartedExam, recordViolation, triggerSecurityWarning]);

  return {
    isFullscreen,
    isLocked: hasStartedExam,
    hasStartedExam,
    violationsCount,
    violationsLog,
    showFullscreenWarning,
    securityToast,
    enterFullscreen,
    exitFullscreen,
    startExamInFullscreen,
    dismissFullscreenWarning,
    reEnterFullscreen,
    clearToast,
  };
};
