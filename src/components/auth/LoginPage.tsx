import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, ArrowRight, GraduationCap, Shield, Building2, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('admin@stanford.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    let role: 'admin' | 'institution' | 'student' = 'admin';
    if (clean.includes('student') || clean.includes('alice') || clean.includes('john') || clean.includes('emily') || clean.includes('david')) {
      role = 'student';
    } else if (clean.includes('stanford') || clean.includes('inst') || clean.includes('college') || clean.includes('university') || clean.includes('mitchell')) {
      role = 'institution';
    }
    login(email, role);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* TalHelix Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            T
          </div>
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-[#0F172A]">Tal</span>
            <span className="text-blue-600">Helix</span>
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
          Welcome to TalHelix
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Unified Assessment, Candidate Proctoring & Institution Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-md rounded-2xl border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(!showForgot)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {showForgot && (
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-200">
                For demo and testing purposes, any password is valid. You can also use the 1-click test login options below.
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer mt-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo 1-Click Sign In Section */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-slate-700">1-Click Test Login (Role Demos):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => login('admin@stanford.edu', 'institution')}
                className="py-2.5 px-3 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 transition-colors flex items-center justify-start gap-2 cursor-pointer text-left shadow-xs hover:shadow-sm"
              >
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="truncate">
                  <div className="truncate font-semibold">Institution Admin</div>
                  <div className="text-xs text-indigo-600 font-normal truncate">Stanford Portal</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => login('n_admin@talhelix.com', 'admin')}
                className="py-2.5 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-start gap-2 cursor-pointer text-left shadow-xs hover:shadow-sm"
              >
                <Shield className="w-4 h-4 text-slate-700 shrink-0" />
                <div className="truncate">
                  <div className="truncate font-semibold">Super Admin</div>
                  <div className="text-xs text-slate-500 font-normal truncate">Global Admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => login('alice@stanford.edu', 'student')}
                className="py-2.5 px-3 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 transition-colors flex items-center justify-start gap-2 cursor-pointer text-left shadow-xs hover:shadow-sm"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <div className="truncate font-semibold">Student</div>
                  <div className="text-xs text-emerald-600 font-normal truncate">Alice Chen</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
