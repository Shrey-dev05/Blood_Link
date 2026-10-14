import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';

  if (['CONFIRMED', 'CONFIRMED_AVAILABLE', 'VERIFIED', 'FULFILLED', 'ELIGIBLE', 'COMPLETED', 'USED', 'PUBLISHED', 'ACTIVE'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  } else if (['MATCHING', 'SUBMITTED', 'PENDING', 'AWAITING_CONFIRMATION', 'NOTIFIED', 'DELIVERED', 'TRAVELLING', 'ISSUED'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-300';
  } else if (['P0', 'CRITICAL', 'CANCELLED', 'EXPIRED', 'REJECTED', 'DEFERRED_PERMANENT'].includes(norm)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
  } else if (['P1', 'URGENT', 'STALE', 'REPORTED_UNVERIFIED', 'RESERVED', 'PARTIALLY_FULFILLED', 'DEFERRED_TEMPORARY', 'PAUSED'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${colorClasses} ${px} uppercase tracking-wider`}>
      {norm === 'P0' && <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-600 animate-pulse"></span>}
      {norm.replace(/_/g, ' ')}
    </span>
  );
};
