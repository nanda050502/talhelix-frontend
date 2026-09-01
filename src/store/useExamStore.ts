import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExamInstance, BackendStudentResponse } from '../types/backend';
import { ExamAnswer } from '../types';

interface ExamSessionState {
  activeSession: ExamInstance | null;
  currentQuestionIndex: number;
  answers: Record<string, ExamAnswer>;
  codeDrafts: Record<string, string>; // questionId -> active code buffer
  timeRemainingSeconds: number;
  isSubmitting: boolean;
  codeExecutionCooldown: boolean; // 3s cooldown guard against HTTP 429
  lastRunTimestamp: number;
  violationLogs: { time: string; reason: string }[];
  isLockedFullscreen: boolean;

  // Actions
  setActiveSession: (instance: ExamInstance) => void;
  setCurrentQuestionIndex: (idx: number) => void;
  setAnswer: (questionId: string, partialAnswer: Partial<ExamAnswer>) => void;
  setCodeDraft: (questionId: string, code: string) => void;
  decrementTimer: () => void;
  setTimerSeconds: (secs: number) => void;
  setIsSubmitting: (submitting: boolean) => void;
  triggerCodeExecutionCooldown: () => void;
  recordViolation: (reason: string) => void;
  setFullscreenLock: (locked: boolean) => void;
  clearSession: () => void;
}

export const useExamStore = create<ExamSessionState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      currentQuestionIndex: 0,
      answers: {},
      codeDrafts: {},
      timeRemainingSeconds: 0,
      isSubmitting: false,
      codeExecutionCooldown: false,
      lastRunTimestamp: 0,
      violationLogs: [],
      isLockedFullscreen: false,

      setActiveSession: (instance) => {
        const initialAnswers: Record<string, ExamAnswer> = {};
        if (instance.responses) {
          Object.entries(instance.responses).forEach(([qId, resp]) => {
            initialAnswers[qId] = {
              questionId: qId,
              selectedOptionIds: resp.selected_option_ids || [],
              textAnswer: resp.text_response || '',
              codeAnswer: resp.code_response || '',
              isMarkedForReview: Boolean(resp.is_marked_for_review),
              timeSpentSeconds: resp.time_spent_seconds || 0,
            };
          });
        }

        set({
          activeSession: instance,
          answers: initialAnswers,
          timeRemainingSeconds: instance.remaining_seconds || instance.duration_minutes * 60,
          currentQuestionIndex: 0,
          violationLogs: [],
        });
      },

      setCurrentQuestionIndex: (idx) => set({ currentQuestionIndex: idx }),

      setAnswer: (questionId, partialAnswer) => {
        set((state) => {
          const current = state.answers[questionId] || {
            questionId,
            selectedOptionIds: [],
            textAnswer: '',
            codeAnswer: '',
            isMarkedForReview: false,
            timeSpentSeconds: 0,
          };
          return {
            answers: {
              ...state.answers,
              [questionId]: { ...current, ...partialAnswer },
            },
          };
        });
      },

      setCodeDraft: (questionId, code) => {
        set((state) => ({
          codeDrafts: {
            ...state.codeDrafts,
            [questionId]: code,
          },
        }));
      },

      decrementTimer: () => {
        set((state) => ({
          timeRemainingSeconds: Math.max(0, state.timeRemainingSeconds - 1),
        }));
      },

      setTimerSeconds: (secs) => set({ timeRemainingSeconds: secs }),

      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

      triggerCodeExecutionCooldown: () => {
        set({ codeExecutionCooldown: true, lastRunTimestamp: Date.now() });
        setTimeout(() => {
          set({ codeExecutionCooldown: false });
        }, 3000); // Strict 3-second UI lock to prevent HTTP 429
      },

      recordViolation: (reason) => {
        const timeStr = new Date().toLocaleTimeString();
        set((state) => ({
          violationLogs: [{ time: timeStr, reason }, ...state.violationLogs.slice(0, 49)],
        }));
      },

      setFullscreenLock: (locked) => set({ isLockedFullscreen: locked }),

      clearSession: () =>
        set({
          activeSession: null,
          answers: {},
          codeDrafts: {},
          timeRemainingSeconds: 0,
          currentQuestionIndex: 0,
          isSubmitting: false,
          violationLogs: [],
          isLockedFullscreen: false,
        }),
    }),
    {
      name: 'talhelix-exam-session',
      partialize: (state) => ({
        activeSession: state.activeSession,
        answers: state.answers,
        codeDrafts: state.codeDrafts,
        currentQuestionIndex: state.currentQuestionIndex,
        timeRemainingSeconds: state.timeRemainingSeconds,
      }),
    }
  )
);
