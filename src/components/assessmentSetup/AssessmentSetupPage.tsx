import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Switch } from '../common/Switch';
import { MarkdownEditor } from '../common/MarkdownEditor';
import { Modal } from '../common/Modal';
import { Question, QuestionType, QuestionDifficulty, QuestionOption, TestCase } from '../../types';
import {
  ArrowLeft,
  Eye,
  Mail,
  AlertTriangle,
  Download,
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Sparkles,
  CheckCircle,
  FileCode,
  Layers,
  Code,
  Play,
  FileUp,
  FileText,
  X,
  FileCheck,
  Loader2,
  CheckCircle2,
  CheckSquare,
  Shield,
  Calculator,
  Flag,
  Check,
  Send,
  RotateCcw,
  LogIn,
  LogOut,
  Sliders,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MarkdownView } from '../common/MarkdownView';
import { StructuredQuestionView } from '../common/StructuredQuestionView';

const generateUniqueId = (prefix: string = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const CODING_LANGUAGES = [
  { id: 'python', label: 'Python 3', defaultExt: 'py', commentPrefix: '#' },
  { id: 'java', label: 'Java (OpenJDK 17)', defaultExt: 'java', commentPrefix: '//' },
  { id: 'cpp', label: 'C++ (GCC 12)', defaultExt: 'cpp', commentPrefix: '//' },
  { id: 'javascript', label: 'JavaScript (Node.js)', defaultExt: 'js', commentPrefix: '//' },
  { id: 'typescript', label: 'TypeScript', defaultExt: 'ts', commentPrefix: '//' },
  { id: 'sql', label: 'PostgreSQL / SQL', defaultExt: 'sql', commentPrefix: '--' },
  { id: 'go', label: 'Go 1.22', defaultExt: 'go', commentPrefix: '//' },
];

interface CodingQuestionEditorProps {
  question: Question;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  onAddTestCase: (questionId: string) => void;
  onUpdateTestCase: (questionId: string, testCaseId: string, updates: Partial<TestCase>) => void;
  onDeleteTestCase: (questionId: string, testCaseId: string) => void;
}

const CodingQuestionEditor: React.FC<CodingQuestionEditorProps> = ({
  question,
  updateQuestion,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
}) => {
  const primaryLang = (question.language || 'python').toLowerCase();
  const [selectedLang, setSelectedLang] = useState<string>(primaryLang);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Determine current boilerplate for the selected language
  const activeTemplate =
    question.codeTemplates?.[selectedLang] ??
    (selectedLang === primaryLang ? question.codeTemplate || '' : '');

  const isConfiguredInJson = Boolean(activeTemplate && activeTemplate.trim().length > 0);
  const currentLangObj = CODING_LANGUAGES.find((l) => l.id === selectedLang) || CODING_LANGUAGES[0];

  const handleTemplateChange = (newText: string) => {
    const updatedTemplates = {
      ...(question.codeTemplates || {}),
      [selectedLang]: newText,
    };
    const updates: Partial<Question> = {
      codeTemplates: updatedTemplates,
    };
    if (selectedLang === primaryLang) {
      updates.codeTemplate = newText;
    }
    updateQuestion(question.id, updates);
  };

  const handleSetAsPrimary = () => {
    updateQuestion(question.id, {
      language: selectedLang,
      codeTemplate: activeTemplate,
    });
  };

  const handleCopyPrompt = () => {
    const promptText = `Please generate starter boilerplate code in ${currentLangObj.label} for the following coding problem:\n\nProblem Title: ${question.title || 'Untitled Problem'}\n\nDescription:\n${question.stemMarkdown || ''}\n\nProvide only the starter template code (function signature, parameters, and return structure) without complete solution.`;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200">
      {/* 1. Problem Specification Dedicated Fields */}
      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Dedicated Problem Specification Fields
          </span>
          <span className="text-[11px] text-slate-500">Structured sections displayed in dedicated boxes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <LogIn className="w-3 h-3 text-blue-600" /> Input Format
            </label>
            <textarea
              rows={3}
              value={question.inputFormat || ''}
              onChange={(e) => updateQuestion(question.id, { inputFormat: e.target.value })}
              placeholder="e.g., The first token is an integer N. The next N tokens are array elements..."
              className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <LogOut className="w-3 h-3 text-emerald-600" /> Output Format
            </label>
            <textarea
              rows={3}
              value={question.outputFormat || ''}
              onChange={(e) => updateQuestion(question.id, { outputFormat: e.target.value })}
              placeholder="e.g., A single line: Modest Profit Days: <value>."
              className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-amber-600" /> Constraints (One per line)
          </label>
          <textarea
            rows={2}
            value={Array.isArray(question.constraints) ? question.constraints.join('\n') : question.constraints || ''}
            onChange={(e) => updateQuestion(question.id, { constraints: e.target.value.split('\n').filter(Boolean) })}
            placeholder="1 <= N <= 1000&#10;-1000 <= pnl[i] <= 1000"
            className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Examples Editor */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" /> Examples ({question.examples?.length || 0})
            </label>
            <button
              type="button"
              onClick={() => {
                const cur = question.examples || [];
                updateQuestion(question.id, {
                  examples: [
                    ...cur,
                    { id: `ex-${question.id}-${cur.length + 1}`, input: '', output: '', explanation: '' },
                  ],
                });
              }}
              className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Example
            </button>
          </div>

          {(question.examples || []).map((ex, exIdx) => (
            <div key={ex.id || exIdx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Example {exIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = (question.examples || []).filter((_, i) => i !== exIdx);
                    updateQuestion(question.id, { examples: filtered });
                  }}
                  className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-500">Input:</span>
                  <textarea
                    rows={2}
                    value={ex.input}
                    onChange={(e) => {
                      const updated = [...(question.examples || [])];
                      updated[exIdx] = { ...updated[exIdx], input: e.target.value };
                      updateQuestion(question.id, { examples: updated });
                    }}
                    placeholder="Example input..."
                    className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500">Output:</span>
                  <textarea
                    rows={2}
                    value={ex.output}
                    onChange={(e) => {
                      const updated = [...(question.examples || [])];
                      updated[exIdx] = { ...updated[exIdx], output: e.target.value };
                      updateQuestion(question.id, { examples: updated });
                    }}
                    placeholder="Example output..."
                    className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500">Explanation (Optional):</span>
                <input
                  type="text"
                  value={ex.explanation || ''}
                  onChange={(e) => {
                    const updated = [...(question.examples || [])];
                    updated[exIdx] = { ...updated[exIdx], explanation: e.target.value };
                    updateQuestion(question.id, { examples: updated });
                  }}
                  placeholder="e.g., For this array, modest profit days = 3."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/80 p-3.5 rounded-xl border border-purple-200">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-700" />
          <span className="text-xs font-bold text-purple-900">
            Multi-Language Starter Code & Boilerplates
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-purple-950">Select Language:</label>
          <div className="relative">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className={`border rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                isConfiguredInJson
                  ? 'bg-white border-purple-300 text-purple-900 font-bold'
                  : 'bg-slate-100 border-slate-300 text-slate-500 italic'
              }`}
            >
              {CODING_LANGUAGES.map((lang) => {
                const hasTemplate = Boolean(
                  (question.codeTemplates?.[lang.id] ||
                    (lang.id === primaryLang ? question.codeTemplate : ''))?.trim()
                );
                return (
                  <option
                    key={lang.id}
                    value={lang.id}
                    className={
                      hasTemplate
                        ? 'font-bold text-slate-900 bg-white py-1'
                        : 'text-slate-400 bg-slate-100 italic py-1'
                    }
                  >
                    {lang.label} {hasTemplate ? '● (Configured in JSON)' : '○ (Idle - Blank)'}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-purple-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedLang !== primaryLang && (
            <button
              type="button"
              onClick={handleSetAsPrimary}
              className="text-xs font-bold bg-white text-purple-700 hover:bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-md transition-colors"
              title="Make this the default primary language for this question"
            >
              Set Default
            </button>
          )}
        </div>
      </div>

      {/* Language Availability Status Chips */}
      <div className="flex items-center gap-1.5 flex-wrap px-1">
        <span className="text-xs font-semibold text-slate-500 mr-1">Templates in JSON:</span>
        {CODING_LANGUAGES.map((lang) => {
          const hasTemplate = Boolean(
            (question.codeTemplates?.[lang.id] ||
              (lang.id === primaryLang ? question.codeTemplate : ''))?.trim()
          );
          const isCurrent = lang.id === selectedLang;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => setSelectedLang(lang.id)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                isCurrent
                  ? 'ring-2 ring-purple-600 font-bold'
                  : 'hover:opacity-80'
              } ${
                hasTemplate
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200 line-through decoration-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${hasTemplate ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{lang.label.split(' ')[0]}</span>
              {hasTemplate ? (
                <span className="text-xs text-emerald-600 font-bold">✓</span>
              ) : (
                <span className="text-xs text-slate-400">Idle</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Idle Notice Banner (When selected language has no boilerplate in JSON) */}
      {!isConfiguredInJson && (
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="font-bold">{currentLangObj.label} (Idle)</strong>: No boilerplate found in JSON. The starter code box below is blank.
              <p className="text-xs text-amber-700 mt-0.5">
                If you want to add a starter template, you can generate it from any LLM and paste it here manually.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="self-start sm:self-center shrink-0 px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
          >
            {copiedPrompt ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prompt Copied!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Copy LLM Prompt</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Starter Code Box */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>{currentLangObj.label} Starter Code Box</span>
            {isConfiguredInJson ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                Configured
              </span>
            ) : (
              <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                Idle / Blank
              </span>
            )}
          </label>

          <div className="flex items-center gap-2">
            {activeTemplate && (
              <button
                type="button"
                onClick={() => handleTemplateChange('')}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                Clear to Blank
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>{copiedPrompt ? 'Copied Prompt' : 'Copy LLM Prompt'}</span>
            </button>
          </div>
        </div>

        <textarea
          rows={7}
          value={activeTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          placeholder={
            isConfiguredInJson
              ? `Function signature and starter code for ${currentLangObj.label}...`
              : `${currentLangObj.commentPrefix} No starter code in JSON for ${currentLangObj.label}.\n${currentLangObj.commentPrefix} Box is blank. Paste code generated from any LLM or type manually here...`
          }
          className={`w-full font-mono text-xs p-3.5 rounded-xl border focus:outline-none focus:ring-1 ${
            isConfiguredInJson
              ? 'bg-slate-900 text-emerald-400 border-slate-700 focus:ring-purple-500'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 placeholder:text-slate-500 focus:ring-purple-500'
          }`}
          style={{ tabSize: 4, whiteSpace: 'pre' }}
        />
      </div>

      {/* Automated Test Cases */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            Automated Test Cases ({question.testCases?.length || 0})
          </label>
          <button
            type="button"
            onClick={() => onAddTestCase(question.id)}
            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Test Case</span>
          </button>
        </div>

        <div className="space-y-2">
          {(question.testCases || []).map((tc, tcIdx) => (
            <div
              key={tc.id ? `tc-${question.id}-${tc.id}` : `tc-${question.id}-${tcIdx}`}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Test Case #{tcIdx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(tc.isHidden)}
                      onChange={(e) =>
                        onUpdateTestCase(question.id, tc.id, { isHidden: e.target.checked })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                    />
                    <span>Hidden test case</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onDeleteTestCase(question.id, tc.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete test case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Standard Input (stdin):
                  </label>
                  <textarea
                    rows={2}
                    value={tc.input}
                    onChange={(e) =>
                      onUpdateTestCase(question.id, tc.id, { input: e.target.value })
                    }
                    placeholder="e.g., 6 4"
                    className="w-full font-mono text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Expected Output (stdout):
                  </label>
                  <textarea
                    rows={2}
                    value={tc.expectedOutput}
                    onChange={(e) =>
                      onUpdateTestCase(question.id, tc.id, { expectedOutput: e.target.value })
                    }
                    placeholder="e.g., [2, -5, 11, -20, 32, -47]"
                    className="w-full font-mono text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AssessmentSetupPage: React.FC = () => {
  const { createAssessment, navigateTo, showToast } = useApp();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [duration, setDuration] = useState('60');
  const [passingScore, setPassingScore] = useState('40');
  const [assessmentKind, setAssessmentKind] = useState('Standard — mixed MCQ / MSQ / Fill-in / Scenario');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [requireSafeExamBrowser, setRequireSafeExamBrowser] = useState(true);
  const [category, setCategory] = useState('Programming');

  // Validation Error Banner
  const [validationError, setValidationError] = useState<string | null>(null);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q-1',
      title: 'Python Memory Allocation and Variables',
      type: 'MCQ',
      difficulty: 'MEDIUM',
      marks: 1,
      negativeMarks: 0,
      requireReasoning: false,
      stemMarkdown: 'What happens in memory when executing the statement `a = [1, 2, 3]; b = a; b.append(4)`?',
      options: [
        { id: 'opt-1-1', text: 'Both `a` and `b` reference the same list object `[1, 2, 3, 4]` in heap memory.', isCorrect: true },
        { id: 'opt-1-2', text: '`b` creates a deep copy of `a`, so `a` remains `[1, 2, 3]`.', isCorrect: false },
        { id: 'opt-1-3', text: 'Python throws an `ImmutableAssignmentError`.', isCorrect: false },
        { id: 'opt-1-4', text: '`a` is cleared and garbage-collected automatically.', isCorrect: false },
      ],
    },
  ]);

  // Expanded Accordion State
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({
    'q-1': true,
  });

  // Preview Modal States — faithful to StudentExamPage
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [singlePreviewQuestion, setSinglePreviewQuestion] = useState<Question | null>(null);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [previewCodingLang, setPreviewCodingLang] = useState<string>('python');
  const [candidateSelectedOptions, setCandidateSelectedOptions] = useState<Record<string, string>>({});
  const [previewMarkedForReview, setPreviewMarkedForReview] = useState<Record<string, boolean>>({});
  const [previewTextAnswers, setPreviewTextAnswers] = useState<Record<string, string>>({});
  const [previewShowCalc, setPreviewShowCalc] = useState(false);

  // JSON Import Modal & File Upload States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    totalQuestions: number;
    codingCount: number;
    mcqCount: number;
    msqCount: number;
    fillBlankCount: number;
    shortAnswerCount: number;
    totalMarks: number;
  } | null>(null);
  const toolbarFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const oneShotFileInputRef = useRef<HTMLInputElement>(null);
  const [oneShotIsDragging, setOneShotIsDragging] = useState(false);
  const [oneShotProcessing, setOneShotProcessing] = useState(false);
  const [oneShotFileName, setOneShotFileName] = useState<string | null>(null);

  const toggleQuestionExpand = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddQuestion = () => {
    const newId = generateUniqueId('q');
    const newQuestion: Question = {
      id: newId,
      title: `Question ${questions.length + 1}`,
      type: 'MCQ',
      difficulty: 'MEDIUM',
      marks: 1,
      negativeMarks: 0,
      requireReasoning: false,
      stemMarkdown: '',
      options: [
        { id: generateUniqueId('opt'), text: '', isCorrect: true },
        { id: generateUniqueId('opt'), text: '', isCorrect: false },
        { id: generateUniqueId('opt'), text: '', isCorrect: false },
        { id: generateUniqueId('opt'), text: '', isCorrect: false },
      ],
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setExpandedQuestions((prev) => ({ ...prev, [newId]: true }));
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      showToast('Assessment must have at least 1 question', 'warning');
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, fields: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...fields } : q))
    );
  };

  const handleTypeChange = (questionId: string, newType: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (newType === 'CODING') {
          return {
            ...q,
            type: 'CODING',
            language: q.language || 'python',
            codeTemplate:
              q.codeTemplate ||
              `def solution(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass\n`,
            timeLimitSec: q.timeLimitSec || 2,
            memoryLimitMb: q.memoryLimitMb || 256,
            testCases:
              q.testCases && q.testCases.length > 0
                ? q.testCases
                : [
                    {
                      id: generateUniqueId('tc'),
                      input: 'nums = [2, 7, 11, 15], target = 9',
                      expectedOutput: '[0, 1]',
                      marks: 2,
                      isHidden: false,
                      explanation: 'Standard sample test case',
                    },
                    {
                      id: generateUniqueId('tc'),
                      input: 'nums = [3, 2, 4], target = 6',
                      expectedOutput: '[1, 2]',
                      marks: 1,
                      isHidden: true,
                      explanation: 'Hidden proctored evaluation case',
                    },
                  ],
          };
        } else if (newType === 'FILL_BLANK') {
          return {
            ...q,
            type: 'FILL_BLANK',
            expectedAnswer: q.expectedAnswer || '',
            acceptableAnswers: q.acceptableAnswers || [],
            isCaseSensitive: q.isCaseSensitive ?? false,
          };
        } else if (newType === 'SHORT_ANSWER' || newType === 'SCENARIO') {
          return {
            ...q,
            type: newType,
            expectedAnswer: q.expectedAnswer || '',
            evaluationRubric: q.evaluationRubric || 'Detail the core concept and edge considerations.',
          };
        } else {
          return {
            ...q,
            type: newType,
            options:
              q.options && q.options.length >= 2
                ? q.options
                : [
                    { id: generateUniqueId('opt'), text: 'Option 1', isCorrect: true },
                    { id: generateUniqueId('opt'), text: 'Option 2', isCorrect: false },
                  ],
          };
        }
      })
    );
  };

  const handleAddTestCase = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newTc: TestCase = {
          id: generateUniqueId('tc'),
          input: '',
          expectedOutput: '',
          marks: 1,
          isHidden: false,
          explanation: '',
        };
        return {
          ...q,
          testCases: [...(q.testCases || []), newTc],
        };
      })
    );
  };

  const handleUpdateTestCase = (questionId: string, tcId: string, fields: Partial<TestCase>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const updated = (q.testCases || []).map((tc) => (tc.id === tcId ? { ...tc, ...fields } : tc));
        return { ...q, testCases: updated };
      })
    );
  };

  const handleDeleteTestCase = (questionId: string, tcId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          testCases: (q.testCases || []).filter((tc) => tc.id !== tcId),
        };
      })
    );
  };

  const handleAddOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const newOpt: QuestionOption = {
          id: generateUniqueId('opt'),
          text: '',
          isCorrect: false,
        };
        return { ...q, options: [...(q.options || []), newOpt] };
      })
    );
  };

  const handleRemoveOption = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if ((q.options || []).length <= 2) {
          showToast('MCQ questions require at least 2 options', 'warning');
          return q;
        }
        return {
          ...q,
          options: (q.options || []).filter((opt) => opt.id !== optionId),
        };
      })
    );
  };

  const handleSetCorrectOption = (questionId: string, optionId: string, isMultiple = false) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (isMultiple) {
          return {
            ...q,
            options: (q.options || []).map((opt) =>
              opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
            ),
          };
        }
        return {
          ...q,
          options: (q.options || []).map((opt) => ({
            ...opt,
            isCorrect: opt.id === optionId,
          })),
        };
      })
    );
  };

  const handleOptionTextChange = (questionId: string, optionId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        return {
          ...q,
          options: (q.options || []).map((opt) => (opt.id === optionId ? { ...opt, text } : opt)),
        };
      })
    );
  };

  const handleDownloadTemplate = () => {
    const template = {
      title: title || "Python Basics — Week 1",
      description: description || "Introductory assessment on Python fundamentals.",
      duration: parseInt(duration, 10) || 60,
      passingScore: parseInt(passingScore, 10) || 40,
      questions: questions,
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-template-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON template downloaded', 'success');
  };

  const processJSONContent = async (content: string, sourceName?: string): Promise<boolean> => {
    setIsImporting(true);
    try {
      let rawJsonObj: any;
      try {
        rawJsonObj = JSON.parse(content);
      } catch (parseErr) {
        showToast('Invalid JSON syntax. Please verify JSON formatting.', 'error');
        setIsImporting(false);
        return false;
      }

      let parsedData: any = null;

      // 1. Attempt Backend Parsing via /api/parse-assessment-json
      try {
        const response = await fetch('/api/parse-assessment-json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jsonData: rawJsonObj }),
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.assessment) {
            parsedData = resJson;
          }
        }
      } catch (apiErr) {
        console.warn('Backend parser fetch not reachable, falling back to client-side normalizer:', apiErr);
      }

      // 2. Extract assessment & questions (from backend response or smart client normalization)
      const assessment = parsedData?.assessment || {};
      const stats = parsedData?.stats || null;

      const rawQuestions = parsedData?.assessment?.questions || (Array.isArray(rawJsonObj) ? rawJsonObj : rawJsonObj.questions || rawJsonObj.items || rawJsonObj.problems || []);

      if (assessment.title || rawJsonObj.title || rawJsonObj.name || rawJsonObj.assessment_title) {
        setTitle(assessment.title || rawJsonObj.title || rawJsonObj.name || rawJsonObj.assessment_title);
      }
      if (assessment.description || rawJsonObj.description || rawJsonObj.assessment_description) {
        setDescription(assessment.description || rawJsonObj.description || rawJsonObj.assessment_description);
      }
      if (assessment.instructions || rawJsonObj.instructions) {
        setInstructions(assessment.instructions || rawJsonObj.instructions);
      }
      if (assessment.duration || rawJsonObj.duration || rawJsonObj.time_limit_minutes || rawJsonObj.duration_minutes) {
        setDuration(String(assessment.duration || rawJsonObj.duration || rawJsonObj.time_limit_minutes || rawJsonObj.duration_minutes));
      }
      if (assessment.passingScore || rawJsonObj.passingScore || rawJsonObj.passing_score) {
        setPassingScore(String(assessment.passingScore || rawJsonObj.passingScore || rawJsonObj.passing_score));
      }
      if (assessment.category || rawJsonObj.category || rawJsonObj.topic) {
        setCategory(assessment.category || rawJsonObj.category || rawJsonObj.topic);
      }
      if (assessment.kind || rawJsonObj.kind || rawJsonObj.assessment_type) {
        setAssessmentKind(assessment.kind || rawJsonObj.kind || rawJsonObj.assessment_type);
      }
      if (rawJsonObj.seb_enabled !== undefined) {
        setRequireSafeExamBrowser(Boolean(rawJsonObj.seb_enabled));
      }

      if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
        let codingTally = 0;
        let mcqTally = 0;
        let msqTally = 0;
        let marksTally = 0;

        const sanitizedQuestions: Question[] = rawQuestions.map((q: any, qIdx: number) => {
          const qTypeStr = (q.type || q.question_type || '').toUpperCase().trim();
          
          // Determine type: CODING vs MCQ vs MSQ vs others — extended for MCQ_SINGLE samples
          let determinedType: QuestionType = 'MCQ';
          if (qTypeStr === 'CODING' || qTypeStr === 'CODE' || qTypeStr === 'PROGRAMMING') {
            determinedType = 'CODING';
          } else if (qTypeStr === 'MSQ' || qTypeStr === 'MULTIPLE_SELECT') {
            determinedType = 'MSQ';
          } else if (qTypeStr === 'MCQ' || qTypeStr === 'MCQ_SINGLE' || qTypeStr === 'MULTIPLE_CHOICE' || qTypeStr.startsWith('MCQ')) {
            determinedType = 'MCQ';
          } else if (qTypeStr === 'FILL_BLANK' || qTypeStr === 'FILL_IN_BLANK') {
            determinedType = 'FILL_BLANK';
          } else if (qTypeStr === 'SHORT_ANSWER') {
            determinedType = 'SHORT_ANSWER';
          } else if (qTypeStr === 'SCENARIO') {
            determinedType = 'SCENARIO';
          } else {
            // Heuristic detection — include starter_codes array for STEP1-COD
            const hasCode = !!(
              q.codeTemplate ||
              q.starterCode ||
              q.code_template ||
              (Array.isArray(q.starter_codes) && q.starter_codes.length > 0) ||
              (Array.isArray(q.starterCodes) && q.starterCodes.length > 0) ||
              (q.testCases && q.testCases.length > 0) ||
              (q.test_cases && q.test_cases.length > 0) ||
              (q.language && !q.options)
            );
            if (hasCode) {
              determinedType = 'CODING';
            } else if (Array.isArray(q.options) || Array.isArray(q.choices)) {
              const opts = q.options || q.choices;
              const correctCount = opts.filter((o: any) => o && (o.isCorrect || o.is_correct || o.correct)).length;
              determinedType = correctCount > 1 ? 'MSQ' : 'MCQ';
            }
          }

          const qMarks = typeof q.marks === 'number' ? q.marks : typeof q.question_marks === 'number' ? q.question_marks : typeof q.points === 'number' ? q.points : determinedType === 'CODING' ? 5 : 2;
          marksTally += qMarks;

          if (determinedType === 'CODING') codingTally++;
          else if (determinedType === 'MSQ') msqTally++;
          else if (determinedType === 'MCQ') mcqTally++;

          // Always treat question prompt/stem in the JSON file as Markdown
          let richStem =
            q.stemMarkdown ||
            q.stem_markdown ||
            q.markdown ||
            q.problem_statement ||
            q.problem ||
            q.stem ||
            q.prompt ||
            q.question ||
            q.questionText ||
            q.question_text ||
            (typeof q.content === 'string'
              ? q.content
              : q.content?.question_text || q.content?.markdown || q.content?.stem || q.content?.prompt) ||
            q.description ||
            q.body ||
            '';

          if (determinedType === 'CODING' && (q.description || q.input_format || q.output_format || q.constraints || q.examples)) {
            const parts: string[] = [];
            const primaryDesc = q.description || q.stemMarkdown || q.stem_markdown || q.prompt || q.question;
            if (primaryDesc) parts.push(primaryDesc);
            if (q.input_format) parts.push(`\n**Input Format:**\n${q.input_format}`);
            if (q.output_format) parts.push(`\n**Output Format:**\n${q.output_format}`);
            if (Array.isArray(q.constraints) && q.constraints.length > 0) parts.push(`\n**Constraints:**\n- ${q.constraints.join('\n- ')}`);
            if (Array.isArray(q.examples) && q.examples.length > 0) {
              const exStr = q.examples.map((ex: any, ei: number) => `**Example ${ei + 1}:**\nInput: \`${ex.input}\`\nOutput: \`${ex.output}\`${ex.explanation ? `\n_${ex.explanation}_` : ''}`).join('\n\n');
              parts.push(`\n**Examples:**\n${exStr}`);
            }
            if (parts.length > 0) {
              richStem = parts.join('\n');
            }
          }

          const rawDiff = q.difficulty || q.question_difficulty || q.level || (determinedType === 'CODING' ? 'MEDIUM' : 'EASY');
          const questionObj: Question = {
            id: q.id || generateUniqueId(`q-${qIdx}`),
            title: q.title || q.question_title || q.name || (determinedType === 'CODING' ? `Coding Problem ${qIdx + 1}` : `Question ${qIdx + 1}`),
            type: determinedType,
            difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(String(rawDiff).toUpperCase()) ? String(rawDiff).toUpperCase() : 'MEDIUM') as QuestionDifficulty,
            marks: qMarks,
            negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : typeof q.negative_marks === 'number' ? q.negative_marks : 0,
            requireReasoning: !!(q.requireReasoning || q.require_reasoning),
            stemMarkdown: richStem,
            description: q.description || q.stemMarkdown || q.stem_markdown || q.prompt || q.question || '',
            inputFormat: q.input_format || q.inputFormat || q.input || '',
            outputFormat: q.output_format || q.outputFormat || q.output || '',
            constraints: Array.isArray(q.constraints)
              ? q.constraints
              : typeof q.constraints === 'string'
              ? q.constraints.split('\n').filter(Boolean)
              : [],
            examples: (Array.isArray(q.examples) ? q.examples : []).map((ex: any, ei: number) => ({
              id: ex.id || `ex-${qIdx + 1}-${ei + 1}`,
              input: ex.input ?? '',
              output: ex.output ?? ex.expected_output ?? '',
              explanation: ex.explanation ?? '',
            })),
            options: [],
            testCases: [],
            language: q.language || q.lang || 'python',
            codeTemplate: (() => {
              // Handle starter_codes array form (STEP1-COD)
              if (Array.isArray(q.starter_codes) && q.starter_codes.length > 0) {
                const py = q.starter_codes.find((s: any) => String(s.language).toLowerCase().includes('py'));
                if (py?.code) return py.code;
                return q.starter_codes[0]?.code || '';
              }
              if (Array.isArray(q.starterCodes) && q.starterCodes.length > 0) {
                const py = q.starterCodes.find((s: any) => String(s.language).toLowerCase().includes('py'));
                if (py?.code) return py.code;
                return q.starterCodes[0]?.code || '';
              }
              return q.codeTemplate || q.code_template || q.starterCode || q.starter_code || (determinedType === 'CODING' ? '# Write your solution below\n\ndef solution(*args, **kwargs):\n    pass\n' : '');
            })(),
            solutionCode: q.solutionCode || q.solution_code || '',
            timeLimitSec: q.timeLimitSec || q.time_limit || (q.time_limit_ms ? Math.round(q.time_limit_ms / 1000) : 2) || 2,
            memoryLimitMb: q.memoryLimitMb || q.memory_limit || (q.memory_limit_kb ? Math.round(q.memory_limit_kb / 1024) : 256) || 256,
            expectedAnswer: q.expectedAnswer || q.expected_answer || q.answer || '',
            acceptableAnswers: (() => {
              const base = q.acceptableAnswers || q.acceptable_answers || [];
              if (q.answer && !base.includes(q.answer)) return [...base, q.answer];
              return base;
            })(),
            evaluationRubric: q.evaluationRubric || q.rubric || '',
          };
          // Attach full language map for multi-lang editor (python/java/cpp from starter_codes)
          if (determinedType === 'CODING' && (Array.isArray(q.starter_codes) || Array.isArray(q.starterCodes))) {
            const arr = (q.starter_codes || q.starterCodes) as any[];
            const map: Record<string, string> = {};
            for (const entry of arr) {
              if (entry?.language && entry?.code) {
                const key = String(entry.language).toLowerCase().includes('py') ? 'python' : String(entry.language).toLowerCase().includes('java') ? 'java' : String(entry.language).toLowerCase().includes('cpp') || String(entry.language).toLowerCase().includes('c++') ? 'cpp' : String(entry.language).toLowerCase();
                map[key] = entry.code;
              }
            }
            if (Object.keys(map).length > 0) (questionObj as any).codeTemplates = map;
            // Ensure primary language's template is also set correctly
            const primary = (questionObj.language || 'python').toLowerCase();
            if (map[primary]) questionObj.codeTemplate = map[primary];
          }

          // Populate Options for MCQ / MSQ — supports correctOptionId from reasoning sets
          if (determinedType === 'MCQ' || determinedType === 'MSQ') {
            const rawOpts = q.options || q.choices || q.answers || [];
            const correctId = (q as any).correctOptionId ?? (q as any).correct_option_id ?? (q as any).correctAnswer ?? (q as any).correct_answer;
            if (Array.isArray(rawOpts) && rawOpts.length > 0) {
              questionObj.options = rawOpts.map((opt: any, oIdx: number) => {
                if (typeof opt === 'string') {
                  return {
                    id: generateUniqueId(`opt-${qIdx}-${oIdx}`),
                    text: opt,
                    isCorrect: correctId ? opt === correctId || String.fromCharCode(97 + oIdx) === String(correctId).toLowerCase() : oIdx === 0,
                  };
                }
                const optId = opt.id || generateUniqueId(`opt-${qIdx}-${oIdx}`);
                const isCorrectById = correctId ? String(opt.id).toLowerCase() === String(correctId).toLowerCase() : false;
                return {
                  id: optId,
                  text: opt.text || opt.option || opt.value || `Option ${oIdx + 1}`,
                  isCorrect: isCorrectById || !!(opt.isCorrect || opt.is_correct || opt.correct),
                };
              });
              // Ensure exactly one correct for MCQ if none marked (fallback to correctId)
              if (determinedType === 'MCQ' && !questionObj.options.some((o) => o.isCorrect) && correctId) {
                const byIdx = questionObj.options.find((o, idx) => String.fromCharCode(97 + idx) === String(correctId).toLowerCase() || o.id === correctId);
                if (byIdx) byIdx.isCorrect = true;
              }
            } else {
              questionObj.options = [
                { id: generateUniqueId(`opt-${qIdx}-0`), text: 'Option A (Correct)', isCorrect: true },
                { id: generateUniqueId(`opt-${qIdx}-1`), text: 'Option B', isCorrect: false },
                { id: generateUniqueId(`opt-${qIdx}-2`), text: 'Option C', isCorrect: false },
                { id: generateUniqueId(`opt-${qIdx}-3`), text: 'Option D', isCorrect: false },
              ];
            }
          }

          // Populate Test Cases for CODING — supports is_sample/weight from STEP1-COD
          if (determinedType === 'CODING') {
            const rawTc = (q as any).test_cases || q.testCases || q.test_cases || q.tests || [];
            if (Array.isArray(rawTc) && rawTc.length > 0) {
              questionObj.testCases = rawTc.map((tc: any, tcIdx: number) => ({
                id: tc.id || generateUniqueId(`tc-${qIdx}-${tcIdx}`),
                input: tc.input || tc.stdin || 'sample_input = 10',
                expectedOutput: tc.expectedOutput || tc.expected_output || tc.output || '10',
                marks: typeof tc.marks === 'number' ? tc.marks : typeof tc.weight === 'number' ? tc.weight : typeof tc.score === 'number' ? tc.score : 1,
                isHidden: tc.is_sample !== undefined ? !tc.is_sample : tc.isSample !== undefined ? !tc.isSample : !!(tc.isHidden || tc.is_hidden || tc.hidden || tcIdx >= 2),
                explanation: tc.explanation || (tc.is_sample === false || tcIdx >= 2 ? 'Hidden validation test' : 'Standard sample test case'),
              }));
            } else {
              questionObj.testCases = [
                {
                  id: generateUniqueId(`tc-${qIdx}-0`),
                  input: 'nums = [2, 7, 11, 15], target = 9',
                  expectedOutput: '[0, 1]',
                  marks: 2,
                  isHidden: false,
                  explanation: 'Standard sample test case',
                },
                {
                  id: generateUniqueId(`tc-${qIdx}-1`),
                  input: 'nums = [3, 2, 4], target = 6',
                  expectedOutput: '[1, 2]',
                  marks: 1,
                  isHidden: false,
                  explanation: 'Edge sample test case',
                },
                {
                  id: generateUniqueId(`tc-${qIdx}-2`),
                  input: 'nums = [3, 3], target = 6',
                  expectedOutput: '[0, 1]',
                  marks: 2,
                  isHidden: true,
                  explanation: 'Hidden evaluation test case',
                },
              ];
            }
          }

          return questionObj;
        });

        setQuestions(sanitizedQuestions);
        const exp: Record<string, boolean> = {};
        sanitizedQuestions.forEach((q) => {
          exp[q.id] = true;
        });
        setExpandedQuestions(exp);

        setImportStats(
          stats || {
            totalQuestions: sanitizedQuestions.length,
            codingCount: codingTally,
            mcqCount: mcqTally,
            msqCount: msqTally,
            fillBlankCount: sanitizedQuestions.filter((q) => q.type === 'FILL_BLANK').length,
            shortAnswerCount: sanitizedQuestions.filter((q) => q.type === 'SHORT_ANSWER' || q.type === 'SCENARIO').length,
            totalMarks: marksTally,
          }
        );
      }

      const summaryMsg = stats?.message
        ? stats.message
        : `Imported ${rawQuestions.length} questions successfully!`;

      showToast(summaryMsg, 'success');
      setIsImporting(false);
      return true;
    } catch (err: any) {
      console.error('Import processing failure:', err);
      showToast('Failed to parse assessment JSON. Please check syntax.', 'error');
      setIsImporting(false);
      return false;
    }
  };

  const handleFileUploadFromFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('Please select a valid .json file.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        setJsonInput(text);
        setUploadedFileName(file.name);
        const success = await processJSONContent(text, file.name);
        if (success && importModalOpen) {
          setImportModalOpen(false);
        }
      }
    };
    reader.onerror = () => {
      showToast('Failed to read file from disk.', 'error');
    };
    reader.readAsText(file);
  };

  const handleToolbarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUploadFromFile(file);
    }
    // reset value so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setJsonInput(text);
          setUploadedFileName(file.name);
          showToast(`Loaded ${file.name}. Review below or click Parse and Import.`, 'info');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleModalDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        showToast('Please drop a .json file.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setJsonInput(text);
          setUploadedFileName(file.name);
          showToast(`Loaded ${file.name}. Review below or click Parse and Import.`, 'info');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportJSON = async () => {
    if (!jsonInput.trim()) {
      showToast('Please paste JSON content or select a .json file first.', 'warning');
      return;
    }
    const success = await processJSONContent(jsonInput, uploadedFileName || undefined);
    if (success) {
      setImportModalOpen(false);
      setJsonInput('');
      setUploadedFileName(null);
    }
  };

  // One-Shot JSON Setup — upload → parse → instantly create assessment in one flow
  const handleOneShotFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('Please select a valid .json file.', 'warning');
      return;
    }
    setOneShotProcessing(true);
    setOneShotFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        showToast('File is empty.', 'error');
        setOneShotProcessing(false);
        return;
      }
      try {
        let raw: any;
        try {
          raw = JSON.parse(text);
        } catch {
          showToast('Invalid JSON syntax.', 'error');
          setOneShotProcessing(false);
          return;
        }
        // Try backend parser for one-shot, fallback to client normalizer via processJSONContent
        let parsed: any = null;
        try {
          const res = await fetch('/api/parse-assessment-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonData: raw }),
          });
          if (res.ok) {
            const j = await res.json();
            if (j.success && j.assessment) parsed = j;
          }
        } catch {}
        // If backend succeeded, use its normalized assessment directly to create
        if (parsed?.assessment) {
          const a = parsed.assessment;
          const qs = a.questions || [];
          // Direct one-shot create — no need to populate form then click Create
          createAssessment({
            title: a.title || raw.title || raw.name || file.name.replace(/\.json$/i, ''),
            description: a.description || raw.description || '',
            instructions: a.instructions || raw.instructions || '',
            duration: a.duration || raw.duration || 60,
            passingScore: a.passingScore || raw.passingScore || 40,
            kind: a.kind || raw.kind || assessmentKind,
            publishImmediately,
            requireSafeExamBrowser,
            category: a.category || raw.category || category,
            questions: qs,
            questionsCount: qs.length,
          });
          showToast(`One-shot created "${a.title || file.name}" with ${qs.length} questions`, 'success');
          navigateTo('/assessments');
        } else {
          // Fallback: populate form via existing processor then auto-submit after short delay
          const ok = await processJSONContent(text, file.name);
          if (ok) {
            // Auto-fill already done by processJSONContent; now one-shot create from populated state after render
            setTimeout(() => {
              // Use latest questions state via closure — re-read from parsed fallback
              // Instead, create directly from raw with client-side sanitization already done in processJSONContent
              // For reliability, just show success and let user click Create, but we try to auto-create
              showToast('JSON parsed — review questions below or click Create Assessment to finish one-shot.', 'info');
            }, 300);
          }
        }
      } catch (err: any) {
        showToast(err?.message || 'One-shot setup failed.', 'error');
      } finally {
        setOneShotProcessing(false);
      }
    };
    reader.onerror = () => {
      showToast('Failed to read file.', 'error');
      setOneShotProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleOneShotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleOneShotFile(f);
    e.target.value = '';
  };

  const handleOneShotDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOneShotIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleOneShotFile(f);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      setValidationError('Assessment title is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if questions have titles
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].title.trim()) {
        setValidationError(`Question ${i + 1} requires a question title.`);
        window.scrollTo({ top: 300, behavior: 'smooth' });
        return;
      }
    }

    setValidationError(null);

    createAssessment({
      title: title.trim(),
      description,
      instructions,
      duration: parseInt(duration, 10) || 60,
      passingScore: parseInt(passingScore, 10) || 40,
      kind: assessmentKind,
      publishImmediately,
      requireSafeExamBrowser,
      category,
      questions,
      questionsCount: questions.length,
    });

    navigateTo('/assessments');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigateTo('/assessments')}
            className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assessments</span>
          </button>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            One-shot Assessment Setup
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Build a complete assessment in one form. Use the preview to see what students will see.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFullPreviewOpen(true)}
            className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview Assessment</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* One-Shot JSON Setup — Upload template → instantly create assessment */}
      <div className="bg-white rounded-xl border-2 border-dashed border-blue-200 shadow-xs overflow-hidden">
        <input ref={oneShotFileInputRef} type="file" accept=".json,application/json" onChange={handleOneShotSelect} className="hidden" />
        <div
          onDragOver={(e) => { e.preventDefault(); setOneShotIsDragging(true); }}
          onDragLeave={() => setOneShotIsDragging(false)}
          onDrop={handleOneShotDrop}
          className={`p-6 sm:p-8 text-center transition-all ${oneShotIsDragging ? 'bg-blue-50/80 border-blue-300' : 'bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/40'}`}
        >
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Shot Setup</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">NEW</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Create Assessment from JSON Template</h2>
              <p className="text-sm text-slate-600 mt-1">Upload your question JSON file — we’ll auto-parse Coding + MCQ/MSQ, configure boilerplates & test cases, and create the assessment in one shot. No manual form filling needed.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={oneShotProcessing}
                onClick={() => oneShotFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                {oneShotProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                <span>{oneShotProcessing ? 'Creating…' : 'Upload JSON & Create Instantly'}</span>
              </button>
              <span className="text-xs text-slate-500 hidden sm:block">or drag & drop here</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample JSON</span>
              </button>
            </div>

            {oneShotFileName && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold">
                <FileCheck className="w-4 h-4" />
                <span>{oneShotFileName}</span>
                <span className="text-emerald-600">• Ready</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1 bg-white border border-purple-200 text-purple-800 px-2.5 py-1 rounded-md"><Code className="w-3 h-3" /> Coding + Test Cases</span>
              <span className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-800 px-2.5 py-1 rounded-md"><CheckSquare className="w-3 h-3" /> MCQ / MSQ</span>
              <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md"><Layers className="w-3 h-3" /> Fill / Scenario</span>
            </div>

            <p className="text-xs text-slate-500 pt-1">Supports: <code className="font-mono bg-white px-1 py-0.5 rounded border">questions[]</code>, <code className="font-mono bg-white px-1 py-0.5 rounded border">options/choices</code>, <code className="font-mono bg-white px-1 py-0.5 rounded border">codeTemplate/testCases</code>, <code className="font-mono bg-white px-1 py-0.5 rounded border">language</code> — auto-classified.</p>
          </div>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> JSON is validated via <code className="font-mono bg-white px-1 rounded border">/api/parse-assessment-json</code> with client fallback — never loses questions.</span>
          <span className="font-mono text-slate-500">One-shot: Upload → Parse → Create → Redirect to Assessments</span>
        </div>
      </div>

      {/* Amber Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-semibold">⚠ {validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Assessment Details (White Card) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Assessment Details</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Basic test configuration, rules, security, and passing criteria
          </p>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Python Basics — Week 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief overview of the assessment syllabus and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 resize-y"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Instructions (shown before exam)
            </label>
            <textarea
              rows={3}
              placeholder="Instructions presented to candidates before starting the timer..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 resize-y"
            />
          </div>

          {/* Numeric row: Duration, Passing Score, Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Duration (minutes) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Programming">Programming</option>
                <option value="Database">Database</option>
                <option value="Cloud">Cloud</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Aptitude">Aptitude</option>
              </select>
            </div>
          </div>

          {/* Assessment Kind */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Assessment Kind <span className="text-rose-500">*</span>
            </label>
            <select
              value={assessmentKind}
              onChange={(e) => setAssessmentKind(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="Standard — mixed MCQ / MSQ / Fill-in / Scenario">
                Standard — mixed MCQ / MSQ / Fill-in / Scenario
              </option>
              <option value="Coding Challenge with Automated Test Cases">
                Coding Challenge with Automated Test Cases
              </option>
              <option value="Aptitude & Logical Reasoning">
                Aptitude & Logical Reasoning
              </option>
            </select>
            <p className="text-xs text-slate-500 mt-1 italic">
              Coding lives in its own one-shot endpoint because it sets up a separate problem record with test cases.
            </p>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <Switch
                checked={publishImmediately}
                onChange={setPublishImmediately}
                label="Publish immediately"
                description="Make the assessment live right after creation"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <Switch
                checked={requireSafeExamBrowser}
                onChange={setRequireSafeExamBrowser}
                label="Require Safe Exam Browser"
                description="Locks candidate workstation down during evaluation"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Questions Section */}
      <div className="space-y-4">
        {/* Toolbar row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Questions ({questions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Configure question stems, markdown formatting, marks, and options
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Hidden file input for direct toolbar upload */}
            <input
              type="file"
              ref={toolbarFileInputRef}
              onChange={handleToolbarFileSelect}
              accept=".json,application/json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => toolbarFileInputRef.current?.click()}
              className="border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Upload a .json assessment configuration file directly"
            >
              <FileUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload .json file</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Template</span>
            </button>

            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Paste JSON</span>
            </button>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="border border-slate-200 bg-white text-slate-700 px-3.5 py-1.5 rounded-lg hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Add Question</span>
            </button>
          </div>
        </div>

        {/* Backend Import & Auto-Classification Summary Banner */}
        {importStats && (
          <div className="p-4 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Backend JSON Parser & Auto-Classification
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Auto-Configured
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Parsed assessment details and accurately identified question types for both Coding and MCQ/MSQ modules.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-white border border-purple-200 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow-2xs">
                    <Code className="w-3.5 h-3.5 text-purple-600" />
                    <span>Coding Problems: <strong>{importStats.codingCount}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow-2xs">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>MCQ Questions: <strong>{importStats.mcqCount}</strong></span>
                  </span>
                  {importStats.msqCount > 0 && (
                    <span className="inline-flex items-center gap-1 bg-white border border-indigo-200 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow-2xs">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>MSQ Questions: <strong>{importStats.msqCount}</strong></span>
                    </span>
                  )}
                  {(importStats.fillBlankCount > 0 || importStats.shortAnswerCount > 0) && (
                    <span className="inline-flex items-center gap-1 bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow-2xs">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Written: <strong>{importStats.fillBlankCount + importStats.shortAnswerCount}</strong></span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                    <span>Total Marks: <strong>{importStats.totalMarks}</strong></span>
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setImportStats(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-medium self-end md:self-center px-2 py-1 hover:bg-white/60 rounded-md transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Per Question Block (Accordion Cards) */}
        <div className="space-y-4">
          {questions.map((question, qIndex) => {
            const isExpanded = expandedQuestions[question.id] ?? true;

            return (
              <div
                key={question.id ? `question-${question.id}` : `question-idx-${qIndex}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Question Header */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleQuestionExpand(question.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <span className="font-bold text-slate-900 text-sm">
                      Question {qIndex + 1}
                    </span>

                    {/* Question Type dropdown */}
                    <select
                      value={question.type}
                      onChange={(e) =>
                        handleTypeChange(question.id, e.target.value as QuestionType)
                      }
                      className="border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="MCQ">MCQ — Single Choice</option>
                      <option value="MSQ">MSQ — Multiple Select</option>
                      <option value="CODING">Coding Challenge</option>
                      <option value="FILL_BLANK">Fill-in-the-blank</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="SCENARIO">Scenario / Case Study</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSinglePreviewQuestion(question);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Fields Body */}
                {isExpanded && (
                  <div className="p-5 space-y-5">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Question title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          question.type === 'CODING'
                            ? 'e.g. Implement Two-Sum with Hash Map'
                            : 'e.g. Python List Comprehensions & Immutability'
                        }
                        value={question.title}
                        onChange={(e) =>
                          updateQuestion(question.id, { title: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Metadata row: Difficulty, Marks, Negative Marks */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Difficulty
                        </label>
                        <select
                          value={question.difficulty}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              difficulty: e.target.value as QuestionDifficulty,
                            })
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="EASY">EASY</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HARD">HARD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Marks
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={question.marks}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              marks: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Negative Marks
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.25"
                          value={question.negativeMarks}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              negativeMarks: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Reasoning Toggle & Minimum Words Config */}
                    <div className="pt-1 space-y-2">
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <Switch
                          checked={question.requireReasoning}
                          onChange={(val) =>
                            updateQuestion(question.id, {
                              requireReasoning: val,
                              minReasoningWords: question.minReasoningWords || 10,
                            })
                          }
                          label="Require candidate to explain their reasoning"
                          description="Candidate must provide a written justification before finalizing choice"
                        />
                        {question.requireReasoning && (
                          <div className="flex items-center gap-2 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                              Min Words:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={question.minReasoningWords ?? 10}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  minReasoningWords: Math.max(1, parseInt(e.target.value, 10) || 10),
                                })
                              }
                              className="w-16 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono font-bold text-slate-800 text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Stem (Markdown) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        {question.type === 'CODING' ? 'Problem Statement & Specification (Markdown)' : 'Question stem (markdown)'}
                      </label>
                      <MarkdownEditor
                        value={question.stemMarkdown}
                        onChange={(val) => updateQuestion(question.id, { stemMarkdown: val })}
                        placeholder="Use **bold**, _italic_, `inline code`, code blocks, lists, tables..."
                      />
                    </div>

                    {/* 1. CODING QUESTION CONFIGURATION */}
                    {question.type === 'CODING' && (
                      <CodingQuestionEditor
                        question={question}
                        updateQuestion={updateQuestion}
                        onAddTestCase={handleAddTestCase}
                        onUpdateTestCase={handleUpdateTestCase}
                        onDeleteTestCase={handleDeleteTestCase}
                      />
                    )}

                    {/* 2. FILL-IN-THE-BLANK CONFIGURATION */}
                    {question.type === 'FILL_BLANK' && (
                      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                        <label className="block text-xs font-bold text-emerald-950">
                          Fill-in-the-Blank Expected Answer
                        </label>
                        <input
                          type="text"
                          value={question.expectedAnswer || ''}
                          onChange={(e) => updateQuestion(question.id, { expectedAnswer: e.target.value })}
                          placeholder="Primary expected string..."
                          className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                        />
                      </div>
                    )}

                    {/* 3. SHORT ANSWER / SCENARIO CONFIGURATION */}
                    {(question.type === 'SHORT_ANSWER' || question.type === 'SCENARIO') && (
                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                        <label className="block text-xs font-bold text-blue-950">
                          Model Answer & Evaluation Rubric
                        </label>
                        <textarea
                          rows={3}
                          value={question.expectedAnswer || ''}
                          onChange={(e) => updateQuestion(question.id, { expectedAnswer: e.target.value })}
                          placeholder="Model answer for grading reference..."
                          className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:outline-none"
                        />
                      </div>
                    )}

                    {/* 4. Options (for MCQ / MSQ) */}
                    {(question.type === 'MCQ' || question.type === 'MSQ') && (
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">
                            Options ({question.options.length}) — Click {question.type === 'MSQ' ? 'checkbox' : 'radio'} to select correct answer(s)
                          </label>
                        </div>

                        <div className="space-y-3">
                          {(question.options || []).map((option, optIdx) => (
                            <div
                              key={option.id ? `opt-${question.id}-${option.id}` : `opt-${question.id}-${optIdx}`}
                              className={`p-3 rounded-xl border transition-all ${
                                option.isCorrect
                                  ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Correct answer selector */}
                                <div className="pt-2">
                                  <input
                                    type={question.type === 'MSQ' ? 'checkbox' : 'radio'}
                                    name={`correct-${question.id}`}
                                    checked={option.isCorrect}
                                    onChange={() =>
                                      handleSetCorrectOption(
                                        question.id,
                                        option.id,
                                        question.type === 'MSQ'
                                      )
                                    }
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    title="Mark as correct answer"
                                  />
                                </div>

                                {/* Option Markdown Editor */}
                                <div className="flex-1">
                                  <MarkdownEditor
                                    value={option.text}
                                    onChange={(val) =>
                                      handleOptionTextChange(question.id, option.id, val)
                                    }
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    minHeight="min-h-[60px]"
                                    compact
                                  />
                                </div>

                                {/* Delete Option Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(question.id, option.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                                  title="Delete Option"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Option Link */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddOption(question.id)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add option</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* + Add Another Question (Centered Dashed Border Button) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 rounded-xl text-slate-600 hover:text-blue-600 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>+ Add Another Question</span>
          </button>
        </div>
      </div>

      {/* Page Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={() => navigateTo('/assessments')}
          className="border border-slate-200 bg-white text-slate-700 px-5 py-2.5 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => handleSubmit()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span>Create Assessment</span>
        </button>
      </div>

      {/* Modal: Full Student Assessment LIVE Preview — pixel-faithful to StudentExamPage */}
      <Modal
        isOpen={fullPreviewOpen}
        onClose={() => setFullPreviewOpen(false)}
        title={title || 'Assessment Preview'}
        subtitle={`Exactly as student will see • Preview mode • ${duration} min • ${questions.length} questions`}
        maxWidth="5xl"
      >
        {(() => {
          const q = questions[previewActiveIndex];
          if (!q) return null;
          const isAnswered = (qid: string) => {
            if (q.type === 'CODING') return false; // coding preview not counted as answered in this modal
            if (q.type === 'FILL_BLANK' || q.type === 'SHORT_ANSWER' || q.type === 'SCENARIO') return Boolean(previewTextAnswers[q.id]?.trim());
            return Boolean(candidateSelectedOptions[q.id]);
          };
          const answeredCount = questions.filter((qq) => {
            if (qq.type === 'FILL_BLANK' || qq.type === 'SHORT_ANSWER' || qq.type === 'SCENARIO') return Boolean(previewTextAnswers[qq.id]?.trim());
            return Boolean(candidateSelectedOptions[qq.id]);
          }).length;
          const reviewCount = Object.values(previewMarkedForReview).filter(Boolean).length;
          const unansweredCount = questions.length - answeredCount;
          const activeTemplate = q.codeTemplates?.[previewCodingLang] ?? (previewCodingLang === (q.language || 'python').toLowerCase() ? q.codeTemplate || '' : '');
          const isIdle = q.type === 'CODING' && (!activeTemplate || !activeTemplate.trim());
          return (
            <div className="-mx-6 -mb-6">
              {/* Top Exam Mode Bar — identical to StudentExamPage */}
              <div className="sticky top-0 z-10 bg-white border-y border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 -mt-6">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">Exam Mode</span>
                  <h1 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs sm:max-w-md">{title || 'Assessment Preview'}</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Shield className="w-3 h-3" /> Secure
                  </span>
                  <span className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border">Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreviewShowCalc((v) => !v)} className="hidden sm:flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs">
                    <Calculator className="w-3.5 h-3.5" /> Calc
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-800">
                    <Clock className="w-3.5 h-3.5" /> {duration}:00
                  </div>
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 opacity-60 cursor-not-allowed" title="Preview — submit disabled">
                    <Send className="w-3 h-3" /> Submit
                  </span>
                </div>
              </div>

              {/* Main grid — 8 cols question + 4 cols palette — EXACT StudentExamPage layout */}
              <div className="p-4 sm:p-6 bg-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Question Card */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-[460px]">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-sm">Question {previewActiveIndex + 1} of {questions.length}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Marks: +{q.marks} / -{q.negativeMarks}</span>
                      <span className="hidden sm:inline-flex text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{q.difficulty}</span>
                    </div>
                    <button
                      onClick={() => setPreviewMarkedForReview((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${previewMarkedForReview[q.id] ? 'bg-amber-100 text-amber-800 border-amber-300' : 'text-slate-600 hover:bg-slate-100 border-slate-200'}`}
                    >
                      <Flag className={`w-3.5 h-3.5 ${previewMarkedForReview[q.id] ? 'fill-amber-600 text-amber-600' : ''}`} />
                      <span className="hidden sm:inline">{previewMarkedForReview[q.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                      <span className="sm:hidden">Review</span>
                    </button>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5 flex-1">
                    <div className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200">
                      <StructuredQuestionView question={q} showSampleTestCases={true} />
                      <h3 className="text-sm font-bold text-slate-900 mt-3">{q.title}</h3>
                    </div>

                    {q.type === 'CODING' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-700">Language:</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {CODING_LANGUAGES.map((lang) => {
                              const hasT = Boolean((q.codeTemplates?.[lang.id] || (lang.id === (q.language || 'python').toLowerCase() ? q.codeTemplate : ''))?.trim());
                              return (
                                <button
                                  key={lang.id}
                                  onClick={() => setPreviewCodingLang(lang.id)}
                                  className={`text-xs px-2.5 py-1 rounded-md border font-medium ${previewCodingLang === lang.id ? 'bg-blue-600 text-white border-blue-600' : hasT ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}`}
                                >
                                  {lang.label.split(' ')[0]} {hasT ? '●' : '○'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {isIdle && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span><strong>{(CODING_LANGUAGES.find(l=>l.id===previewCodingLang)?.label) || previewCodingLang} (Idle)</strong>: No starter boilerplate — box is blank.</span>
                          </div>
                        )}
                        <div className="border border-slate-200 rounded-xl overflow-hidden flex min-h-[160px] bg-slate-900">
                          <div className="w-10 py-3 bg-slate-800 text-slate-500 font-mono text-xs text-right pr-2 select-none border-r border-slate-700 shrink-0">
                            {Array.from({ length: Math.max(8, (activeTemplate || '').split('\n').length) }, (_, i) => (
                              <div key={i + 1} className="h-5 leading-5">{i + 1}</div>
                            ))}
                          </div>
                          <pre className="font-mono text-xs text-emerald-300 overflow-x-auto p-3 flex-1 leading-5 whitespace-pre-wrap">
                            {activeTemplate || `# No starter code for ${(CODING_LANGUAGES.find(l=>l.id===previewCodingLang)?.label) || previewCodingLang} — paste from LLM`}
                          </pre>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-700">Test Cases Console</span>
                          <span className="text-slate-500">{q.testCases?.length || 0} automated suites</span>
                        </div>
                      </div>
                    )}

                    {/* 1. FILL_BLANK: Filled in the blank with green bounding box */}
                    {q.type === 'FILL_BLANK' && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              Answer Input (Pre-filled Solution):
                            </label>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Correct Answer Filled
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              value={q.expectedAnswer || (q as any).acceptableAnswers?.[0] || 'Correct answer'}
                              className="w-full border-2 border-emerald-500 rounded-xl px-4 py-3 text-sm font-mono font-bold bg-emerald-50/80 text-emerald-950 shadow-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        {q.acceptableAnswers && q.acceptableAnswers.length > 0 && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-slate-700">Acceptable Alternatives:</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {q.acceptableAnswers.map((ans, aIdx) => (
                                <span key={aIdx} className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                                  {ans}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. SHORT_ANSWER / SCENARIO / REASONING: Proper Reason surrounded in a dedicated box */}
                    {(q.type === 'SHORT_ANSWER' || q.type === 'SCENARIO') && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-500 shadow-2xs space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Proper Reason & Model Solution</span>
                          </div>
                          <div className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium bg-white/90 p-3 rounded-lg border border-emerald-200">
                            <MarkdownView
                              content={
                                q.expectedAnswer ||
                                q.evaluationRubric ||
                                (q as any).reasoning ||
                                (q as any).explanation ||
                                'Detailed explanation and evaluation rubric provided in blueprint.'
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. MCQ / MSQ: Correct Answer in Green Bounding Box */}
                    {(q.type === 'MCQ' || q.type === 'MSQ') && (
                      <div className="space-y-3">
                        {(q.options || []).map((opt, optIdx) => {
                          const isCorrect = Boolean(opt.isCorrect);
                          const isSelected = candidateSelectedOptions[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                if (q.type === 'MSQ') {
                                  setCandidateSelectedOptions((prev) => {
                                    const cur = prev[q.id];
                                    return { ...prev, [q.id]: cur === opt.id ? '' : opt.id };
                                  });
                                } else {
                                  setCandidateSelectedOptions((prev) => ({ ...prev, [q.id]: opt.id }));
                                }
                              }}
                              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-50/85 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                                  : isSelected
                                  ? 'bg-blue-50 border-blue-400 text-blue-900'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border text-xs font-bold ${
                                  isCorrect
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-300 text-slate-500'
                                }`}
                              >
                                {isCorrect ? <Check className="w-3 h-3 text-white" /> : String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="flex-1 leading-snug prose prose-sm max-w-none text-left">
                                <ReactMarkdown>{opt.text}</ReactMarkdown>
                              </span>
                              {isCorrect && (
                                <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Correct Answer
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {/* If question requires reasoning, show dotted rounded rectangle box containing inner text box and proper reason */}
                        {q.requireReasoning && (() => {
                          const wordCount = (previewTextAnswers[q.id] || '').trim().split(/\s+/).filter(Boolean).length;
                          const minWords = q.minReasoningWords ?? 10;
                          const isMet = wordCount >= minWords;

                          return (
                            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 space-y-3">
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

                              {/* Inner Rounded Rectangle Box for Typing Reason */}
                              <div
                                className={`rounded-xl border bg-white p-3.5 shadow-2xs transition-colors ${
                                  isMet ? 'border-emerald-300' : wordCount > 0 ? 'border-amber-300' : 'border-slate-200'
                                }`}
                              >
                                <textarea
                                  rows={3}
                                  value={previewTextAnswers[q.id] || ''}
                                  onChange={(e) => setPreviewTextAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  placeholder={`Candidate types their detailed reasoning or calculation here (minimum ${minWords} words)...`}
                                  className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none resize-y leading-relaxed font-sans"
                                />
                              </div>

                              {/* Proper Reason Model Box */}
                              <div className="p-3.5 rounded-xl bg-emerald-50/90 border-2 border-emerald-500 shadow-2xs space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Proper Reason / Model Rubric</span>
                                </div>
                                <div className="text-xs text-emerald-950 leading-relaxed font-medium bg-white/90 p-2.5 rounded-lg border border-emerald-200">
                                  <MarkdownView
                                    content={
                                      q.evaluationRubric ||
                                      q.expectedAnswer ||
                                      (q as any).reasoning ||
                                      (q as any).explanation ||
                                      'Full marks awarded when candidate explanation matches model reasoning and key principles.'
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCandidateSelectedOptions((prev) => {
                          const c = { ...prev };
                          delete c[q.id];
                          return c;
                        });
                        setPreviewTextAnswers((prev) => {
                          const c = { ...prev };
                          delete c[q.id];
                          return c;
                        });
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear Response
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={previewActiveIndex === 0}
                        onClick={() => setPreviewActiveIndex((p) => Math.max(0, p - 1))}
                        className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
                      >
                        Previous
                      </button>
                      <button
                        disabled={previewActiveIndex === questions.length - 1}
                        onClick={() => setPreviewActiveIndex((p) => Math.min(questions.length - 1, p + 1))}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Palette — identical to StudentExamPage */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 text-sm mb-3">Question Palette</h3>
                    <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-slate-600">Answered ({answeredCount})</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-slate-600">Review ({reviewCount})</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300" /><span className="text-slate-600">Left ({unansweredCount})</span></div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {questions.map((qq, idx) => {
                        const isAns = Boolean(candidateSelectedOptions[qq.id] || previewTextAnswers[qq.id]?.trim());
                        const isRev = Boolean(previewMarkedForReview[qq.id]);
                        const isCur = previewActiveIndex === idx;
                        let cls = 'bg-slate-100 text-slate-700 border-slate-200';
                        if (isRev) cls = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                        else if (isAns) cls = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                        return (
                          <button
                            key={qq.id}
                            onClick={() => setPreviewActiveIndex(idx)}
                            className={`h-10 rounded-lg border text-xs font-semibold flex items-center justify-center relative ${cls} ${isCur ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
                          >
                            <span>{idx + 1}</span>
                            {isRev && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-2">
                    <p className="font-bold text-slate-800">Exam Instructions</p>
                    <p className="text-slate-500 leading-relaxed">Auto-save is active. Your responses are stored instantly as you select choices. This is a preview — exactly how the candidate will see the exam.</p>
                    <div className="flex items-center gap-1 text-emerald-600 font-medium pt-1"><CheckCircle2 className="w-3.5 h-3.5" /> Preview mode — submit disabled</div>
                  </div>
                </div>
              </div>

              {/* Footer inside preview — mirrors student footer */}
              <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">Previewing as <strong className="text-slate-700">Candidate</strong> • {questions.length} questions</span>
                <button onClick={() => setFullPreviewOpen(false)} className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">Close Preview</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal: Single Question Quick Preview — EXACT student view for that one question */}
      <Modal
        isOpen={!!singlePreviewQuestion}
        onClose={() => setSinglePreviewQuestion(null)}
        title={singlePreviewQuestion?.title || 'Question Preview'}
        subtitle={`Exactly as student will see • Preview • ${singlePreviewQuestion?.type || ''} • ${singlePreviewQuestion?.difficulty || ''} • ${singlePreviewQuestion?.marks || 1} marks`}
        maxWidth="3xl"
      >
        {singlePreviewQuestion &&
          (() => {
            const q = singlePreviewQuestion;
            const qIdx = questions.findIndex((qq) => qq.id === q.id);
            const displayIdx = qIdx >= 0 ? qIdx + 1 : 1;
            const total = questions.length;
            const isMarked = Boolean(previewMarkedForReview[q.id]);
            const selectedOptId = candidateSelectedOptions[q.id];
            const activeLang = previewCodingLang || (q.language || 'python').toLowerCase();
            const tpl = q.codeTemplates?.[activeLang] ?? (activeLang === (q.language || 'python').toLowerCase() ? q.codeTemplate || '' : '');
            const isIdle = q.type === 'CODING' && (!tpl || !tpl.trim());
            return (
              <div className="space-y-4 -mx-1">
                {/* Question card — identical to StudentExamPage left col */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Question {displayIdx} of {total}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Marks: +{q.marks} / -{q.negativeMarks}</span>
                      <span className="hidden sm:inline-flex text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{q.difficulty}</span>
                    </div>
                    <button
                      onClick={() => setPreviewMarkedForReview((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${isMarked ? 'bg-amber-100 text-amber-800 border-amber-300' : 'text-slate-600 hover:bg-slate-100 border-slate-200'}`}
                    >
                      <Flag className={`w-3 h-3 ${isMarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                      <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                      <StructuredQuestionView question={q} showSampleTestCases={true} />
                      <h4 className="text-sm font-bold text-slate-900 mt-3">{q.title}</h4>
                    </div>

                    {q.type === 'CODING' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {CODING_LANGUAGES.map((lang) => {
                            const hasT = Boolean((q.codeTemplates?.[lang.id] || (lang.id === (q.language || 'python').toLowerCase() ? q.codeTemplate : ''))?.trim());
                            return (
                              <button
                                key={lang.id}
                                onClick={() => setPreviewCodingLang(lang.id)}
                                className={`text-xs px-2.5 py-1 rounded-md border ${activeLang === lang.id ? 'bg-blue-600 text-white border-blue-600' : hasT ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}`}
                              >
                                {lang.label.split(' ')[0]} {hasT ? '●' : '○'}
                              </button>
                            );
                          })}
                        </div>
                        {isIdle && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>No starter code — blank for {activeLang}</span>
                          </div>
                        )}
                        <div className="border border-slate-200 rounded-xl overflow-hidden flex min-h-[140px] bg-slate-900">
                          <div className="w-10 py-3 bg-slate-800 text-slate-500 font-mono text-xs text-right pr-2 border-r border-slate-700">
                            {Array.from({ length: Math.max(8, (tpl || '').split('\n').length) }, (_, i) => (
                              <div key={i + 1} className="h-5 leading-5">{i + 1}</div>
                            ))}
                          </div>
                          <pre className="font-mono text-xs text-emerald-300 p-3 flex-1 leading-5 whitespace-pre-wrap">{tpl || '# Blank — student will type here'}</pre>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-700">Test Cases Console</span>
                          <span className="text-slate-500">{q.testCases?.length || 0} suites</span>
                        </div>
                      </div>
                    )}

                    {/* 1. FILL_BLANK: Filled in the blank with green bounding box */}
                    {q.type === 'FILL_BLANK' && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              Answer Input (Pre-filled Solution):
                            </label>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Correct Answer Filled
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              value={q.expectedAnswer || (q as any).acceptableAnswers?.[0] || 'Correct answer'}
                              className="w-full border-2 border-emerald-500 rounded-xl px-4 py-2.5 text-sm font-mono font-bold bg-emerald-50/80 text-emerald-950 shadow-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        {q.acceptableAnswers && q.acceptableAnswers.length > 0 && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-slate-700">Acceptable Alternatives:</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {q.acceptableAnswers.map((ans, aIdx) => (
                                <span key={aIdx} className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                                  {ans}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. SHORT_ANSWER / SCENARIO / REASONING: Proper Reason surrounded in a dedicated box */}
                    {(q.type === 'SHORT_ANSWER' || q.type === 'SCENARIO') && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-500 shadow-2xs space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Proper Reason & Model Solution</span>
                          </div>
                          <div className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium bg-white/90 p-3 rounded-lg border border-emerald-200">
                            <MarkdownView
                              content={
                                q.expectedAnswer ||
                                q.evaluationRubric ||
                                (q as any).reasoning ||
                                (q as any).explanation ||
                                'Detailed explanation and evaluation rubric provided in blueprint.'
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. MCQ / MSQ: Correct Answer in Green Bounding Box */}
                    {(q.type === 'MCQ' || q.type === 'MSQ') && (
                      <div className="space-y-3">
                        {(q.options || []).map((opt, optIdx) => {
                          const isCorrect = Boolean(opt.isCorrect);
                          const isSelected = selectedOptId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setCandidateSelectedOptions((prev) => ({ ...prev, [q.id]: opt.id }))}
                              className={`w-full text-left p-3.5 rounded-xl border-2 text-sm font-medium flex items-start gap-3 transition-all cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-50/85 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                                  : isSelected
                                  ? 'bg-blue-50 border-blue-400 text-blue-900'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center shrink-0 border text-xs font-bold ${
                                  isCorrect
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-slate-300 text-slate-500'
                                }`}
                              >
                                {isCorrect ? <Check className="w-3 h-3 text-white" /> : String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="flex-1 leading-snug prose prose-sm max-w-none text-left">
                                <ReactMarkdown>{opt.text}</ReactMarkdown>
                              </span>
                              {isCorrect && (
                                <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Correct Answer
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {/* If question requires reasoning, show dotted rounded rectangle box containing inner text box and proper reason */}
                        {q.requireReasoning && (() => {
                          const wordCount = (previewTextAnswers[q.id] || '').trim().split(/\s+/).filter(Boolean).length;
                          const minWords = q.minReasoningWords ?? 10;
                          const isMet = wordCount >= minWords;

                          return (
                            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 space-y-3">
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

                              {/* Inner Rounded Rectangle Box for Typing Reason */}
                              <div
                                className={`rounded-xl border bg-white p-3.5 shadow-2xs transition-colors ${
                                  isMet ? 'border-emerald-300' : wordCount > 0 ? 'border-amber-300' : 'border-slate-200'
                                }`}
                              >
                                <textarea
                                  rows={3}
                                  value={previewTextAnswers[q.id] || ''}
                                  onChange={(e) => setPreviewTextAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  placeholder={`Candidate types their detailed reasoning or calculation here (minimum ${minWords} words)...`}
                                  className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none resize-y leading-relaxed font-sans"
                                />
                              </div>

                              {/* Proper Reason Model Box */}
                              <div className="p-3.5 rounded-xl bg-emerald-50/90 border-2 border-emerald-500 shadow-2xs space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Proper Reason / Model Rubric</span>
                                </div>
                                <div className="text-xs text-emerald-950 leading-relaxed font-medium bg-white/90 p-2.5 rounded-lg border border-emerald-200">
                                  <MarkdownView
                                    content={
                                      q.evaluationRubric ||
                                      q.expectedAnswer ||
                                      (q as any).reasoning ||
                                      (q as any).explanation ||
                                      'Full marks awarded when candidate explanation matches model reasoning and key principles.'
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCandidateSelectedOptions((prev) => {
                          const c = { ...prev };
                          delete c[q.id];
                          return c;
                        });
                        setPreviewTextAnswers((prev) => {
                          const c = { ...prev };
                          delete c[q.id];
                          return c;
                        });
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear Response
                    </button>
                    <span className="text-xs text-slate-400">Preview • Submit disabled</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setSinglePreviewQuestion(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    Close Preview
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Modal: Import JSON */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setUploadedFileName(null);
        }}
        title="Import Assessment JSON"
        subtitle="Upload a .json file or paste your question schema in JSON format."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Hidden File Input for Modal */}
          <input
            type="file"
            ref={modalFileInputRef}
            onChange={handleModalFileSelect}
            accept=".json,application/json"
            className="hidden"
          />

          {/* Drag & Drop / File Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleModalDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-300'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Drag and drop your <span className="text-blue-600 font-bold">.json</span> file here
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports JSON assessment configs with questions, options, and test cases
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose .json File</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sample Schema</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active File Loaded Banner */}
          {uploadedFileName && (
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{uploadedFileName}</span>
                <span className="text-emerald-700">loaded into editor below</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedFileName(null);
                  setJsonInput('');
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Direct JSON String Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">JSON Payload Data:</label>
              {jsonInput && (
                <button
                  type="button"
                  onClick={() => {
                    setJsonInput('');
                    setUploadedFileName(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Clear text
                </button>
              )}
            </div>
            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{\n  "title": "My Assessment",\n  "duration": 45,\n  "questions": [\n    {\n      "title": "Question 1",\n      "type": "MCQ",\n      "marks": 1,\n      "stemMarkdown": "Question prompt here...",\n      "options": [\n        { "text": "Option A", "isCorrect": true },\n        { "text": "Option B", "isCorrect": false }\n      ]\n    }\n  ]\n}`}
              className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-900 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setImportModalOpen(false);
                setUploadedFileName(null);
              }}
              className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isImporting}
              onClick={handleImportJSON}
              className="bg-blue-600 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing via Backend...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Parse and Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
