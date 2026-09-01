import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Clock,
  HelpCircle,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Users,
  Database,
  Layers,
  FileCheck,
  Zap,
  Upload,
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code,
} from 'lucide-react';
import { Assessment, Question } from '../../types';

export const AssessmentsPage: React.FC = () => {
  const {
    assessments,
    createAssessment,
    duplicateAssessment,
    deleteAssessment,
    navigateTo,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all-blueprints' | 'assigned' | 'unassigned' | 'drafts'>('all-blueprints');
  const [oneShotModalOpen, setOneShotModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // One-Shot Setup States
  const [oneShotTab, setOneShotTab] = useState<'file' | 'paste'>('file');
  const [oneShotJsonText, setOneShotJsonText] = useState('');
  const [oneShotLoading, setOneShotLoading] = useState(false);
  const [oneShotParsed, setOneShotParsed] = useState<any | null>(null);
  const [oneShotError, setOneShotError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Programming', 'Database', 'Cloud', 'Computer Science', 'Web Development', 'Aptitude'];

  const filteredAssessments = assessments.filter((asm) => {
    const matchesSearch =
      asm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asm.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || asm.category === selectedCategory;

    const assignedCount = asm.assignedCount ?? (asm.assignedStudentIds?.length || 0);

    // Filter by admin-friendly assessment tabs
    if (activeTab === 'assigned') {
      return matchesSearch && matchesCategory && asm.status === 'Published' && assignedCount > 0;
    } else if (activeTab === 'unassigned') {
      return matchesSearch && matchesCategory && (assignedCount === 0 || !asm.assignedCount);
    } else if (activeTab === 'drafts') {
      return matchesSearch && matchesCategory && asm.status === 'Draft';
    }
    return matchesSearch && matchesCategory;
  });

  const parseJsonData = async (rawJsonText: string, fileName?: string) => {
    setOneShotLoading(true);
    setOneShotError(null);
    try {
      let rawObj: any;
      try {
        rawObj = JSON.parse(rawJsonText);
      } catch {
        setOneShotError('Invalid JSON syntax. Please check for trailing commas or missing quotes.');
        setOneShotLoading(false);
        return;
      }

      // 1. Try backend normalizer
      let parsedAssessment: any = null;
      try {
        const response = await fetch('/api/parse-assessment-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonData: rawObj }),
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.assessment) {
            parsedAssessment = resJson.assessment;
          }
        }
      } catch (err) {
        console.warn('Backend parser fetch error, falling back:', err);
      }

      // 2. Client fallback
      if (!parsedAssessment) {
        const rawQs = Array.isArray(rawObj) ? rawObj : rawObj.questions || rawObj.items || rawObj.problems || [];
        parsedAssessment = {
          title: rawObj.title || rawObj.assessment_title || rawObj.name || fileName?.replace(/\.json$/i, '') || 'Imported Assessment',
          description: rawObj.description || rawObj.assessment_description || '',
          instructions: rawObj.instructions || '',
          duration: Number(rawObj.duration || rawObj.time_limit_minutes || rawObj.duration_minutes) || 60,
          passingScore: Number(rawObj.passingScore || rawObj.passing_score || rawObj.pass_percentage) || 60,
          category: rawObj.category || rawObj.topic || 'Programming',
          kind: rawObj.kind || rawObj.assessment_type || 'Full Assessment',
          requireSafeExamBrowser: rawObj.seb_enabled !== undefined || rawObj.requireSafeExamBrowser !== undefined ? Boolean(rawObj.seb_enabled || rawObj.requireSafeExamBrowser) : true,
          questions: rawQs.map((q: any, i: number) => ({
            id: q.id || `q-${i + 1}`,
            title: q.title || q.question_title || q.name || `Question ${i + 1}`,
            type: (q.type || q.question_type || (q.starter_codes || q.codeTemplate ? 'CODING' : 'MCQ')).toUpperCase(),
            difficulty: q.difficulty || q.question_difficulty || 'MEDIUM',
            marks: q.marks || q.question_marks || 2,
            negativeMarks: 0,
            requireReasoning: false,
            stemMarkdown: q.description || q.stemMarkdown || q.prompt || q.question || '',
            description: q.description || '',
            inputFormat: q.input_format || q.inputFormat || '',
            outputFormat: q.output_format || q.outputFormat || '',
            constraints: q.constraints || [],
            examples: q.examples || [],
            testCases: q.test_cases || q.testCases || [],
            options: q.options || [],
          })),
        };
      }

      setOneShotParsed(parsedAssessment);
    } catch (e: any) {
      setOneShotError(e?.message || 'Failed to parse JSON file.');
    } finally {
      setOneShotLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setOneShotJsonText(text);
        parseJsonData(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateOneShot = () => {
    if (!oneShotParsed) return;
    const qs = oneShotParsed.questions || [];
    const newAsm = createAssessment({
      title: oneShotParsed.title || 'Imported Assessment',
      description: oneShotParsed.description || '',
      instructions: oneShotParsed.instructions || '',
      duration: oneShotParsed.duration || 60,
      passingScore: oneShotParsed.passingScore || 60,
      kind: oneShotParsed.kind || 'Full Assessment',
      publishImmediately: true,
      requireSafeExamBrowser: oneShotParsed.requireSafeExamBrowser !== undefined ? Boolean(oneShotParsed.requireSafeExamBrowser) : true,
      category: oneShotParsed.category || 'Programming',
      questions: qs,
      questionsCount: qs.length,
    });

    showToast(`Successfully created "${newAsm.title}" with ${qs.length} questions!`, 'success');
    setOneShotModalOpen(false);
    setOneShotParsed(null);
    setOneShotJsonText('');
  };



  const assignedTotal = assessments.filter((a) => (a.assignedCount ?? 0) > 0 && a.status === 'Published').length;
  const unassignedTotal = assessments.filter((a) => (a.assignedCount ?? 0) === 0).length;
  const draftsTotal = assessments.filter((a) => a.status === 'Draft').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
              Assessment Blueprints & Catalog
            </h1>
            <p className="text-sm text-slate-500">
              Manage saved assessment templates in PostgreSQL DB and monitor candidate assignments & runtime instances.
            </p>
          </div>
        </div>

        {/* Right buttons with One-Shot Setup before Create Assessment */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setOneShotModalOpen(true);
              setOneShotError(null);
            }}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span>One-Shot Setup</span>
          </button>

          <button
            onClick={() => navigateTo('/admin/assessment-setup')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search blueprints by title, topic, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Category dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Strip: Admin Friendly Lifecycle Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-2 sm:gap-8">
          <button
            onClick={() => setActiveTab('all-blueprints')}
            className={`py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all-blueprints'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Created Blueprints ({assessments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Currently Assigned ({assignedTotal})</span>
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'unassigned'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Unassigned Assessments ({unassignedTotal})</span>
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'drafts'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Draft Blueprints ({draftsTotal})</span>
          </button>
        </div>
      </div>

      {/* Assessments Grid or Empty State */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center my-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No assessments found.</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {searchQuery
              ? `No assessments match "${searchQuery}". Try modifying your search or filter.`
              : 'There are currently no assessments in this filter view.'}
          </p>
          <button
            onClick={() => navigateTo('/admin/assessment-setup')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Create New Blueprint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssessments.map((assessment) => {
            const assignedCount = assessment.assignedCount ?? (assessment.assignedStudentIds?.length || 0);
            const completedCount = assessment.completedCount ?? 0;
            const inProgressCount = assessment.inProgressCount ?? 0;

            return (
              <div
                key={assessment.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top badge row + Kebab Menu */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={assessment.status === 'Published' ? 'published' : 'draft'}>
                        {assessment.status === 'Published' ? 'Published Blueprint' : 'Draft Blueprint'}
                      </Badge>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {assessment.category}
                      </span>
                      {assignedCount > 0 ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{assignedCount} Assigned</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {/* Kebab Action Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === assessment.id ? null : assessment.id)
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === assessment.id && (
                        <div
                          className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              navigateTo(`/authoring/editor/${assessment.id}`);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            Edit Blueprint
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              navigateTo('/students');
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Assign to Candidates
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              duplicateAssessment(assessment.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            Duplicate Blueprint
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              navigateTo('/reports');
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                            View Submissions & Logs
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              deleteAssessment(assessment.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            Delete Blueprint
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {assessment.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {assessment.description || 'Permanent blueprint stored in DB with question bank and evaluation rules.'}
                  </p>

                  {/* Live Runtime Stats Summary if Assigned */}
                  {assignedCount > 0 && (
                    <div className="mt-3.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Assigned</div>
                        <div className="font-bold text-slate-800 text-sm mt-0.5">{assignedCount}</div>
                      </div>
                      <div className="border-x border-slate-200">
                        <div className="text-xs text-amber-600 font-medium">In Exam</div>
                        <div className="font-bold text-amber-700 text-sm mt-0.5">{inProgressCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-600 font-medium">Finished</div>
                        <div className="font-bold text-emerald-700 text-sm mt-0.5">{completedCount}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Duration limit">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {assessment.duration} mins
                    </span>
                    <span className="flex items-center gap-1" title="Total Blueprint Questions">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      {assessment.questionsCount || 15} questions
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateTo(`/authoring/editor/${assessment.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <span>Configure</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ONE-SHOT SETUP MODAL */}
      <Modal
        isOpen={oneShotModalOpen}
        onClose={() => {
          setOneShotModalOpen(false);
          setOneShotError(null);
        }}
        title="One-Shot Assessment Setup"
        subtitle="Import an assessment instantly from JSON files with full test cases, starter code, and constraints."
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setOneShotTab('file')}
              className={`pb-2 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                oneShotTab === 'file'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload JSON File</span>
            </button>
            <button
              type="button"
              onClick={() => setOneShotTab('paste')}
              className={`pb-2 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                oneShotTab === 'paste'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Paste Raw JSON</span>
            </button>
          </div>

          {/* File Upload Zone */}
          {oneShotTab === 'file' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-purple-50/70 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileUp className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Drop your assessment JSON file here, or <span className="text-purple-700 underline">browse</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Supports STEP1-COD, multi-language coding sets, MCQ banks, testcases, and constraints.
              </p>
            </div>
          )}

          {/* Paste Raw JSON */}
          {oneShotTab === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Paste Assessment JSON:
              </label>
              <textarea
                rows={7}
                value={oneShotJsonText}
                onChange={(e) => {
                  setOneShotJsonText(e.target.value);
                  if (e.target.value.trim().startsWith('{') || e.target.value.trim().startsWith('[')) {
                    parseJsonData(e.target.value, 'pasted-assessment.json');
                  }
                }}
                placeholder={`{\n  "assessment_title": "Python & Data Structures",\n  "duration_minutes": 60,\n  "questions": [...]\n}`}
                className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          )}

          {/* Loading Indicator */}
          {oneShotLoading && (
            <div className="p-3 bg-purple-50 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-purple-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Parsing and normalizing assessment structure...</span>
            </div>
          )}

          {/* Error Message */}
          {oneShotError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{oneShotError}</span>
            </div>
          )}

          {/* Parsed Preview Card */}
          {oneShotParsed && !oneShotLoading && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ready to Create Blueprint
                </span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  {oneShotParsed.questions?.length || 0} Questions
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {oneShotParsed.title || 'Untitled Assessment'}
                </div>
                {oneShotParsed.description && (
                  <p className="text-slate-600 text-xs line-clamp-2">{oneShotParsed.description}</p>
                )}
                <div className="flex items-center gap-3 text-slate-500 text-[11px] pt-1">
                  <span>⏱ {oneShotParsed.duration || 60} mins</span>
                  <span>🎯 Pass: {oneShotParsed.passingScore || 60}%</span>
                  <span>📂 {oneShotParsed.category || 'Programming'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setOneShotModalOpen(false);
                setOneShotError(null);
              }}
              className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOneShotModalOpen(false);
                  navigateTo('/admin/assessment-setup');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Open Full Wizard →
              </button>

              <button
                type="button"
                disabled={!oneShotParsed || oneShotLoading}
                onClick={handleCreateOneShot}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Create in One-Shot</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
