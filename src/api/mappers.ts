import {
  BackendAssessment,
  BackendQuestion,
  BackendTestCase,
  BackendQuestionOption,
  BackendStudentResponse,
  AssessmentSummaryMetrics,
} from '../types/backend';
import {
  Assessment,
  Question,
  TestCase,
  QuestionOption,
  ExamAnswer,
  StudentReportItem,
} from '../types';

/**
 * Maps frontend Question model to backend Go snake_case Question struct
 */
export function mapQuestionToBackend(q: Question): BackendQuestion {
  return {
    id: q.id,
    title: q.title || 'Untitled Question',
    type: q.type,
    difficulty: q.difficulty,
    marks: q.marks ?? 1,
    negative_marks: q.negativeMarks ?? 0,
    require_reasoning: Boolean(q.requireReasoning),
    stem_markdown: q.stemMarkdown || '',
    options: (q.options || []).map(
      (opt): BackendQuestionOption => ({
        id: opt.id,
        text: opt.text,
        is_correct: Boolean(opt.isCorrect),
      })
    ),
    language: q.language,
    code_template: q.codeTemplate,
    code_templates: q.codeTemplates,
    solution_code: q.solutionCode,
    test_cases: (q.testCases || []).map(
      (tc): BackendTestCase => ({
        id: tc.id,
        input: tc.input,
        expected_output: tc.expectedOutput,
        is_hidden: Boolean(tc.isHidden),
        weight: tc.marks,
        explanation: tc.explanation,
      })
    ),
    time_limit_ms: (q.timeLimitSec || 2) * 1000,
    memory_limit_kb: (q.memoryLimitMb || 256) * 1024,
    expected_answer: q.expectedAnswer,
    acceptable_answers: q.acceptableAnswers,
    is_case_sensitive: q.isCaseSensitive,
    rubric: q.evaluationRubric,
  };
}

/**
 * Maps backend Go Question struct to frontend Question model
 */
export function mapBackendToQuestion(bq: BackendQuestion): Question {
  return {
    id: bq.id,
    title: bq.title,
    type: bq.type,
    difficulty: bq.difficulty,
    marks: bq.marks,
    negativeMarks: bq.negative_marks,
    requireReasoning: bq.require_reasoning,
    stemMarkdown: bq.stem_markdown,
    options: (bq.options || []).map(
      (opt): QuestionOption => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.is_correct,
      })
    ),
    language: bq.language,
    codeTemplate: bq.code_template,
    codeTemplates: bq.code_templates,
    solutionCode: bq.solution_code,
    testCases: (bq.test_cases || []).map(
      (tc, idx): TestCase => ({
        id: tc.id || `tc-${idx}`,
        input: tc.input,
        expectedOutput: tc.expected_output,
        isHidden: tc.is_hidden,
        marks: tc.weight,
        explanation: tc.explanation,
      })
    ),
    timeLimitSec: bq.time_limit_ms ? Math.round(bq.time_limit_ms / 1000) : 2,
    memoryLimitMb: bq.memory_limit_kb ? Math.round(bq.memory_limit_kb / 1024) : 256,
    expectedAnswer: bq.expected_answer,
    acceptableAnswers: bq.acceptable_answers,
    isCaseSensitive: bq.is_case_sensitive,
    evaluationRubric: bq.rubric,
  };
}

/**
 * Maps frontend Assessment model to backend Go Assessment payload
 */
export function mapAssessmentToBackend(a: Assessment): Partial<BackendAssessment> {
  const questions = a.questions || [];
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    instructions: a.instructions,
    duration_minutes: a.duration,
    passing_score: a.passingScore,
    category: a.category,
    status: a.status.toLowerCase() as 'draft' | 'published' | 'archived',
    is_published: a.status === 'Published',
    require_seb: Boolean(a.requireSafeExamBrowser),
    sections: [
      {
        id: 'sec-main',
        title: 'Core Evaluation',
        order_index: 0,
        questions: questions.map(mapQuestionToBackend),
      },
    ],
  };
}

/**
 * Maps backend Go Assessment struct to frontend Assessment model
 */
export function mapBackendToAssessment(ba: BackendAssessment): Assessment {
  const extractedQuestions: Question[] = [];
  if (ba.sections && ba.sections.length > 0) {
    ba.sections.forEach((sec) => {
      if (sec.questions) {
        sec.questions.forEach((q) => {
          extractedQuestions.push(mapBackendToQuestion(q));
        });
      }
    });
  }

  return {
    id: ba.id,
    title: ba.title,
    description: ba.description,
    instructions: ba.instructions,
    duration: ba.duration_minutes,
    passingScore: ba.passing_score,
    kind: 'Technical Assessment',
    publishImmediately: ba.is_published,
    requireSafeExamBrowser: ba.require_seb,
    category: ba.category || 'General Engineering',
    status: ba.is_published ? 'Published' : ba.status === 'archived' ? 'Archived' : 'Draft',
    questionsCount: ba.questions_count ?? extractedQuestions.length,
    createdAt: ba.created_at || new Date().toISOString(),
    updatedAt: ba.updated_at,
    questions: extractedQuestions,
  };
}

/**
 * Maps student exam response to backend Save Answer payload
 */
export function mapStudentResponseToBackend(
  sessionId: string,
  questionId: string,
  ans: Partial<ExamAnswer>
): BackendStudentResponse {
  return {
    session_id: sessionId,
    question_id: questionId,
    selected_option_ids: ans.selectedOptionIds,
    text_response: ans.textAnswer,
    code_response: ans.codeAnswer,
    is_marked_for_review: ans.isMarkedForReview,
    time_spent_seconds: ans.timeSpentSeconds,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Caps terminal output text to maximum 16KB (16384 bytes) to protect client memory
 */
export function capTerminalOutput(output: string, maxBytes: number = 16384): string {
  if (!output) return '';
  if (output.length <= maxBytes) return output;
  return (
    output.substring(0, maxBytes) +
    `\n\n[Warning: Terminal stdout truncated at 16KB to preserve browser performance]`
  );
}
