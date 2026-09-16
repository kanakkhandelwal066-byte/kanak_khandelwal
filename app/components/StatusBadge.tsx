'use client';

import React from 'react';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
  type?: 'booking' | 'condition' | 'availability';
  className?: string;
}

export default function StatusBadge({ status, type = 'booking', className }: StatusBadgeProps) {
  let badgeStyle = 'bg-gray-100 text-gray-800 border-gray-200';
  let label = status;

  if (type === 'booking') {
    switch (status) {
      case 'PENDING':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Pending Review';
        break;
      case 'APPROVED':
        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'Approved / Reserved';
        break;
      case 'ISSUED':
        badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'Currently Borrowed';
        break;
      case 'RETURNED':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Returned';
        break;
      case 'REJECTED':
        badgeStyle = 'bg-red-50 text-red-700 border-red-200';
        label = 'Rejected';
        break;
      case 'CANCELLED':
        badgeStyle = 'bg-gray-100 text-gray-600 border-gray-300';
        label = 'Cancelled';
        break;
      case 'OVERDUE':
        badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-bold';
        label = '⚠️ OVERDUE';
        break;
    }
  } else if (type === 'condition') {
    switch (status) {
      case 'EXCELLENT':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Excellent';
        break;
      case 'GOOD':
        badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
        label = 'Good';
        break;
      case 'NEEDS_MAINTENANCE':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Needs Maintenance';
        break;
      case 'DAMAGED':
        badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
        label = 'Damaged';
        break;
      case 'MISSING':
        badgeStyle = 'bg-red-100 text-red-800 border-red-300 font-semibold';
        label = 'Missing';
        break;
    }
  } else if (type === 'availability') {
    if (status === 'Available' || status === 'AVAILABLE' || status === 'true') {
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Available';
    } else {
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Unavailable';
    }
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        badgeStyle,
        className
      )}
    >
      {label}
    </span>
  );
}
