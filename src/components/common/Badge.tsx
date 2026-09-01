import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: 'active' | 'in-progress' | 'inactive' | 'published' | 'draft' | 'blue' | 'purple' | 'emerald' | 'amber';
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children, className = '' }) => {
  // Dull muted palette — no neon glows, low chroma for eye comfort
  let style = 'bg-slate-100 text-slate-600 border border-slate-200';

  const normalized = (status || variant || '').toLowerCase();

  if (normalized === 'active' || normalized === 'passed') {
    style = 'bg-[#eef2f0] text-[#5a6b60] border border-[#dbe2de]'; // muted sage, not neon green
  } else if (normalized === 'in progress' || normalized === 'in-progress' || normalized === 'pending') {
    style = 'bg-[#f5f3f0] text-[#6b6575] border border-[#e8e4df]'; // muted warm stone
  } else if (normalized === 'inactive' || normalized === 'failed' || normalized === 'archived') {
    style = 'bg-slate-100 text-slate-500 border border-slate-200';
  } else if (normalized === 'published') {
    style = 'bg-slate-100 text-slate-600 border border-slate-200';
  } else if (normalized === 'draft') {
    style = 'bg-stone-100 text-stone-600 border border-stone-200';
  } else if (normalized === 'blue') {
    style = 'bg-slate-100 text-slate-600 border border-slate-200';
  } else if (normalized === 'purple') {
    style = 'bg-slate-100 text-slate-600 border border-slate-200';
  } else if (normalized === 'emerald') {
    style = 'bg-[#eef2f0] text-[#5a6b60] border border-[#dbe2de]';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${style} ${className}`}
    >
      {children || status}
    </span>
  );
};
