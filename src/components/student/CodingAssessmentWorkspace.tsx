import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Clock,
  ChevronDown,
  RotateCcw,
  Play,
  Maximize2,
  Minimize2,
  FileText,
  Check,
  Lock,
  Info,
  CheckCircle2,
  XCircle,
  Terminal,
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  GripHorizontal,
} from 'lucide-react';
import { MarkdownView } from '../common/MarkdownView';
import { StructuredQuestionView } from '../common/StructuredQuestionView';
import { Question, Assessment, TestCase } from '../../types';
import { ExamSecurityState } from './useExamSecurity';
import { ExamSecurityBadge } from './ExamSecurityOverlay';

interface CodingAssessmentWorkspaceProps {
  assessment: Assessment;
  questions: Question[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  secondsRemaining: number;
  onEndExam: () => void;
  codeAnswers: Record<string, string>;
  onCodeChange: (questionId: string, code: string) => void;
  onClearCode: (questionId: string) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onSubmitQuestion: (questionId: string) => void;
  security?: ExamSecurityState;
}

export interface WorkspaceLanguage {
  id: string;
  label: string;
  name: string;
  watermark: string;
  ext: string;
  commentPrefix: string;
}

export const WORKSPACE_LANGUAGES: WorkspaceLanguage[] = [
  { id: 'python', label: 'Python 3', name: 'Python 3.11', watermark: 'Python 3', ext: 'py', commentPrefix: '#' },
  { id: 'java', label: 'Java 17', name: 'Java 17 (OpenJDK)', watermark: 'Java', ext: 'java', commentPrefix: '//' },
  { id: 'cpp', label: 'C++ 20', name: 'C++ 20 (GCC 12)', watermark: 'C++', ext: 'cpp', commentPrefix: '//' },
  { id: 'javascript', label: 'JavaScript (ES6)', name: 'JavaScript (Node.js)', watermark: 'JavaScript', ext: 'js', commentPrefix: '//' },
  { id: 'typescript', label: 'TypeScript', name: 'TypeScript 5', watermark: 'TypeScript', ext: 'ts', commentPrefix: '//' },
  { id: 'sql', label: 'SQL (PostgreSQL)', name: 'SQL (PostgreSQL)', watermark: 'PostgreSQL', ext: 'sql', commentPrefix: '--' },
  { id: 'go', label: 'Go 1.22', name: 'Go 1.22', watermark: 'Go', ext: 'go', commentPrefix: '//' },
];

/**
 * Returns boilerplate code for the language if configured in JSON; returns "" if unconfigured (idle)
 */
export const getQuestionTemplateForLanguage = (q: Question, langId: string): string => {
  if (q.codeTemplates && typeof q.codeTemplates[langId] === 'string') {
    return q.codeTemplates[langId];
  }
  const baseLang = (q.language || 'python').toLowerCase().trim();
  if (
    baseLang === langId ||
    (baseLang.includes('py') && langId === 'python') ||
    (baseLang.includes('java') && !baseLang.includes('script') && langId === 'java') ||
    (baseLang.includes('cpp') && langId === 'cpp') ||
    (baseLang.includes('js') && langId === 'javascript') ||
    (baseLang.includes('ts') && langId === 'typescript') ||
    (baseLang.includes('sql') && langId === 'sql') ||
    (baseLang.includes('go') && langId === 'go')
  ) {
    return q.codeTemplate || '';
  }
  return '';
};

export const CodingAssessmentWorkspace: React.FC<CodingAssessmentWorkspaceProps> = ({
  assessment,
  questions,
  currentIndex,
  onSelectIndex,
  secondsRemaining,
  onEndExam,
  codeAnswers,
  onCodeChange,
  onClearCode,
  onNextQuestion,
  onPrevQuestion,
  onSubmitQuestion,
  security,
}) => {
  const currentQuestion = questions[currentIndex] || questions[0];

  // Coding Workspace State
  const initialLang = (currentQuestion.language || 'python').toLowerCase();
  const matchedInitial = WORKSPACE_LANGUAGES.find(
    (l) => l.id === initialLang || initialLang.includes(l.id) || l.id.includes(initialLang)
  )?.id || 'python';

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>(matchedInitial);
  const [theme, setTheme] = useState<'Light' | 'Dark'>('Light');
  const [runsLeft, setRunsLeft] = useState(15);
  const [isSaved, setIsSaved] = useState(false);
  const [customInputEnabled, setCustomInputEnabled] = useState(false);
  const [customInputText, setCustomInputText] = useState('6 4');
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'output' | 'testcases'>('output');
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});

  // Dynamic Adjustable Panels & Fullscreen State
  const [fullscreenMode, setFullscreenMode] = useState<'none' | 'question' | 'editor' | 'output'>('none');
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(42); // percentage
  const [outputPanelHeight, setOutputPanelHeight] = useState<number>(230); // pixels
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  // Horizontal Resize Listeners
  useEffect(() => {
    if (!isDraggingHorizontal) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      const newPercent = (e.clientX / containerWidth) * 100;
      setLeftPanelWidth(Math.min(Math.max(newPercent, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal]);

  // Vertical Resize Listeners
  useEffect(() => {
    if (!isDraggingVertical) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      setOutputPanelHeight(Math.min(Math.max(newHeight, 80), windowHeight - 160));
    };

    const handleMouseUp = () => {
      setIsDraggingVertical(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVertical]);

  // Sync language when question index changes
  useEffect(() => {
    const qLang = (currentQuestion.language || 'python').toLowerCase();
    const matched = WORKSPACE_LANGUAGES.find(
      (l) => l.id === qLang || qLang.includes(l.id) || l.id.includes(qLang)
    )?.id || 'python';
    setSelectedLanguageId(matched);
  }, [currentQuestion.id, currentQuestion.language]);

  // Execution Results State
  const [executionResult, setExecutionResult] = useState<{
    stdout: string;
    runtime: string;
    memory: string;
    allPassed: boolean;
    testCasesResults: {
      id: string;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
      isHidden?: boolean;
    }[];
  } | null>(null);

  const activeLangObj =
    WORKSPACE_LANGUAGES.find((l) => l.id === selectedLanguageId) || WORKSPACE_LANGUAGES[0];

  const boilerplateForActiveLang = getQuestionTemplateForLanguage(currentQuestion, selectedLanguageId);
  const isLanguageConfigured = Boolean(boilerplateForActiveLang && boilerplateForActiveLang.trim().length > 0);

  // Key for student's custom edits per language
  const activeCodeKey = `${currentQuestion.id}__${selectedLanguageId}`;
  const isPrimaryLanguage = selectedLanguageId === matchedInitial;

  // If candidate has typed code, use that.
  // If not, use the boilerplate for this language from JSON (which is "" if idle / unconfigured!).
  const currentCode =
    codeAnswers[activeCodeKey] ??
    (isPrimaryLanguage ? codeAnswers[currentQuestion.id] : undefined) ??
    boilerplateForActiveLang;

  // Handle student editing or pasting code
  const handleCodeChange = (newCode: string) => {
    onCodeChange(activeCodeKey, newCode);
    if (isPrimaryLanguage) {
      onCodeChange(currentQuestion.id, newCode);
    }
  };

  // Calculate lines for gutter
  const lineCount = Math.max(26, (currentCode || '').split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Auto-save debounced feedback
  useEffect(() => {
    setIsSaved(false);
    const timer = setTimeout(() => {
      setIsSaved(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [currentCode]);

  // Format timer (mm:ss)
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Run Code Simulation
  const handleRunCode = () => {
    if (runsLeft <= 0 || isRunning) return;
    setIsRunning(true);
    setRunsLeft((prev) => Math.max(0, prev - 1));

    setTimeout(() => {
      const cases: TestCase[] =
        currentQuestion.testCases && currentQuestion.testCases.length > 0
          ? currentQuestion.testCases
          : [
              {
                id: 'tc-1',
                input: '6 4',
                expectedOutput: '[2, -5, 11, -20, 32, -47]\nSum: -12',
                isHidden: false,
              },
              {
                id: 'tc-2',
                input: '10 5',
                expectedOutput: '[2, -5, 11, -20, 32, -47, 65, -86, 110, -137]\nSum: 20',
                isHidden: false,
              },
              {
                id: 'tc-3',
                input: '12 10',
                expectedOutput: '[2, -5, 11, -20, 32, -47, 65, -86, 110, -137, 167, -200]\nSum: -45',
                isHidden: true,
              },
            ];

      const tcResults = cases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: tc.expectedOutput,
        passed: true,
        isHidden: tc.isHidden,
      }));

      setExecutionResult({
        stdout: customInputEnabled
          ? `Input: ${customInputText}\nOutput Generated: [2, -5, 11, -20, 32, -47]\nComputed Sum: -12\n\nProcess finished with exit code 0`
          : `Compiling Python 3.11 code...\nRunning 3 test case suites...\n✓ Test Case 1 Passed (0.012s)\n✓ Test Case 2 Passed (0.015s)\n✓ Hidden Test Case 3 Passed (0.018s)\n\nAll test cases passed successfully.`,
        runtime: '0.045s',
        memory: '14.8 MB',
        allPassed: true,
        testCasesResults: tcResults,
      });

      setIsRunning(false);
      setHasRun(true);
    }, 650);
  };

  const handleResetCode = () => {
    const originalTemplate = boilerplateForActiveLang;
    const msg = originalTemplate
      ? `Reset ${activeLangObj.label} code back to original starter template?`
      : `Clear code editor for ${activeLangObj.label} (no starter code in JSON)?`;

    if (window.confirm(msg)) {
      handleCodeChange(originalTemplate);
      setExecutionResult(null);
      setHasRun(false);
    }
  };

  const handleSubmitCurrent = () => {
    setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
    onSubmitQuestion(currentQuestion.id);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans select-text">
      {/* 1. TOP NAVIGATION BAR (Exact Match to Image) */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none shadow-2xs">
        {/* Left: Shield + Step Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-slate-800 text-xs sm:text-sm tracking-wider uppercase">
            STEP {currentIndex + 1} - {currentQuestion.type === 'CODING' ? 'COD' : currentQuestion.type}
          </span>
        </div>

        {/* Center: Stepper Numbered Pills & Question Navigators */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Previous Question Button */}
          <button
            type="button"
            onClick={onPrevQuestion}
            disabled={currentIndex === 0}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="Previous Question"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Question Step Pills */}
          <div className="flex items-center gap-1.5">
            {questions.map((q, idx) => {
              const isCompleted = submittedQuestions[q.id] || (idx === 0 && currentIndex > 0);
              const isActive = currentIndex === idx;
              const isLocked = idx > 1 && !submittedQuestions[questions[idx - 1]?.id];

              if (isActive) {
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => onSelectIndex(idx)}
                    className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-105"
                    title={`Question ${idx + 1} (Active)`}
                  >
                    {idx + 1}
                  </button>
                );
              }

              if (isCompleted) {
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => onSelectIndex(idx)}
                    className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center relative cursor-pointer hover:bg-emerald-200 transition-colors"
                    title={`Question ${idx + 1} (Passed / Answered)`}
                  >
                    <span>{idx + 1}</span>
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={q.id || idx}
                  onClick={() => onSelectIndex(idx)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 font-semibold text-xs flex items-center justify-center relative cursor-pointer transition-colors"
                  title={`Question ${idx + 1}`}
                >
                  <span>{idx + 1}</span>
                  {isLocked && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-2xs">
                      <Lock className="w-2 h-2" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Question Button */}
          <button
            type="button"
            onClick={onNextQuestion}
            disabled={currentIndex === questions.length - 1}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="Next Question"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Security Badge, Clock Countdown & End Exam Button */}
        <div className="flex items-center gap-3">
          {security && (
            <ExamSecurityBadge
              isFullscreen={security.isFullscreen}
              onToggleFullscreen={security.reEnterFullscreen}
              violationsCount={security.violationsCount}
            />
          )}

          <div className="flex items-center gap-1.5 text-slate-800">
            <Clock className="w-4 h-4 text-slate-700" />
            <span className="font-mono font-bold text-sm sm:text-base tracking-tight">
              {formatTimer(secondsRemaining)}
            </span>
          </div>

          <button
            type="button"
            onClick={onEndExam}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            End Exam
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE WITH DRAGGABLE PANELS & FULLSCREEN SUPPORT */}
      <main className="flex-1 flex overflow-hidden bg-slate-100 relative">
        {/* LEFT COLUMN: Problem Description & Context */}
        <section
          style={{
            width:
              fullscreenMode === 'question'
                ? '100%'
                : fullscreenMode === 'editor' || fullscreenMode === 'output'
                ? '0%'
                : `${leftPanelWidth}%`,
            display:
              fullscreenMode === 'editor' || fullscreenMode === 'output'
                ? 'none'
                : 'flex',
          }}
          className="border-r border-slate-200 flex-col h-full overflow-hidden bg-white shrink-0 z-10 transition-all duration-75"
        >
          {/* Question Title & Difficulty Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0 bg-white">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQuestion.title || 'Coding Challenge'}
                </h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  {currentQuestion.difficulty || 'Easy'}
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-xs font-semibold">
                  {currentQuestion.marks || 10} Marks
                </span>
              </div>
            </div>

            {/* Question Fullscreen Chip */}
            <button
              type="button"
              onClick={() => setFullscreenMode(fullscreenMode === 'question' ? 'none' : 'question')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
                fullscreenMode === 'question'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
              }`}
              title={fullscreenMode === 'question' ? 'Exit Fullscreen' : 'Fullscreen Question'}
            >
              {fullscreenMode === 'question' ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fullscreen Question</span>
                </>
              )}
            </button>
          </div>

          {/* Submissions Limit Info Banner */}
          <div className="px-4 sm:px-5 pt-3 shrink-0">
            <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-xl text-blue-900 flex items-start gap-2.5 shadow-2xs">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-blue-950 font-medium">
                You have <strong>16 submissions</strong> available for this challenge. 15 for live test-run verification, 1 is reserved for final assessment submission.
              </p>
            </div>
          </div>

          {/* Scrollable Problem Body with Dedicated Structured Fields */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs sm:text-[13px] text-slate-800 leading-relaxed custom-scrollbar">
            <StructuredQuestionView question={currentQuestion} showSampleTestCases={true} />
          </div>
        </section>

        {/* DRAGGABLE HORIZONTAL RESIZE HANDLE (TILE) */}
        {fullscreenMode === 'none' && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingHorizontal(true);
            }}
            className={`w-2.5 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 transition-colors cursor-col-resize flex items-center justify-center group z-30 select-none shrink-0 ${
              isDraggingHorizontal ? 'bg-blue-600 ring-2 ring-blue-400' : ''
            }`}
            title="Drag to resize Question / Code Editor split"
          >
            <div className="w-1 h-8 rounded-full bg-slate-400 group-hover:bg-white group-active:bg-white transition-colors" />
          </div>
        )}

        {/* RIGHT COLUMN: Code Editor & Execution Console */}
        <section
          style={{
            width:
              fullscreenMode === 'editor' || fullscreenMode === 'output'
                ? '100%'
                : fullscreenMode === 'question'
                ? '0%'
                : `${100 - leftPanelWidth}%`,
            display: fullscreenMode === 'question' ? 'none' : 'flex',
          }}
          className="flex-1 flex flex-col h-full overflow-hidden bg-white min-w-0"
        >
          {/* Top Code Studio Toolbar */}
          <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between gap-3 bg-white shrink-0 select-none">
            {/* Left Controls: Language, Theme, Saved Status, Run Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-1">
              {/* Language Dropdown */}
              <div className="relative">
                <select
                  value={selectedLanguageId}
                  onChange={(e) => setSelectedLanguageId(e.target.value)}
                  className={`appearance-none rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                    isLanguageConfigured
                      ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {WORKSPACE_LANGUAGES.map((lang) => {
                    const isConfigured = Boolean(
                      getQuestionTemplateForLanguage(currentQuestion, lang.id).trim()
                    );
                    return (
                      <option
                        key={lang.id}
                        value={lang.id}
                        className={
                          isConfigured
                            ? 'font-semibold text-slate-900 bg-white py-1'
                            : 'text-slate-400 bg-slate-100 italic py-1'
                        }
                      >
                        {lang.label} {isConfigured ? '●' : '○ (Idle - Blank)'}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Theme Dropdown */}
              <div className="relative">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'Light' | 'Dark')}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-slate-800 cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Save Status */}
              <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 pl-1">
                <FileText className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className={isSaved ? 'text-slate-600' : 'text-amber-600'}>
                  {isSaved ? 'Saved' : 'Unsaved'}
                </span>
              </div>

              {/* Run Code Button + Runs Left Pill */}
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning || runsLeft <= 0}
                className="ml-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs shrink-0"
                title="Execute code against test suites"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Play className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                )}
                <span>{runsLeft} runs left</span>
              </button>
            </div>

            {/* Right Controls: Reset, Submit Question, Fullscreen Chip */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={handleResetCode}
                className="text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset starter template code"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitCurrent}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                Submit
              </button>

              {/* Code Editor Fullscreen Chip */}
              <button
                type="button"
                onClick={() => setFullscreenMode(fullscreenMode === 'editor' ? 'none' : 'editor')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  fullscreenMode === 'editor'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
                title={fullscreenMode === 'editor' ? 'Exit Fullscreen' : 'Fullscreen Code Editor'}
              >
                {fullscreenMode === 'editor' ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Fullscreen Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Idle Language Status Banner (When selected language has no starter code in JSON) */}
          {!isLanguageConfigured && !currentCode.trim() && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-slate-600 flex items-center justify-between text-xs shrink-0 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>
                  <strong>{activeLangObj.label} (Idle)</strong>: No starter template provided. You can type your solution directly in the code editor below.
                </span>
              </div>
            </div>
          )}

          {/* Code Editor Body with Line Numbers */}
          <div
            style={{
              display: fullscreenMode === 'output' ? 'none' : 'flex',
            }}
            className={`flex-1 overflow-hidden ${
              theme === 'Dark' ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
            } relative border-b border-slate-200`}
          >
            {/* Line Numbers Gutter */}
            <div
              className={`w-12 py-3 select-none text-right pr-3 font-mono text-xs ${
                theme === 'Dark'
                  ? 'bg-slate-900/60 text-slate-500 border-r border-slate-800'
                  : 'bg-slate-50/70 text-slate-400 border-r border-slate-200'
              } shrink-0`}
            >
              {lineNumbers.map((line) => (
                <div key={line} className="h-6 leading-6">
                  {line}
                </div>
              ))}
            </div>

            {/* Code Textarea Area */}
            <div className="flex-1 relative overflow-auto p-0">
              <textarea
                value={currentCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                placeholder={
                  !isLanguageConfigured
                    ? `${activeLangObj.commentPrefix} No starter code provided for ${activeLangObj.label}.\n${activeLangObj.commentPrefix} Type your ${activeLangObj.label} code solution here...`
                    : `${activeLangObj.commentPrefix} Write your ${activeLangObj.label} solution here...`
                }
                spellCheck={false}
                className={`w-full h-full min-h-[300px] p-3 pl-4 font-mono text-xs leading-6 resize-none focus:outline-none bg-transparent ${
                  theme === 'Dark' ? 'text-emerald-400 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'
                }`}
                style={{
                  tabSize: 4,
                  whiteSpace: 'pre',
                }}
              />

              {/* Language Watermark Label (Bottom Right) */}
              <span
                className={`absolute bottom-3 right-4 font-mono text-xs select-none pointer-events-none ${
                  theme === 'Dark' ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {activeLangObj.watermark}
              </span>
            </div>
          </div>

          {/* DRAGGABLE VERTICAL RESIZE HANDLE (TILE) */}
          {fullscreenMode === 'none' && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingVertical(true);
              }}
              className={`h-2.5 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 transition-colors cursor-row-resize flex items-center justify-center group z-20 select-none shrink-0 ${
                isDraggingVertical ? 'bg-blue-600 ring-2 ring-blue-400' : ''
              }`}
              title="Drag to resize Output Console panel"
            >
              <div className="h-1 w-8 rounded-full bg-slate-400 group-hover:bg-white group-active:bg-white transition-colors" />
            </div>
          )}

          {/* Output & Console Panel (Bottom Section) */}
          <div
            style={{
              height:
                fullscreenMode === 'output'
                  ? '100%'
                  : fullscreenMode === 'editor'
                  ? '0%'
                  : `${outputPanelHeight}px`,
              display: fullscreenMode === 'editor' ? 'none' : 'flex',
            }}
            className="flex flex-col bg-white overflow-hidden shrink-0 transition-all duration-75"
          >
            {/* Console Toolbar Tabs */}
            <div className="h-10 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('output')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeOutputTab === 'output'
                      ? 'bg-white border border-slate-300 text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Output
                </button>

                <button
                  type="button"
                  onClick={() => setActiveOutputTab('testcases')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeOutputTab === 'testcases'
                      ? 'bg-white border border-slate-300 text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Test Cases ({currentQuestion.testCases?.length || 3})
                </button>

                {/* Custom Input Checkbox */}
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={customInputEnabled}
                    onChange={(e) => setCustomInputEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 border-slate-300"
                  />
                  <span>Custom input</span>
                </label>
              </div>

              {/* Output Console Fullscreen Chip */}
              <button
                type="button"
                onClick={() => setFullscreenMode(fullscreenMode === 'output' ? 'none' : 'output')}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                  fullscreenMode === 'output'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
                title={fullscreenMode === 'output' ? 'Exit Fullscreen' : 'Fullscreen Output Console'}
              >
                {fullscreenMode === 'output' ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fullscreen Output</span>
                  </>
                )}
              </button>
            </div>

            {/* Console Content Area */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs bg-slate-50/30">
              {customInputEnabled && (
                <div className="mb-2">
                  <span className="text-xs text-slate-500 font-semibold mb-1 block">
                    Standard Input (stdin):
                  </span>
                  <input
                    type="text"
                    value={customInputText}
                    onChange={(e) => setCustomInputText(e.target.value)}
                    placeholder="Enter space-separated arguments (e.g., 6 4)..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Idle state / Ran state */}
              {!hasRun && !isRunning ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-sans">
                  Run your code to see output
                </div>
              ) : isRunning ? (
                <div className="h-full flex items-center justify-center gap-2 text-slate-500 text-xs font-sans">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Compiling and evaluating against test cases...</span>
                </div>
              ) : activeOutputTab === 'output' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      All Test Cases Passed
                    </span>
                    <span className="text-slate-500">
                      Runtime: {executionResult?.runtime} | Memory: {executionResult?.memory}
                    </span>
                  </div>
                  <pre className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[11.5px]">
                    {executionResult?.stdout}
                  </pre>
                </div>
              ) : (
                /* Test Cases Suite Tab */
                <div className="space-y-2">
                  {executionResult?.testCasesResults.map((tc, idx) => (
                    <div
                      key={tc.id}
                      className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs flex flex-col gap-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {tc.isHidden ? `Hidden Test Case #${idx + 1}` : `Test Case #${idx + 1}`}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">
                          PASS
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>
                          <strong>Input:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">{tc.input}</code>
                        </p>
                        <p>
                          <strong>Expected Output:</strong>{' '}
                          <code className="bg-slate-100 px-1 py-0.5 rounded">{tc.expectedOutput}</code>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
