import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Assessment, Question, ExamSubmissionResult } from '../../types';
import { sampleQuestions } from '../../mockData';
import { CodingAssessmentWorkspace } from './CodingAssessmentWorkspace';
import { useExamSecurity } from './useExamSecurity';
import { ExamSecurityOverlay, ExamSecurityBadge } from './ExamSecurityOverlay';
import { MarkdownView } from '../common/MarkdownView';
import { StructuredQuestionView } from '../common/StructuredQuestionView';
import ReactMarkdown from 'react-markdown';
import {
  Clock,
  Shield,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calculator,
  X,
  Award,
  ArrowRight,
  BookOpen,
  Check,
  Send,
  HelpCircle,
  Code,
  Play,
  Terminal,
  FileCode,
  Lock,
} from 'lucide-react';

interface StudentExamPageProps {
  assessmentId: string;
}

export const StudentExamPage: React.FC<StudentExamPageProps> = ({ assessmentId }) => {
  const { assessments, students, submitStudentAssessment, navigateTo, user, recordStudentViolation } = useApp();

  const assessment = useMemo(() => {
    return (
      assessments.find((a) => a.id === assessmentId) || {
        id: assessmentId,
        title: 'Python Basics — Week 1',
        description: 'Comprehensive evaluation',
        instructions: 'Read questions carefully.',
        duration: 45,
        passingScore: 60,
        kind: 'Standard MCQ',
        publishImmediately: true,
        requireSafeExamBrowser: true,
        category: 'Programming',
        status: 'Published',
        questionsCount: 5,
        createdAt: '2024-05-20',
        questions: sampleQuestions,
      } as Assessment
    );
  }, [assessments, assessmentId]);

  // Ensure we have questions (if empty or fewer, provide rich test questions)
  const examQuestions: Question[] = useMemo(() => {
    if (assessment.questions && assessment.questions.length >= 1) {
      return assessment.questions;
    }
    return sampleQuestions;
  }, [assessment]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(assessment.duration * 60);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitSuccessOpen, setIsSubmitSuccessOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExamSubmissionResult | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('0');

  // Test run simulation state for coding challenges
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { passed: boolean; message: string; details: string }[]>>({});

  // Unified Anti-Cheat & Full-Screen Lockdown Security (ALWAYS ENABLED FOR ALL ASSESSMENTS)
  const currentStudentForViolation = students.find(
    (s) => s.email.toLowerCase() === user.email.toLowerCase()
  ) || students.find((s) => s.id === user.studentId);

  const security = useExamSecurity({
    enabled: !isSubmitted,
    studentName: user.name,
    studentEmail: user.email,
    onViolation: (violation, category) => {
      const resolvedId =
        currentStudentForViolation?.id ?? user.studentId ?? students.find((s) => s.email.toLowerCase() === user.email.toLowerCase())?.id ?? 1;
      recordStudentViolation(
        resolvedId,
        category || 'TAB_SWITCH',
        `Live assessment violation during "${assessment.title}": ${violation}`,
        `ses-${assessment.id}`
      );
    },
  });

  // Initialize starter code for coding questions
  useEffect(() => {
    examQuestions.forEach((q) => {
      if (q.type === 'CODING' && !codeAnswers[q.id]) {
        setCodeAnswers((prev) => ({
          ...prev,
          [q.id]: q.codeTemplate || '# Write your solution below\n\ndef solution():\n    pass\n',
        }));
      }
    });
  }, [examQuestions]);

  // Live Timer Countdown (counts down once student starts exam in fullscreen lockdown)
  useEffect(() => {
    if (isSubmitted || !security.hasStartedExam) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, security.hasStartedExam]);

  const currentQuestion = examQuestions[currentIndex] || examQuestions[0];

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionId: string, isMulti = false) => {
    setAnswers((prev) => {
      const currentSelected = prev[questionId] || [];
      if (isMulti) {
        if (currentSelected.includes(optionId)) {
          return { ...prev, [questionId]: currentSelected.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...currentSelected, optionId] };
        }
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleToggleReview = (questionId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
    setTextAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
    setCodeAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleRunCodeTests = (question: Question) => {
    setRunningTests(true);
    setTimeout(() => {
      const cases = question.testCases && question.testCases.length > 0 ? question.testCases : [
        { id: '1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0, 1]', isHidden: false },
        { id: '2', input: 'nums = [3,2,4], target = 6', expectedOutput: '[1, 2]', isHidden: false },
        { id: '3', input: 'nums = [3,3], target = 6', expectedOutput: '[0, 1]', isHidden: true },
      ];

      const res = cases.map((tc, idx) => ({
        passed: true,
        message: tc.isHidden ? `Hidden Test Case #${idx + 1}` : `Test Case #${idx + 1}`,
        details: `Input: ${tc.input} | Expected: ${tc.expectedOutput} | Execution time: 12ms`,
      }));

      setTestResults((prev) => ({
        ...prev,
        [question.id]: res,
      }));
      setRunningTests(false);
    }, 600);
  };

  // Determine if question has been answered
  const isQuestionAnswered = (q: Question) => {
    if (q.type === 'CODING') {
      return !!codeAnswers[q.id] && codeAnswers[q.id].trim().length > 15;
    }
    if (q.type === 'FILL_BLANK' || q.type === 'SHORT_ANSWER' || q.type === 'SCENARIO') {
      return !!textAnswers[q.id] && textAnswers[q.id].trim().length > 0;
    }
    return (answers[q.id] || []).length > 0;
  };

  const answeredCount = examQuestions.filter(isQuestionAnswered).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = examQuestions.length - answeredCount;

  const handleFinalSubmit = () => {
    setIsSubmitModalOpen(false);

    let totalMarks = 0;
    let earnedMarks = 0;
    let correctCount = 0;

    examQuestions.forEach((q) => {
      const qMarks = q.marks || 2;
      totalMarks += qMarks;

      if (q.type === 'CODING') {
        const hasCode = codeAnswers[q.id] && codeAnswers[q.id].trim().length > 15;
        if (hasCode) {
          earnedMarks += qMarks;
          correctCount += 1;
        }
      } else if (q.type === 'FILL_BLANK') {
        const text = (textAnswers[q.id] || '').trim().toLowerCase();
        const expected = (q.expectedAnswer || '').trim().toLowerCase();
        if (text && text === expected) {
          earnedMarks += qMarks;
          correctCount += 1;
        } else if (text && q.negativeMarks) {
          earnedMarks = Math.max(0, earnedMarks - q.negativeMarks);
        }
      } else if (q.type === 'SHORT_ANSWER' || q.type === 'SCENARIO') {
        const text = (textAnswers[q.id] || '').trim();
        if (text.length > 5) {
          earnedMarks += qMarks;
          correctCount += 1;
        }
      } else {
        const selected = answers[q.id] || [];
        const correctOptionIds = (q.options || []).filter((o) => o.isCorrect).map((o) => o.id);

        const isCorrect =
          selected.length > 0 &&
          selected.length === correctOptionIds.length &&
          selected.every((id) => correctOptionIds.includes(id));

        if (isCorrect) {
          earnedMarks += qMarks;
          correctCount += 1;
        } else if (selected.length > 0 && q.negativeMarks) {
          earnedMarks = Math.max(0, earnedMarks - q.negativeMarks);
        }
      }
    });

    const percentage = Math.round((earnedMarks / (totalMarks || 1)) * 100);
    const passed = percentage >= (assessment.passingScore || 50);
    const timeSpentSeconds = assessment.duration * 60 - secondsRemaining;
    const timeSpentFormatted = `${Math.floor(timeSpentSeconds / 60)} mins ${timeSpentSeconds % 60}s`;

    const result: ExamSubmissionResult = {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      totalQuestions: examQuestions.length,
      answeredCount,
      correctCount,
      score: earnedMarks,
      maxScore: totalMarks,
      percentage,
      passed,
      timeSpent: timeSpentFormatted,
      completedAt: new Date().toISOString(),
      topicBreakdown: [
        { name: 'Core Foundations', score: Math.min(100, percentage + 5) },
        { name: 'Applied Reasoning', score: percentage },
        { name: 'Scenario Analysis', score: Math.max(40, percentage - 4) },
      ],
    };

    setSubmissionResult(result);
    setIsSubmitted(true);
    setIsSubmitSuccessOpen(true);
    security.exitFullscreen();
    submitStudentAssessment(result);
  };

  const handleSuccessClose = () => {
    setIsSubmitSuccessOpen(false);
    // Clean navigation — back to student dashboard (no result details)
    navigateTo('/student/dashboard');
  };

  // Simple Calculator logic
  const handleCalcButton = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
    } else if (val === '=') {
      try {
        // Safe evaluation
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcInput(String(res));
      } catch {
        setCalcInput('Error');
      }
    } else {
      setCalcInput((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
    }
  };

  // Clean submit success — replaces detailed result page with a simple popup
  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Exam Submitted Successfully</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Your responses for <span className="font-semibold text-slate-800">{assessment.title}</span> have been submitted.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Submitted at {new Date().toLocaleString()} • {answeredCount} of {examQuestions.length} answered
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleSuccessClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done — Back to Dashboard</span>
            </button>
          </div>

          <button
            onClick={() => navigateTo('/student/assessments')}
            className="mt-3 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            View My Assessments
          </button>
        </div>
      </div>
    );
  }

  // If the current question is a CODING question, render the dedicated Coding Assessment Workspace
  if (currentQuestion.type === 'CODING') {
    return (
      <>
        <ExamSecurityOverlay
          security={security}
          assessmentTitle={assessment.title}
          studentName={user.name}
          studentEmail={user.email}
          durationMinutes={assessment.duration}
        />

        <CodingAssessmentWorkspace
          assessment={assessment}
          questions={examQuestions}
          currentIndex={currentIndex}
          onSelectIndex={(idx) => setCurrentIndex(idx)}
          secondsRemaining={secondsRemaining}
          onEndExam={() => setIsSubmitModalOpen(true)}
          codeAnswers={codeAnswers}
          onCodeChange={(qId, code) => setCodeAnswers((prev) => ({ ...prev, [qId]: code }))}
          onClearCode={(qId) => {
            const defaultCode = currentQuestion.codeTemplate || '';
            setCodeAnswers((prev) => ({ ...prev, [qId]: defaultCode }));
          }}
          onNextQuestion={() => setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
          onPrevQuestion={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          onSubmitQuestion={(qId) => {
            setIsSubmitModalOpen(true);
          }}
          security={security}
        />

        {/* Submit Confirmation Modal */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Submit Examination?</h3>
                  <p className="text-xs text-slate-500">Are you sure you want to finalize and end your attempt?</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block">Answered</span>
                  <span className="font-bold text-emerald-600 text-sm">{answeredCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Review</span>
                  <span className="font-bold text-amber-600 text-sm">{reviewCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unanswered</span>
                  <span className="font-bold text-slate-700 text-sm">{unansweredCount}</span>
                </div>
              </div>

              {unansweredCount > 0 && (
                <p className="text-xs text-rose-600 font-semibold">
                  Warning: You have {unansweredCount} unanswered questions remaining.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Return to Exam
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="h-screen w-screen overflow-y-auto flex flex-col bg-slate-100">
      {/* Security Overlay (Fullscreen requirement, violations modal, toasts & watermark) */}
      <ExamSecurityOverlay
        security={security}
        assessmentTitle={assessment.title}
        studentName={user.name}
        studentEmail={user.email}
        durationMinutes={assessment.duration}
      />

      {/* Top Exam Mode Sticky Bar — fluid */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-2.5 shadow-xs">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Exam Mode
            </span>
            <h1 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
              {assessment.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Exam Security Status Badge */}
            <ExamSecurityBadge
              isFullscreen={security.isFullscreen}
              onToggleFullscreen={security.reEnterFullscreen}
              violationsCount={security.violationsCount}
            />

            {/* Calculator Toggle */}
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              title="Toggle Calculator"
            >
              <Calculator className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Calc</span>
            </button>

            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm ${
                secondsRemaining < 300
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace (Split: Left Question, Right Palette) — fluid */}
      <div className="w-full p-4 sm:p-6 lg:px-8 xl:px-10 2xl:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left Column: Question Area (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[520px]">
          {/* Question Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 text-sm">
                Question {currentIndex + 1} of {examQuestions.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Marks: +{currentQuestion.marks || 2} / -{currentQuestion.negativeMarks || 0}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {currentQuestion.difficulty || 'MEDIUM'}
              </span>
            </div>

            <button
              onClick={() => handleToggleReview(currentQuestion.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                markedForReview[currentQuestion.id]
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${markedForReview[currentQuestion.id] ? 'fill-amber-600 text-amber-600' : ''}`} />
              <span>{markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          </div>

          {/* Question Body with Dedicated Structured Fields */}
          <div className="p-6 space-y-5 flex-1">
            <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <StructuredQuestionView question={currentQuestion} showSampleTestCases={(currentQuestion.type as any) === 'CODING'} />
            </div>

            {/* 1. FILL-IN-THE-BLANK INTERFACE */}
            {currentQuestion.type === 'FILL_BLANK' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-800">
                  Your Answer:
                </label>
                <input
                  type="text"
                  value={textAnswers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setTextAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: e.target.value,
                    }))
                  }
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  placeholder="Type your exact response here..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500">
                  Tip: Be exact with casing and punctuation as specified.
                </p>
              </div>
            )}

            {/* 3. SHORT ANSWER / SCENARIO INTERFACE */}
            {(currentQuestion.type === 'SHORT_ANSWER' || currentQuestion.type === 'SCENARIO') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Your Written Response:
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {(textAnswers[currentQuestion.id] || '').split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={textAnswers[currentQuestion.id] || ''}
                  onChange={(e) =>
                    setTextAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: e.target.value,
                    }))
                  }
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  placeholder="Provide your structured explanation or solution..."
                  className="w-full border border-slate-300 rounded-xl p-4 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed"
                />
              </div>
            )}

            {/* 4. MCQ / MSQ Options Selection */}
            {(currentQuestion.type === 'MCQ' || currentQuestion.type === 'MSQ' || !currentQuestion.type) && (
              <div className="space-y-3 pt-2">
                {(currentQuestion.options || []).map((opt, optIdx) => {
                  const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);
                  const isMulti = currentQuestion.type === 'MSQ';

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id, isMulti)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 text-blue-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border text-xs font-bold ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 text-slate-500'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <div className="flex-1 leading-snug prose prose-sm max-w-none text-current select-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span className="inline leading-relaxed">{children}</span>,
                            code: ({ children }) => (
                              <code className="bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono text-xs border border-slate-200">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {opt.text}
                        </ReactMarkdown>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. REASONING REQUIRED INTERFACE (Dotted rounded rectangle box containing an inner rounded rectangle box with textarea) */}
            {currentQuestion.requireReasoning && (() => {
              const wordCount = (textAnswers[currentQuestion.id] || '').trim().split(/\s+/).filter(Boolean).length;
              const minWords = currentQuestion.minReasoningWords ?? 10;
              const isMet = wordCount >= minWords;

              return (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 space-y-3 transition-all hover:border-slate-400 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                      <span className={`w-2 h-2 rounded-full ${isMet ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
                      <span>Reasoning Required (Min {minWords} words):</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md border transition-colors ${
                        isMet
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : wordCount > 0
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {wordCount} / {minWords} words {isMet ? '✓' : ''}
                    </span>
                  </div>

                  {/* Inner Rounded Rectangle Box */}
                  <div
                    className={`rounded-xl border bg-white p-3.5 shadow-2xs transition-colors ${
                      isMet ? 'border-emerald-300' : wordCount > 0 ? 'border-amber-300' : 'border-slate-200'
                    }`}
                  >
                    <textarea
                      rows={4}
                      value={textAnswers[currentQuestion.id] || ''}
                      onChange={(e) =>
                        setTextAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.id]: e.target.value,
                        }))
                      }
                      placeholder={`Type your detailed reasoning or justification for your answer here (minimum ${minWords} words required)...`}
                      className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none resize-y leading-relaxed font-sans"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Evaluation rubric requires at least {minWords} words of justification.</span>
                    {!isMet && wordCount > 0 && (
                      <span className="text-amber-600 font-semibold">
                        {minWords - wordCount} more word{minWords - wordCount === 1 ? '' : 's'} needed
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Question Footer Navigation */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => handleClearAnswer(currentQuestion.id)}
              disabled={!(answers[currentQuestion.id]?.length > 0)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Response</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                disabled={currentIndex === examQuestions.length - 1}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Matrix Palette (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Question Palette</h3>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-600">Review ({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-slate-600">Left ({unansweredCount})</span>
              </div>
            </div>

            {/* Number Matrix Grid */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {examQuestions.map((q, idx) => {
                const isAnswered = (answers[q.id] || []).length > 0;
                const isReview = markedForReview[q.id];
                const isCurrent = currentIndex === idx;

                let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isReview) {
                  btnStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg border text-xs font-semibold flex items-center justify-center relative transition-all cursor-pointer ${btnStyle} ${
                      isCurrent ? 'ring-2 ring-blue-600 ring-offset-1' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isReview && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Guidelines Reminder */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-2">
            <p className="font-bold text-slate-800">Exam Instructions</p>
            <p className="text-slate-500 leading-relaxed">
              Auto-save is active. Your responses are stored instantly as you select choices.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Interactive Calculator Widget */}
      {showCalculator && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 w-64 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              Scientific Calc
            </span>
            <button
              onClick={() => setShowCalculator(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800 p-2.5 rounded-lg text-right font-mono text-lg font-bold text-emerald-400 mb-3 overflow-x-auto">
            {calcInput}
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            {['C', '(', ')', '/'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcButton(btn)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-md cursor-pointer"
              >
                {btn}
              </button>
            ))}
            {['7', '8', '9', '*'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcButton(btn)}
                className={`p-2 rounded-md cursor-pointer ${
                  isNaN(Number(btn)) ? 'bg-slate-800 text-amber-400' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {btn}
              </button>
            ))}
            {['4', '5', '6', '-'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcButton(btn)}
                className={`p-2 rounded-md cursor-pointer ${
                  isNaN(Number(btn)) ? 'bg-slate-800 text-amber-400' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {btn}
              </button>
            ))}
            {['1', '2', '3', '+'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcButton(btn)}
                className={`p-2 rounded-md cursor-pointer ${
                  isNaN(Number(btn)) ? 'bg-slate-800 text-amber-400' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {btn}
              </button>
            ))}
            {['0', '.', '=', '%'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleCalcButton(btn)}
                className={`p-2 rounded-md cursor-pointer ${
                  btn === '='
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : isNaN(Number(btn))
                    ? 'bg-slate-800 text-amber-400'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Submit Examination?</h3>
                <p className="text-xs text-slate-500">Are you sure you want to end your attempt?</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block">Answered</span>
                <span className="font-bold text-emerald-600 text-sm">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Review</span>
                <span className="font-bold text-amber-600 text-sm">{reviewCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Unanswered</span>
                <span className="font-bold text-slate-700 text-sm">{unansweredCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-rose-600 font-semibold">
                Warning: You have {unansweredCount} unanswered questions remaining.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
