export default function CardSkeleton() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden animate-pulse">
      {/* 4:3 이미지 영역 */}
      <div className="aspect-[4/3] bg-bg-tertiary" />
      {/* 텍스트 영역 — 카드와 동일한 점진적 패딩 */}
      <div className="p-3 sm:p-4 md:p-5 space-y-3">
        <div className="h-5 bg-bg-tertiary rounded w-3/4" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-bg-tertiary rounded w-full" />
          <div className="h-3.5 bg-bg-tertiary rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
