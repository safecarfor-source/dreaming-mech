'use client';

import React from 'react';

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number | null;
  colorClass: string;
  bgClass: string;
}

export default function StatCard({
  icon,
  label,
  value,
  delta,
  colorClass,
  bgClass,
}: StatCardProps) {
  return (
    <div className={`${bgClass} rounded-xl p-4 space-y-2`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      {delta !== undefined && delta !== null && (
        <p className={`text-xs font-medium ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% 전주 대비
        </p>
      )}
    </div>
  );
}
