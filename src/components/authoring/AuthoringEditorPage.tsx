import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarkdownEditor } from '../common/MarkdownEditor';
import { Switch } from '../common/Switch';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Question, QuestionType, QuestionDifficulty, TestCase } from '../../types';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  Settings,
  Code,
  CheckCircle2,
  FileCode,
  Play,
  Terminal,
  ShieldAlert,
  HelpCircle,
  Clock,
  Layers,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MarkdownView } from '../common/MarkdownView';
import { StructuredQuestionView } from '../common/StructuredQuestionView';

interface AuthoringEditorProps {
  assessmentId?: string;
}

const DEFAULT_PYTHON_STARTER = `def solution(nums: list[int], target: int) -> list[int]:
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    """
    # Write your code here
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`;

const DEFAULT_JS_STARTER = `function solution(nums, target) {
    // Write your code here
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
`;

export const AuthoringEditorPage: React.FC<AuthoringEditorProps> = ({ assessmentId = 'asm-1' }) => {
  const { assessments, navigateTo, showToast } = useApp();

  const currentAssessment =
    assessments.find((a) => a.id === assessmentId) || assessments[0] || {
      id: 'asm-1',
      title: 'Python Basics — Week 1',
      description: 'Fundamental syntax and control structures.',
      duration: 45,
      passingScore: 60,
      category: 'Programming',
      status: 'Published',
      questions: [],
    };

  const [title, setTitle] = useState(currentAssessment.title);
  const [duration, setDuration] = useState(String(currentAssessment.duration || 60));
  const [passingScore, setPassingScore] = useState(String(currentAssessment.passingScore || 40));
  const [questions, setQuestions] = useState<Question[]>(
    currentAssessment.questions && currentAssessment.questions.length > 0
      ? currentAssessment.questions
      : [
          {
            id: 'q-editor-1',
            title: 'Variable Binding & Garbage Collection',
            type: 'MCQ',
            difficulty: 'MEDIUM',
            marks: 2,
            negativeMarks: 0.5,
            requireReasoning: false,
            stemMarkdown: 'What is the primary mechanism Python uses for automatic memory management?',
            options: [
              { id: 'opt-e1', text: 'Reference counting supplemented with cyclic generational garbage collection', isCorrect: true },
              { id: 'opt-e2', text: 'Manual `malloc()` and `free()` pointers', isCorrect: false },
              { id: 'opt-e3', text: 'Static compiler stack allocation only', isCorrect: false },
            ],
          },
        ]
  );

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewCodeRunOutput, setPreviewCodeRunOutput] = useState<string | null>(null);
  const [showSolutionCode, setShowSolutionCode] = useState(false);

  const activeQuestion = questions[activeQuestionIndex] || questions[0];

  const updateActiveQuestion = (fields: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeQuestionIndex ? { ...q, ...fields } : q))
    );
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === 'CODING') {
      updateActiveQuestion({
        type: 'CODING',
        language: activeQuestion.language || 'python',
        codeTemplate: activeQuestion.codeTemplate || DEFAULT_PYTHON_STARTER,
        solutionCode: activeQuestion.solutionCode || DEFAULT_PYTHON_STARTER,
        timeLimitSec: activeQuestion.timeLimitSec || 2,
        memoryLimitMb: activeQuestion.memoryLimitMb || 256,
        testCases:
          activeQuestion.testCases && activeQuestion.testCases.length > 0
            ? activeQuestion.testCases
            : [
                {
                  id: `tc-${Date.now()}-1`,
                  input: 'nums = [2, 7, 11, 15], target = 9',
                  expectedOutput: '[0, 1]',
                  marks: Math.round(activeQuestion.marks * 0.4) || 2,
                  isHidden: false,
                  explanation: 'Basic standard two-sum test case',
                },
                {
                  id: `tc-${Date.now()}-2`,
                  input: 'nums = [3, 2, 4], target = 6',
                  expectedOutput: '[1, 2]',
                  marks: Math.round(activeQuestion.marks * 0.3) || 2,
                  isHidden: false,
                  explanation: 'Indices out of numerical order test case',
                },
                {
                  id: `tc-${Date.now()}-3`,
                  input: 'nums = [3, 3], target = 6',
                  expectedOutput: '[0, 1]',
                  marks: Math.round(activeQuestion.marks * 0.3) || 1,
                  isHidden: true,
                  explanation: 'Duplicate numbers matching target',
                },
              ],
      });
    } else if (newType === 'FILL_BLANK') {
      updateActiveQuestion({
        type: 'FILL_BLANK',
        expectedAnswer: activeQuestion.expectedAnswer || '',
        acceptableAnswers: activeQuestion.acceptableAnswers || [],
        isCaseSensitive: activeQuestion.isCaseSensitive ?? false,
      });
    } else if (newType === 'SHORT_ANSWER' || newType === 'SCENARIO') {
      updateActiveQuestion({
        type: newType,
        expectedAnswer: activeQuestion.expectedAnswer || '',
        evaluationRubric: activeQuestion.evaluationRubric || 'Provide concise explanation detailing core mechanism.',
      });
    } else {
      // MCQ or MSQ
      const defaultOpts =
        activeQuestion.options && activeQuestion.options.length >= 2
          ? activeQuestion.options
          : [
              { id: `opt-${Date.now()}-1`, text: 'Option 1', isCorrect: true },
              { id: `opt-${Date.now()}-2`, text: 'Option 2', isCorrect: false },
            ];
      updateActiveQuestion({
        type: newType,
        options: defaultOpts,
      });
    }
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      title: `Question ${questions.length + 1}`,
      type: 'MCQ',
      difficulty: 'MEDIUM',
      marks: 2,
      negativeMarks: 0,
      requireReasoning: false,
      stemMarkdown: '',
      options: [
        { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
        { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
      ],
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionIndex(questions.length);
  };

  const handleDeleteActiveQuestion = () => {
    if (questions.length <= 1) {
      showToast('Assessment must have at least 1 question', 'warning');
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== activeQuestionIndex));
    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));
  };

  const handleSave = () => {
    showToast(`Assessment "${title}" draft saved successfully`, 'success');
  };

  const handlePublish = () => {
    showToast(`Assessment "${title}" published live to student catalog`, 'success');
    navigateTo('/assessments');
  };

  // Test Case Handlers for Coding Questions
  const handleAddTestCase = () => {
    const newTc: TestCase = {
      id: `tc-${Date.now()}`,
      input: '',
      expectedOutput: '',
      marks: 1,
      isHidden: false,
      explanation: '',
    };
    const existing = activeQuestion.testCases || [];
    updateActiveQuestion({ testCases: [...existing, newTc] });
  };

  const handleUpdateTestCase = (tcId: string, fields: Partial<TestCase>) => {
    const existing = activeQuestion.testCases || [];
    const updated = existing.map((tc) => (tc.id === tcId ? { ...tc, ...fields } : tc));
    updateActiveQuestion({ testCases: updated });
  };

  const handleDeleteTestCase = (tcId: string) => {
    const existing = activeQuestion.testCases || [];
    if (existing.length <= 1) {
      showToast('A coding question should have at least 1 test case', 'warning');
      return;
    }
    updateActiveQuestion({ testCases: existing.filter((tc) => tc.id !== tcId) });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/assessments')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              <Badge variant={currentAssessment.status === 'Published' ? 'published' : 'draft'}>
                {currentAssessment.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Authoring Studio • Question Builder & Inspector</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setPreviewCodeRunOutput(null);
              setPreviewModalOpen(true);
            }}
            className="border border-slate-200 bg-white text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Candidate Preview</span>
          </button>

          <button
            onClick={handleSave}
            className="border border-slate-200 bg-white text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Assessment</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Question List (Left) | Main Editor (Center) | Settings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Questions List (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              Questions ({questions.length})
            </span>
            <button
              onClick={handleAddQuestion}
              className="p-1 rounded-md text-blue-600 hover:bg-blue-50 font-semibold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isCoding = q.type === 'CODING';
              return (
                <button
                  key={q.id || idx}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    activeQuestionIndex === idx
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="truncate flex-1">
                    <span className="font-bold mr-1">Q{idx + 1}.</span>
                    <span>{q.title || 'Untitled'}</span>
                  </div>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 ${
                      isCoding
                        ? 'bg-purple-100 text-purple-800 border border-purple-200 font-bold'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {q.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Column: Active Question Form (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          {activeQuestion && (
            <>
              {/* Question Header & Type Switcher */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Question {activeQuestionIndex + 1}
                  </h3>
                  {activeQuestion.type === 'CODING' && (
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      <span>Coding Challenge</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-xs font-semibold text-slate-500">Type:</label>
                    <select
                      value={activeQuestion.type}
                      onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                      className="border border-slate-200 rounded-md px-2.5 py-1 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="MCQ">MCQ — Single Choice</option>
                      <option value="MSQ">MSQ — Multiple Select</option>
                      <option value="CODING">Coding Challenge</option>
                      <option value="FILL_BLANK">Fill-in-the-blank</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="SCENARIO">Scenario / Case Study</option>
                    </select>
                  </div>

                  <button
                    onClick={handleDeleteActiveQuestion}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={activeQuestion.title}
                  onChange={(e) => updateActiveQuestion({ title: e.target.value })}
                  placeholder={
                    activeQuestion.type === 'CODING'
                      ? 'e.g. Implement Two-Sum with Hash Map'
                      : 'e.g. Memory Allocation and List Mutability'
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Marks & Difficulty */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={activeQuestion.difficulty}
                    onChange={(e) =>
                      updateActiveQuestion({
                        difficulty: e.target.value as QuestionDifficulty,
                      })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={activeQuestion.marks}
                    onChange={(e) =>
                      updateActiveQuestion({ marks: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Neg. Marks
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={activeQuestion.negativeMarks}
                    onChange={(e) =>
                      updateActiveQuestion({
                        negativeMarks: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Stem Markdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeQuestion.type === 'CODING' ? 'Problem Statement & Specification (Markdown)' : 'Question Stem (Markdown)'}
                </label>
                <MarkdownEditor
                  value={activeQuestion.stemMarkdown}
                  onChange={(val) => updateActiveQuestion({ stemMarkdown: val })}
                  placeholder={
                    activeQuestion.type === 'CODING'
                      ? 'Write problem description, constraints, input/output specifications, examples...'
                      : 'Question stem content using markdown formatting...'
                  }
                />
              </div>

              {/* ========================================================================= */}
              {/* DYNAMIC SECTION: RENDER SPECIFIC EDITOR BASED ON QUESTION TYPE            */}
              {/* ========================================================================= */}

              {/* 1. CODING QUESTION WORKSPACE */}
              {activeQuestion.type === 'CODING' && (
                <div className="space-y-5 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between bg-purple-50/70 p-3 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold text-purple-900">
                        Coding Problem Workspace
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Language:</span>
                      <select
                        value={activeQuestion.language || 'python'}
                        onChange={(e) => updateActiveQuestion({ language: e.target.value })}
                        className="bg-white border border-purple-200 rounded-md px-2.5 py-1 text-xs font-bold text-purple-900 focus:outline-none"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (Node.js)</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java (OpenJDK 17)</option>
                        <option value="cpp">C++ (GCC 12)</option>
                        <option value="go">Go 1.22</option>
                        <option value="sql">PostgreSQL / SQL</option>
                      </select>
                    </div>
                  </div>

                  {/* Runtime Constraints */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Execution Time Limit (seconds)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={activeQuestion.timeLimitSec || 2}
                        onChange={(e) =>
                          updateActiveQuestion({ timeLimitSec: parseInt(e.target.value, 10) || 2 })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Memory Limit (MB)
                      </label>
                      <input
                        type="number"
                        min="64"
                        max="1024"
                        value={activeQuestion.memoryLimitMb || 256}
                        onChange={(e) =>
                          updateActiveQuestion({ memoryLimitMb: parseInt(e.target.value, 10) || 256 })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* Starter / Template Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>Candidate Starter Code / Function Signature</span>
                      </label>
                      <span className="text-xs text-slate-500 font-mono">
                        {(activeQuestion.language || 'python').toUpperCase()}
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      value={activeQuestion.codeTemplate || ''}
                      onChange={(e) => updateActiveQuestion({ codeTemplate: e.target.value })}
                      placeholder="Write function boilerplate presented to the student..."
                      className="w-full font-mono text-xs bg-slate-900 text-emerald-400 p-3.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Model Solution Reference (Collapsible) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowSolutionCode(!showSolutionCode)}
                      className="w-full bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Reference / Model Solution Code (Hidden from Candidates)</span>
                      </div>
                      {showSolutionCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showSolutionCode && (
                      <div className="p-3 bg-slate-900 border-t border-slate-800">
                        <textarea
                          rows={6}
                          value={activeQuestion.solutionCode || ''}
                          onChange={(e) => updateActiveQuestion({ solutionCode: e.target.value })}
                          placeholder="Reference working solution for automatic grading checks..."
                          className="w-full font-mono text-xs bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Automated Test Cases Builder */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Automated Test Cases ({activeQuestion.testCases?.length || 0})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Evaluated against candidate stdout/returns during submission
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddTestCase}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Test Case</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(activeQuestion.testCases || []).map((tc, tcIdx) => (
                        <div
                          key={tc.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">
                                Test Case #{tcIdx + 1}
                              </span>
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tc.isHidden || false}
                                  onChange={(e) =>
                                    handleUpdateTestCase(tc.id, { isHidden: e.target.checked })
                                  }
                                  className="w-3 h-3 text-purple-600 rounded"
                                />
                                <span>Hidden (Proctored)</span>
                              </label>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <span>Marks:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={tc.marks || 1}
                                  onChange={(e) =>
                                    handleUpdateTestCase(tc.id, {
                                      marks: parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-12 px-1.5 py-0.5 border border-slate-200 rounded text-center bg-white"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTestCase(tc.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                title="Remove test case"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="block text-xs font-semibold text-slate-600 mb-1">
                                Input (stdin / arguments)
                              </span>
                              <textarea
                                rows={2}
                                value={tc.input}
                                onChange={(e) =>
                                  handleUpdateTestCase(tc.id, { input: e.target.value })
                                }
                                placeholder="[2, 7, 11, 15]\n9"
                                className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-slate-600 mb-1">
                                Expected Output
                              </span>
                              <textarea
                                rows={2}
                                value={tc.expectedOutput}
                                onChange={(e) =>
                                  handleUpdateTestCase(tc.id, { expectedOutput: e.target.value })
                                }
                                placeholder="[0, 1]"
                                className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono bg-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. FILL-IN-THE-BLANK QUESTION WORKSPACE */}
              {activeQuestion.type === 'FILL_BLANK' && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-950">
                      Fill-in-the-Blank Evaluation Criteria
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Expected Answer <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={activeQuestion.expectedAnswer || ''}
                        onChange={(e) => updateActiveQuestion({ expectedAnswer: e.target.value })}
                        placeholder="e.g. Reference counting"
                        className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Acceptable Synonyms / Alternate Answers (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(activeQuestion.acceptableAnswers || []).join(', ')}
                        onChange={(e) =>
                          updateActiveQuestion({
                            acceptableAnswers: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="e.g. reference count, ref counting, ref-count"
                        className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeQuestion.isCaseSensitive || false}
                          onChange={(e) =>
                            updateActiveQuestion({ isCaseSensitive: e.target.checked })
                          }
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span>Enforce strict case-sensitive matching</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SHORT ANSWER / SCENARIO QUESTION WORKSPACE */}
              {(activeQuestion.type === 'SHORT_ANSWER' || activeQuestion.type === 'SCENARIO') && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                    <h4 className="text-xs font-bold text-blue-950">
                      Descriptive & Scenario Grading Rubric
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Model Answer / Key Concept Highlights
                      </label>
                      <textarea
                        rows={3}
                        value={activeQuestion.expectedAnswer || ''}
                        onChange={(e) => updateActiveQuestion({ expectedAnswer: e.target.value })}
                        placeholder="Key points candidates must mention to achieve full marks..."
                        className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Evaluation Rubric / Grading Guidelines
                      </label>
                      <textarea
                        rows={2}
                        value={activeQuestion.evaluationRubric || ''}
                        onChange={(e) => updateActiveQuestion({ evaluationRubric: e.target.value })}
                        placeholder="e.g. 50% for core concept, 50% for identifying edge cases"
                        className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MCQ / MSQ OPTIONS WORKSPACE (ONLY SHOWN FOR MCQ / MSQ) */}
              {(activeQuestion.type === 'MCQ' || activeQuestion.type === 'MSQ') && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800">
                        Choice Options ({activeQuestion.options?.length || 0})
                      </label>
                      <p className="text-xs text-slate-500">
                        {activeQuestion.type === 'MSQ'
                          ? 'Multiple select: select all valid correct options'
                          : 'Single select: select exactly one correct option'}
                      </p>
                    </div>
                  </div>

                  {(activeQuestion.options || []).map((opt, oIdx) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border space-y-2 transition-colors ${
                        opt.isCorrect
                          ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input
                            type={activeQuestion.type === 'MSQ' ? 'checkbox' : 'radio'}
                            name={`editor-correct-${activeQuestion.id}`}
                            checked={opt.isCorrect}
                            onChange={() => {
                              if (activeQuestion.type === 'MSQ') {
                                const updated = activeQuestion.options.map((o) =>
                                  o.id === opt.id ? { ...o, isCorrect: !o.isCorrect } : o
                                );
                                updateActiveQuestion({ options: updated });
                              } else {
                                const updated = activeQuestion.options.map((o) => ({
                                  ...o,
                                  isCorrect: o.id === opt.id,
                                }));
                                updateActiveQuestion({ options: updated });
                              }
                            }}
                            className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                          />
                          <span className={opt.isCorrect ? 'text-blue-800 font-bold' : ''}>
                            Option {String.fromCharCode(65 + oIdx)} {opt.isCorrect ? '(Correct Answer)' : ''}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            if ((activeQuestion.options || []).length <= 2) {
                              showToast('MCQ questions must have at least 2 options', 'warning');
                              return;
                            }
                            const updated = activeQuestion.options.filter((o) => o.id !== opt.id);
                            updateActiveQuestion({ options: updated });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = activeQuestion.options.map((o) =>
                            o.id === opt.id ? { ...o, text: e.target.value } : o
                          );
                          updateActiveQuestion({ options: updated });
                        }}
                        placeholder={`Choice content for option ${String.fromCharCode(65 + oIdx)}`}
                        className="w-full border border-slate-200 bg-white rounded-md px-3 py-1.5 text-xs font-sans focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const newOpt = {
                        id: `opt-${Date.now()}`,
                        text: '',
                        isCorrect: false,
                      };
                      updateActiveQuestion({
                        options: [...(activeQuestion.options || []), newOpt],
                      });
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Assessment Properties (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Settings className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">Assessment Config</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Passing Score (%)
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
            />
          </div>

          <div className="pt-2">
            <Switch
              checked={true}
              onChange={() => {}}
              label="Shuffle Questions"
              description="Randomize item sequence"
            />
          </div>

          <div className="pt-2">
            <Switch
              checked={false}
              onChange={() => {}}
              label="Calculator Permitted"
              description="Enable on-screen widget"
            />
          </div>
        </div>
      </div>

      {/* Preview Modal — Accurately simulates the Candidate Experience */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Candidate Simulation"
        subtitle={`Live Question Preview • ${title}`}
      >
        <div className="space-y-4">
          {/* Question Header Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Q{activeQuestionIndex + 1}: {activeQuestion.title || 'Untitled'}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeQuestion.type === 'CODING'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {activeQuestion.type} (+{activeQuestion.marks} marks)
            </span>
          </div>

          {/* Stem / Problem Statement with Dedicated Structured Fields */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <StructuredQuestionView question={activeQuestion} showSampleTestCases={activeQuestion.type === 'CODING'} />
          </div>

          {/* SIMULATION FOR CODING */}
          {activeQuestion.type === 'CODING' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-100 p-2 rounded-lg">
                <span className="font-semibold">
                  Language: <strong className="text-slate-900">{(activeQuestion.language || 'python').toUpperCase()}</strong>
                </span>
                <span>Limits: {activeQuestion.timeLimitSec || 2}s / {activeQuestion.memoryLimitMb || 256}MB</span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-3">
                <div className="text-xs text-slate-400 font-mono mb-1.5 flex items-center justify-between">
                  <span>Candidate IDE Editor</span>
                  <span className="text-emerald-400">Ready</span>
                </div>
                <pre className="font-mono text-xs text-emerald-400 overflow-x-auto p-2 bg-slate-900 rounded-lg">
                  {activeQuestion.codeTemplate || '# Write code here'}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewCodeRunOutput(
                      `[Execution Successful]\nAll 3 / 3 test cases passed in 0.04s.\nTest #1 (nums=[2,7,11,15], target=9): Output [0, 1] ✓\nTest #2 (nums=[3,2,4], target=6): Output [1, 2] ✓\nTest #3 (Hidden Proctored Case): Output [0, 1] ✓`
                    );
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Run Code Simulation</span>
                </button>
              </div>

              {previewCodeRunOutput && (
                <div className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl whitespace-pre-wrap border border-slate-800">
                  {previewCodeRunOutput}
                </div>
              )}
            </div>
          )}

          {/* SIMULATION FOR FILL_BLANK */}
          {activeQuestion.type === 'FILL_BLANK' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Answer Field (Pre-filled Solution):</label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Correct Answer Filled
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={activeQuestion.expectedAnswer || 'Expected answer key'}
                className="w-full border-2 border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold bg-emerald-50 text-emerald-950 shadow-xs focus:outline-none"
              />
            </div>
          )}

          {/* SIMULATION FOR SHORT_ANSWER / SCENARIO / REASON */}
          {(activeQuestion.type === 'SHORT_ANSWER' || activeQuestion.type === 'SCENARIO' || activeQuestion.requireReasoning) && (
            <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-500 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Proper Reason & Model Rubric</span>
              </div>
              <div className="text-xs text-emerald-950 leading-relaxed font-medium bg-white/90 p-3 rounded-lg border border-emerald-200">
                <MarkdownView
                  content={
                    activeQuestion.expectedAnswer ||
                    activeQuestion.evaluationRubric ||
                    'Detailed model reasoning and evaluation rubric.'
                  }
                />
              </div>
            </div>
          )}

          {/* SIMULATION FOR MCQ / MSQ */}
          {(activeQuestion.type === 'MCQ' || activeQuestion.type === 'MSQ') && (
            <div className="space-y-2">
              {(activeQuestion.options || []).map((opt, idx) => {
                const isCorrect = Boolean(opt.isCorrect);
                return (
                  <div
                    key={opt.id}
                    className={`p-3.5 rounded-xl border-2 text-xs flex items-center gap-2.5 transition-all ${
                      isCorrect
                        ? 'bg-emerald-50/85 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border ${
                        isCorrect
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 text-slate-500 bg-slate-50'
                      }`}
                    >
                      {isCorrect ? <Check className="w-3 h-3" /> : String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt.text || `Option ${String.fromCharCode(65 + idx)}`}</span>
                    {isCorrect && (
                      <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
