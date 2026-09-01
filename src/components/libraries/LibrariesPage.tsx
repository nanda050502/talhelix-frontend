import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  BarChart2,
  Plus,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Trash2,
  ExternalLink,
  HelpCircle,
  FolderOpen,
  Edit2,
  Database,
  Filter,
} from 'lucide-react';
import { QuestionLibrary } from '../../types';
import { QuestionLibraryDashboard } from './QuestionLibraryDashboard';

export const LibrariesPage: React.FC = () => {
  const { libraries, createLibrary, deleteLibrary, navigateTo } = useApp();

  const [activeTab, setActiveTab] = useState<'bank' | 'collections'>('bank');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<QuestionLibrary | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Backend Development');

  const filteredLibraries = libraries.filter(
    (lib) =>
      lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createLibrary({
      name: name.trim(),
      description: description.trim(),
      category,
    });
    setCreateModalOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Tab Switcher: Question Item Bank vs Library Collections */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Interactive Question Bank</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'collections'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Library Collections ({libraries.length})</span>
        </button>
      </div>

      {activeTab === 'bank' ? (
        <QuestionLibraryDashboard />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mt-0.5">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                  Library Collections
                </h1>
                <p className="text-sm text-slate-500">
                  Manage grouped collections of reusable questions for your assessments.
                </p>
              </div>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Collection</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search question libraries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-none text-sm focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Libraries Grid or Empty State */}
          {filteredLibraries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center my-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No collections yet.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Create your first question library to get started organizing reusable question items across your team.
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Create Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLibraries.map((lib) => (
                <div
                  key={lib.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {lib.category}
                      </span>

                      <button
                        onClick={() => deleteLibrary(lib.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Library"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                      {lib.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {lib.description || 'Collection of curated questions for screening and certifications.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                        {lib.questionCount} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {lib.createdAt}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedLibrary(lib)}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <span>View Items</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal: Create Library */}
          <Modal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            title="Create Collection"
            subtitle="Create a new collection to organize questions."
          >
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Core Java Questions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Backend Development">Backend Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Database">Database</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Frontend">Frontend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </Modal>

          {/* Modal: Library Items Inspector */}
          <Modal
            isOpen={!!selectedLibrary}
            onClose={() => setSelectedLibrary(null)}
            title={selectedLibrary?.name || 'Library Questions'}
            subtitle={`${selectedLibrary?.questionCount} Questions in ${selectedLibrary?.category}`}
            maxWidth="2xl"
          >
            {selectedLibrary && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">{selectedLibrary.description}</p>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {(selectedLibrary.questions || []).map((q, idx) => (
                    <div key={q.id || idx} className="p-3.5 bg-white hover:bg-slate-50 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600">Q{idx + 1}.</span>
                          <span className="text-xs font-bold text-slate-900">{q.title}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{q.stemMarkdown}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {q.marks} Mark
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedLibrary(null);
                      navigateTo('/admin/assessment-setup');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    Use in new assessment →
                  </button>

                  <button
                    onClick={() => setSelectedLibrary(null)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      )}
    </div>
  );
};
