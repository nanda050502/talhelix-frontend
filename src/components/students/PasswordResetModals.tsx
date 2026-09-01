import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { validatePasswordStrengthClient, PasswordResetResponse } from '../../api/services';
import {
  KeyRound,
  RotateCcw,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react';

/**
 * ==========================================
 * Password Policy Note
 * ------------------------------------------
 * Mirrors Go validation: 8–128 chars, ≥3 of 4 categories (upper/lower/digit/special),
 * no 3 identical consecutive, not in deny-list, not equal to default fallback.
 * Default fallback 'srmpassword26' is only allowed via Reset-to-Default action.
 * Recommendation (non-blocking): long-term, prefer unique per-student temp
 * passwords over a shared default — reduces blast radius if default leaks.
 * ==========================================
 */

export interface ResetCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isPending: boolean;
  selectedCount: number;
  selectedEmails: string[]; // for preview, never logged with password
  selectedIds: (number | string)[];
}

export const ResetCustomPasswordModal: React.FC<ResetCustomModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  selectedCount,
  selectedEmails,
  selectedIds,
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirm('');
      setShowPassword(false);
      setShowConfirm(false);
      setTouched(false);
    }
  }, [isOpen]);

  const validation = useMemo(() => validatePasswordStrengthClient(password), [password]);
  const confirmMismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    !isPending &&
    validation.valid &&
    password.length > 0 &&
    confirm === password &&
    selectedCount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    await onConfirm(password);
  };

  const strengthLabel = useMemo(() => {
    if (!password) return { label: 'Enter password', color: 'text-slate-400', bg: 'bg-slate-200', width: '0%' };
    if (!validation.valid) return { label: 'Weak', color: 'text-rose-600', bg: 'bg-rose-500', width: '35%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const cats = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    const len = password.length;
    if (cats === 4 && len >= 12) return { label: 'Strong', color: 'text-emerald-700', bg: 'bg-emerald-500', width: '100%' };
    if (cats >= 3 && len >= 10) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-500', width: '75%' };
    return { label: 'Fair', color: 'text-amber-700', bg: 'bg-amber-500', width: '55%' };
  }, [password, validation.valid]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? () => {} : onClose}
      title="Reset TalHelix Password"
      subtitle={
        selectedCount === 1
          ? `Set a new password for 1 selected candidate`
          : `Set a new password for ${selectedCount} selected candidates (same password will be hashed individually)`
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target summary — never shows password/hash */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800">
              {selectedCount} candidate{selectedCount !== 1 ? 's' : ''} will be updated
              {selectedIds.length > 0 && ` — IDs: ${selectedIds.slice(0, 3).join(', ')}${selectedIds.length > 3 ? ` +${selectedIds.length - 3} more` : ''}`}
            </p>
            {selectedEmails.length > 0 && (
              <p className="font-mono text-slate-500 mt-1 truncate">
                {selectedEmails.slice(0, 2).join(', ')}
                {selectedEmails.length > 2 ? ` +${selectedEmails.length - 2} more` : ''}
              </p>
            )}
            <p className="text-slate-500 mt-1.5">
              Password will be bcrypt-hashed server-side (worker pool cap 8) inside a transaction. Affected row count is verified before commit; audit log records who/when/action — <em>never plaintext or hash</em>.
            </p>
          </div>
        </div>

        {/* Password input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            New Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 3 of 4 categories"
              className={`w-full border rounded-lg pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:outline-none placeholder:text-slate-400 ${
                touched && !validation.valid
                  ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-400 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-blue-500 focus:border-blue-400'
              }`}
              disabled={isPending}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength meter */}
          <div className="mt-2">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${strengthLabel.bg} transition-all duration-300`}
                style={{ width: strengthLabel.width }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs font-medium ${strengthLabel.color}`}>{strengthLabel.label}</span>
              <span className="text-xs text-slate-500">8–128 chars · 3/4 categories · no 3 repeats · not weak</span>
            </div>
          </div>

          {touched && !validation.valid && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {validation.error}
            </p>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter same password"
              className={`w-full border rounded-lg pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:outline-none placeholder:text-slate-400 ${
                confirmMismatch ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-blue-500'
              }`}
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmMismatch && <p className="text-xs text-rose-600 mt-1.5">Passwords do not match.</p>}
        </div>

        {/* Policy callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold">Password policy</p>
            <p className="text-amber-800">Min 8 chars, at least 3 of: uppercase, lowercase, digit, special. Common passwords and the shared default <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">srmpassword26</code> are rejected here — use “Reset to Default” for that.</p>
            <p className="text-amber-700 mt-1 italic">Recommendation (non-blocking): for stronger long-term security, prefer unique per-student temporary passwords instead of a shared default.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Hashing & Updating…</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Reset Password{selectedCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export interface ResetDefaultConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  selectedCount: number;
  selectedEmails: string[];
  selectedIds: (number | string)[];
  isBatch: boolean; // true if >1 or batch context
}

export const ResetDefaultConfirmModal: React.FC<ResetDefaultConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  selectedCount,
  selectedEmails,
  selectedIds,
  isBatch,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? () => {} : onClose}
      title="Reset to Default Password"
      subtitle={
        isBatch
          ? `This will reset passwords for ${selectedCount} students to the fallback default.`
          : `Reset password for 1 student to the fallback default.`
      }
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900">
              {isBatch
                ? `This will reset passwords for ${selectedCount} students. Continue?`
                : `Reset password for the selected candidate?`}
            </h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              The system will bcrypt-hash the standard fallback password{' '}
              <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">srmpassword26</code>{' '}
              via the capped worker pool (8 goroutines) and update <code className="font-mono">users.password_hash</code> inside a transaction.
              Affected row count is verified before commit; mismatch rolls back and surfaces an error. Audit log captures who/when/action — never plaintext/hash.
            </p>
            {selectedCount > 1 && (
              <div className="mt-3 bg-white border border-amber-200 rounded-lg p-2.5 max-h-28 overflow-y-auto">
                <p className="text-xs font-semibold text-slate-700 mb-1">Targets ({selectedCount}):</p>
                <p className="text-xs font-mono text-slate-600 break-all">
                  {selectedEmails.slice(0, 8).join(', ')}
                  {selectedEmails.length > 8 ? ` +${selectedEmails.length - 8} more` : ''}
                  {selectedEmails.length === 0 && selectedIds.slice(0, 8).join(', ')}
                </p>
              </div>
            )}
            {!isBatch && selectedEmails[0] && (
              <p className="text-xs font-mono text-slate-600 mt-2 bg-white border border-amber-200 rounded px-2.5 py-2 truncate">
                {selectedEmails[0]} {selectedIds[0] ? `· ID ${selectedIds[0]}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex gap-2.5">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Emails are matched case-insensitively via <code className="font-mono bg-white px-1 py-0.5 rounded border">LOWER(email)=LOWER($1)</code>. No plaintext or hash is ever returned in the API response.
            <span className="block mt-1 italic text-slate-500">
              Note: shared default is convenient but not ideal — unique per-student temporary passwords would be stronger long-term (recommendation).
            </span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting…</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Default ({selectedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export interface ResetResultProps {
  isOpen: boolean;
  onClose: () => void;
  result: PasswordResetResponse | null;
}

export const ResetResultModal: React.FC<ResetResultProps> = ({ isOpen, onClose, result }) => {
  if (!result) return null;
  const hasFailures = result.failed_count > 0;
  const allSuccess = result.failed_count === 0 && result.success;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={allSuccess ? 'Passwords Updated' : 'Password Reset — Partial Result'}
      subtitle={
        hasFailures
          ? `${result.updated_count} updated, ${result.failed_count} failed — view details`
          : `${result.updated_count} candidate${result.updated_count !== 1 ? 's' : ''} updated successfully`
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div
          className={`rounded-xl p-4 flex items-start gap-3 border ${
            allSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${
              allSuccess ? 'bg-emerald-100 border-emerald-200' : 'bg-amber-100 border-amber-200'
            }`}
          >
            {allSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${allSuccess ? 'text-emerald-900' : 'text-amber-900'}`}>{result.message}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="bg-white border border-slate-200 rounded-full px-2.5 py-1 font-mono font-semibold text-slate-700">
                Total: {result.total_requested}
              </span>
              <span className="bg-emerald-600 text-white rounded-full px-2.5 py-1 font-semibold">
                ✓ {result.updated_count} updated
              </span>
              {hasFailures && (
                <span className="bg-rose-600 text-white rounded-full px-2.5 py-1 font-semibold">
                  ✗ {result.failed_count} failed
                </span>
              )}
              <span className="text-slate-500 font-mono">audit: {result.audit_log_id}</span>
            </div>
          </div>
        </div>

        {hasFailures && result.failures.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Failures ({result.failures.length})
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.failures.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {f.email || f.studentId || '—'}
                        {f.studentId && f.email ? ` · ID ${f.studentId}` : ''}
                      </td>
                      <td className="px-3 py-2 text-rose-600">{f.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hasFailures && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Transaction verified: affected row count matched expected selection before commit. Audit log recorded with action{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded border">{result.action}</code> — plaintext and hash were never logged or returned.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const PasswordPolicyHint: React.FC = () => (
  <p className="text-xs text-slate-500 leading-relaxed">
    Passwords are bcrypt-hashed server-side. Policy: 8–128 chars, ≥3 categories (upper/lower/digit/special), no 3 repeats, not common weak. Default via dedicated button only.
  </p>
);
