import React, { useState } from 'react';
import { Search, Sparkles, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Student } from '../../types';

interface UserLookupHeaderProps {
  emailInput: string;
  setEmailInput: (val: string) => void;
  onSearch: (email?: string) => void;
  students: Student[];
}

export const UserLookupHeader: React.FC<UserLookupHeaderProps> = ({
  emailInput,
  setEmailInput,
  onSearch,
  students,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      onSearch(emailInput.trim());
    }
  };

  const handleQuickPick = (email: string) => {
    setEmailInput(email);
    onSearch(email);
  };

  // Filter student suggestions as the user types
  const filteredSuggestions = emailInput.trim()
    ? students.filter(
        (s) =>
          s.email.toLowerCase().includes(emailInput.toLowerCase()) ||
          s.name.toLowerCase().includes(emailInput.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="space-y-4">
      {/* Title and Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
          User Lookup
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Search a student by email to view and manage every assessment assigned to them.
        </p>
      </div>

      {/* Find a user Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <label className="block text-xs font-semibold text-slate-900 mb-2">
          Find a user
        </label>

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder="Enter candidate email (e.g. nanda@talhelix.com)"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />

              {/* Suggestions Dropdown */}
              {isFocused && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg border border-slate-200 shadow-lg z-30 divide-y divide-slate-100 overflow-hidden">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => handleQuickPick(s.email)}
                      className="w-full px-3.5 py-2 text-left hover:bg-blue-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {s.assignments?.length || 0} tests
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Quick Candidate Suggestion Chips */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Quick candidates:</span>
          {students.slice(0, 5).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleQuickPick(s.email)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                emailInput.toLowerCase() === s.email.toLowerCase()
                  ? 'bg-blue-100 text-blue-800 font-semibold border border-blue-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {s.name} ({s.email.split('@')[0]})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
