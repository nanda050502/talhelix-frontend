import React, { useState } from 'react';
import { Question, QuestionExample, TestCase } from '../../types';
import { MarkdownView } from './MarkdownView';
import { Copy, Check } from 'lucide-react';

interface StructuredQuestionViewProps {
  question: Partial<Question> & {
    stemMarkdown?: string;
    description?: string;
    input_format?: string;
    inputFormat?: string;
    output_format?: string;
    outputFormat?: string;
    constraints?: string[] | string;
    examples?: Array<{
      input?: string;
      output?: string;
      expected_output?: string;
      explanation?: string;
    }>;
    test_cases?: any[];
    testCases?: TestCase[];
  };
  showSampleTestCases?: boolean;
  className?: string;
}

export const StructuredQuestionView: React.FC<StructuredQuestionViewProps> = ({
  question,
  showSampleTestCases = true,
  className = '',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Extract Description
  const rawDescription =
    question.description ||
    (question as any).prompt ||
    (question as any).question ||
    (question as any).questionText ||
    (question as any).question_text ||
    (question as any).content?.question_text ||
    question.stemMarkdown ||
    '';

  // 2. Extract Input Format
  const rawInputFormat =
    question.inputFormat ||
    (question as any).input_format ||
    (question as any).input ||
    '';

  // 3. Extract Output Format
  const rawOutputFormat =
    question.outputFormat ||
    (question as any).output_format ||
    (question as any).output ||
    '';

  // 4. Extract Constraints
  let constraintsList: string[] = [];
  const rawConstraints: any = question.constraints;
  if (Array.isArray(rawConstraints)) {
    constraintsList = rawConstraints.map(String).filter(Boolean);
  } else if (typeof rawConstraints === 'string' && rawConstraints.trim()) {
    constraintsList = rawConstraints
      .split('\n')
      .map((s: string) => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  }

  // 5. Extract Examples
  const rawExamples: QuestionExample[] = (
    question.examples ||
    (question as any).sample_cases ||
    []
  ).map((ex: any, idx: number) => ({
    id: ex.id || `ex-${idx + 1}`,
    input: ex.input ?? '',
    output: ex.output ?? ex.expected_output ?? '',
    explanation: ex.explanation ?? '',
  }));

  // 6. Extract Sample/Visible Testcases
  const allTestCases: any[] = question.testCases || (question as any).test_cases || [];
  const sampleTestCases = allTestCases.filter((tc: any, idx: number) => {
    if (tc.is_sample === true || tc.isSample === true) return true;
    if (tc.is_sample === false || tc.isSample === false) return false;
    if (tc.isHidden === false) return true;
    if (tc.isHidden === true || tc.is_hidden === true || tc.hidden === true) return false;
    // By default first 2 are samples if not marked hidden
    return idx < 2;
  });

  return (
    <div className={`space-y-6 text-slate-800 font-sans ${className}`}>
      {/* 1. Problem Description */}
      <div className="space-y-2">
        <MarkdownView content={rawDescription || '_No description provided._'} />
      </div>

      {/* 2. Input Format (Dedicated Field Box) */}
      {rawInputFormat && (
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Input Format
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-[13px] text-slate-700 leading-relaxed shadow-2xs">
            <MarkdownView content={rawInputFormat} />
          </div>
        </div>
      )}

      {/* 3. Output Format (Dedicated Field Box) */}
      {rawOutputFormat && (
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Output Format
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-[13px] text-slate-700 leading-relaxed shadow-2xs">
            <MarkdownView content={rawOutputFormat} />
          </div>
        </div>
      )}

      {/* 4. Constraints (Dedicated Field Box) */}
      {constraintsList.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Constraints
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/80 shadow-2xs">
            <ul className="space-y-1.5">
              {constraintsList.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-mono text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className="font-semibold bg-white/80 px-2 py-0.5 rounded border border-amber-200/60 shadow-2xs">
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 5. Examples (Bounded Rounded Edge Boxes) */}
      {rawExamples.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Examples
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {rawExamples.length} {rawExamples.length === 1 ? 'Example' : 'Examples'}
            </span>
          </div>

          <div className="space-y-3.5">
            {rawExamples.map((ex, idx) => {
              const copyInKey = `ex-in-${idx}`;
              const copyOutKey = `ex-out-${idx}`;

              return (
                <div
                  key={ex.id || idx}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all hover:border-slate-300"
                >
                  {/* Example Header — No dot before Example text */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Example {idx + 1}
                    </span>
                  </div>

                  {/* Example Content: Light Mode Input & Output Boxes */}
                  <div className="p-4 space-y-3">
                    {/* Input Box */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Input:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ex.input, copyInKey)}
                          className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy input"
                        >
                          {copiedKey === copyInKey ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-lg bg-slate-50 text-slate-900 p-3 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-200/90 shadow-2xs">
                        <pre className="whitespace-pre-wrap select-text">{ex.input || '(empty)'}</pre>
                      </div>
                    </div>

                    {/* Output Box */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Output:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ex.output, copyOutKey)}
                          className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy output"
                        >
                          {copiedKey === copyOutKey ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-lg bg-slate-50 text-slate-900 p-3 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-200/90 shadow-2xs">
                        <pre className="whitespace-pre-wrap select-text">{ex.output || '(empty)'}</pre>
                      </div>
                    </div>

                    {/* Explanation */}
                    {ex.explanation && (
                      <div className="pt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed flex items-start gap-2">
                        <span className="font-semibold text-slate-800 shrink-0">Explanation:</span>
                        <span className="italic">{ex.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Visible Sample Testcases (Bounded Rounded Edge Boxes) */}
      {showSampleTestCases && sampleTestCases.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sample Test Cases
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              {sampleTestCases.length} Visible {sampleTestCases.length === 1 ? 'Case' : 'Cases'}
            </span>
          </div>

          <div className="space-y-3.5">
            {sampleTestCases.map((tc: any, idx: number) => {
              const copyInKey = `tc-in-${idx}`;
              const copyOutKey = `tc-out-${idx}`;
              const marks = typeof tc.marks === 'number' ? tc.marks : typeof tc.weight === 'number' ? tc.weight : 1;

              return (
                <div
                  key={tc.id || idx}
                  className="rounded-xl border border-blue-200/90 bg-white overflow-hidden shadow-2xs transition-all hover:border-blue-300"
                >
                  {/* Test Case Header — Clean text without icon */}
                  <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-200/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950">
                      Sample Testcase {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs font-mono">
                        Weight: {marks} pt{marks > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Test Case Light Mode Content */}
                  <div className="p-4 space-y-3 bg-white">
                    {/* Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Input:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tc.input, copyInKey)}
                          className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy input"
                        >
                          {copiedKey === copyInKey ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-lg bg-slate-50 text-slate-900 p-3 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-200/90 shadow-2xs">
                        <pre className="whitespace-pre-wrap select-text">{tc.input || '(empty)'}</pre>
                      </div>
                    </div>

                    {/* Expected Output */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Expected Output:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(tc.expectedOutput || tc.expected_output || tc.output, copyOutKey)}
                          className="text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy expected output"
                        >
                          {copiedKey === copyOutKey ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-lg bg-slate-50 text-slate-900 p-3 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-200/90 shadow-2xs">
                        <pre className="whitespace-pre-wrap select-text">
                          {tc.expectedOutput || tc.expected_output || tc.output || '(empty)'}
                        </pre>
                      </div>
                    </div>

                    {/* Explanation */}
                    {tc.explanation && (
                      <div className="pt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed flex items-start gap-2">
                        <span className="font-semibold text-slate-800 shrink-0">Explanation:</span>
                        <span>{tc.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
