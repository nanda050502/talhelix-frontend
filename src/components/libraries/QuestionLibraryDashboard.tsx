import React, { useMemo } from 'react';
import axios from 'axios';
import { create } from 'zustand';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  Code2,
  CheckSquare,
  BrainCircuit,
  FileEdit,
  Search,
  RotateCcw,
  AlertCircle,
  Loader2,
  HelpCircle,
  Hash,
  Award,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { MarkdownView } from '../common/MarkdownView';

// ==========================================
// 1. Strict TypeScript Domain Models
// ==========================================
export type QuestionType = 'MCQ' | 'MSQ' | 'FILL_BLANK' | 'CODING' | 'SCENARIO';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type SortOption = 'title-asc' | 'title-desc' | 'marks-desc' | 'marks-asc' | 'difficulty-asc' | 'difficulty-desc';

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  tags: string[];
  marks: number;
  content: {
    question_text: string;
    options?: string[];
  };
}

interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
  error?: string;
}

// ==========================================
// 2. Global State Store (Zustand v5)
// ==========================================
export interface LibraryStoreState {
  selectedType: QuestionType | null;
  selectedDifficulty: DifficultyLevel | null;
  sortBy: SortOption;
  searchQuery: string;
  setSelectedType: (type: QuestionType | null) => void;
  setSelectedDifficulty: (difficulty: DifficultyLevel | null) => void;
  setSortBy: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useLibraryStore = create<LibraryStoreState>((set) => ({
  selectedType: null,
  selectedDifficulty: null,
  sortBy: 'title-asc',
  searchQuery: '',

  setSelectedType: (type) => set({ selectedType: type }),
  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  resetFilters: () =>
    set({
      selectedType: null,
      selectedDifficulty: null,
      sortBy: 'title-asc',
      searchQuery: '',
    }),
}));

// Query Client instance with 3 retries and exponential backoff
const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// ==========================================
// 3. QuestionLibraryDashboard View Component
// ==========================================
export const QuestionLibraryDashboardContent: React.FC = () => {
  const {
    selectedType,
    selectedDifficulty,
    sortBy,
    searchQuery,
    setSelectedType,
    setSelectedDifficulty,
    setSortBy,
    setSearchQuery,
    resetFilters,
  } = useLibraryStore();

  const isFilterActive = useMemo(() => {
    return (
      selectedType !== null ||
      selectedDifficulty !== null ||
      sortBy !== 'title-asc' ||
      searchQuery.trim() !== ''
    );
  }, [selectedType, selectedDifficulty, sortBy, searchQuery]);

  // TanStack Query fetching from GET /api/questions with dynamic query params
  const {
    data: questions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Question[]>({
    queryKey: ['questions', selectedType, selectedDifficulty],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedType) {
        params.type = selectedType;
      }
      if (selectedDifficulty) {
        params.difficulty = selectedDifficulty;
      }

      const response = await axios.get<ApiResponse<Question[]>>('/api/questions', { params });
      return response.data?.data || [];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Client-side text filter matching on Question title, prompt, or tags + sorting
  const processedQuestions = useMemo(() => {
    let result = [...questions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((q) => {
        const titleMatch = q.title.toLowerCase().includes(query);
        const textMatch = q.content?.question_text?.toLowerCase().includes(query);
        const tagMatch = q.tags?.some((tag) => tag.toLowerCase().includes(query));
        return titleMatch || textMatch || tagMatch;
      });
    }

    const difficultyWeight: Record<DifficultyLevel, number> = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
    };

    result.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'marks-desc':
          return b.marks - a.marks;
        case 'marks-asc':
          return a.marks - b.marks;
        case 'difficulty-asc':
          return difficultyWeight[a.difficulty] - difficultyWeight[b.difficulty];
        case 'difficulty-desc':
          return difficultyWeight[b.difficulty] - difficultyWeight[a.difficulty];
        default:
          return 0;
      }
    });

    return result;
  }, [questions, searchQuery, sortBy]);

  // Helper for rendering difficulty badges
  const renderDifficultyBadge = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'EASY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            EASY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            MEDIUM
          </span>
        );
      case 'HARD':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            HARD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {difficulty}
          </span>
        );
    }
  };

  // Helper for rendering modality / type badges
  const renderTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'CODING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            Coding Sandbox
          </span>
        );
      case 'MCQ':
      case 'MSQ':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            {type === 'MCQ' ? 'MCQ (Single)' : 'MSQ (Multiple)'}
          </span>
        );
      case 'SCENARIO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
            Scenario Essay
          </span>
        );
      case 'FILL_BLANK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <FileEdit className="w-3.5 h-3.5 text-amber-600" />
            Fill in Blank
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header & Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Question Filter Bar
              </h2>
              <p className="text-xs text-slate-500">
                Filter questions by type, difficulty level, and sorting order.
              </p>
            </div>
          </div>

          {/* Search bar & Clear filters */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, prompt, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 focus:bg-white rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            {isFilterActive && (
              <button
                onClick={resetFilters}
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Reset all filters and sorting"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          {/* Question Type Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Question Type</span>
            </label>
            <select
              value={selectedType || ''}
              onChange={(e) =>
                setSelectedType(e.target.value ? (e.target.value as QuestionType) : null)
              }
              className="w-full bg-white border border-slate-200 text-xs font-medium text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-2xs"
            >
              <option value="">All Question Types</option>
              <option value="CODING">Coding Challenges (Judge0 Sandbox)</option>
              <option value="MCQ">Multiple Choice Questions (Auto-Graded)</option>
              <option value="MSQ">Multiple Select Questions (Auto-Graded)</option>
              <option value="SCENARIO">AI Scenario Essays (Gemini Grading)</option>
              <option value="FILL_BLANK">Direct Input & Blanks (Exact Match)</option>
            </select>
          </div>

          {/* Difficulty Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Award className="w-3 h-3 text-slate-400" />
              <span>Difficulty</span>
            </label>
            <select
              value={selectedDifficulty || ''}
              onChange={(e) =>
                setSelectedDifficulty(e.target.value ? (e.target.value as DifficultyLevel) : null)
              }
              className="w-full bg-white border border-slate-200 text-xs font-medium text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-2xs"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Sort By</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-white border border-slate-200 text-xs font-medium text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-2xs"
            >
              <option value="title-asc">Title (A to Z)</option>
              <option value="title-desc">Title (Z to A)</option>
              <option value="marks-desc">Marks (Highest First)</option>
              <option value="marks-asc">Marks (Lowest First)</option>
              <option value="difficulty-asc">Difficulty (Easy → Hard)</option>
              <option value="difficulty-desc">Difficulty (Hard → Easy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
        <div>
          Showing <span className="font-bold text-slate-900">{processedQuestions.length}</span> of{' '}
          <span className="font-bold text-slate-900">{questions.length}</span> loaded questions
        </div>
        {selectedType && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-100">
            Filtered by: {selectedType}
          </span>
        )}
      </div>

      {/* 2. Dynamic Question List Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">Loading questions library...</p>
            <p className="text-xs text-slate-400">Fetching records from API with retry resiliency...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="p-8 text-center">
            <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Failed to load questions</h4>
                <p className="text-xs text-rose-700 mt-1">
                  {(error as Error)?.message || 'An unexpected error occurred while contacting the server.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Retry Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && processedQuestions.length === 0 && (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No questions found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || selectedType || selectedDifficulty
                ? 'No questions match the current combination of dropdown filters and search terms.'
                : 'The question bank is currently empty.'}
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !isError && processedQuestions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Title & Stem
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Question Type
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Difficulty
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Marks
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Topics & Tags
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Title & Stem */}
                    <td className="px-5 py-4 max-w-md">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {question.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        <MarkdownView content={question.content?.question_text || question.title} />
                      </div>
                    </td>

                    {/* Modality / Type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {renderTypeBadge(question.type)}
                    </td>

                    {/* Difficulty */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {renderDifficultyBadge(question.difficulty)}
                    </td>

                    {/* Marks */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {question.marks} pts
                      </span>
                    </td>

                    {/* Topics / Tags */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {question.tags && question.tags.length > 0 ? (
                          question.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                            >
                              <Hash className="w-2.5 h-2.5 text-slate-400" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No tags</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. Default Export with QueryClient Wrapper
// ==========================================
export const QuestionLibraryDashboard: React.FC = () => {
  return (
    <QueryClientProvider client={defaultQueryClient}>
      <QuestionLibraryDashboardContent />
    </QueryClientProvider>
  );
};

export default QuestionLibraryDashboard;
