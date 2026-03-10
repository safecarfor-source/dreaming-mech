'use client';

export default function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />
  );
}
