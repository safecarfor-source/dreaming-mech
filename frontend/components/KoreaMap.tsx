'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MAP_REGIONS } from '@/lib/koreaMapPaths';

interface KoreaMapProps {
  regionCounts: Record<string, number>;
  selectedRegion: string | null;
  onRegionClick: (regionId: string) => void;
}

export default function KoreaMap({
  regionCounts,
  selectedRegion,
  onRegionClick,
}: KoreaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const hasShops = (regionId: string) => (regionCounts[regionId] || 0) > 0;

  // SVG path 색상
  const getPathFill = (regionId: string) => {
    if (selectedRegion === regionId) return '#8b5cf6';
    if (hoveredRegion === regionId && hasShops(regionId)) return '#a78bfa';
    if (hoveredRegion === regionId) return '#ddd6fe';
    if (hasShops(regionId)) return '#c4b5fd';
    return '#ede9fe';
  };

  const handleClick = (regionId: string) => {
    onRegionClick(regionId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex justify-center mb-6"
    >
      <div className="w-full max-w-[430px] bg-white rounded-[20px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]">
        {/* 지도 영역 */}
        <div className="relative w-full" style={{ aspectRatio: '524 / 631' }}>
          {/* SVG 지도 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 524 631"
            aria-label="대한민국 지도"
            className="w-full h-full"
          >
            {MAP_REGIONS.map((region) => (
              <path
                key={region.svgId}
                id={region.svgId}
                d={region.path}
                fill={getPathFill(region.regionId)}
                stroke="#fff"
                strokeWidth={2}
                className="cursor-pointer"
                style={{ transition: 'fill 0.2s ease' }}
                onClick={() => handleClick(region.regionId)}
                onMouseEnter={() => setHoveredRegion(region.regionId)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
            ))}
          </svg>

          {/* 플로팅 라벨 */}
          {MAP_REGIONS.map((region) => {
            const count = regionCounts[region.regionId] || 0;
            const active = count > 0;
            const isSelected = selectedRegion === region.regionId;

            return (
              <div
                key={`label-${region.regionId}`}
                className={`
                  absolute flex items-center gap-[5px] rounded-full text-[13px] font-bold leading-none
                  whitespace-nowrap cursor-pointer z-10 select-none pointer-events-auto
                  transition-transform duration-150 ease-out
                  ${active
                    ? 'bg-[#581c87] text-white shadow-[0_3px_10px_rgba(88,28,135,0.3)] px-3 py-1.5'
                    : 'bg-[#f1f0fb] text-gray-500 shadow-[0_2px_6px_rgba(0,0,0,0.06)] px-2.5 py-1.5 text-xs font-semibold'
                  }
                  ${isSelected
                    ? 'scale-[1.12] shadow-[0_0_0_3px_rgba(124,58,237,0.35),0_4px_16px_rgba(0,0,0,0.12)]'
                    : 'hover:scale-[1.08]'
                  }
                `}
                style={{ left: region.labelLeft, top: region.labelTop }}
                onClick={() => handleClick(region.regionId)}
                onMouseEnter={() => setHoveredRegion(region.regionId)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <span>{region.name}</span>
                {active && (
                  <span className="bg-white/25 px-1.5 py-0.5 rounded-full text-[11px] font-semibold">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex justify-center gap-4 pt-3 text-xs text-gray-400">
          <div className="flex items-center gap-[5px]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#581c87]" />
            <span>정비소 있음</span>
          </div>
          <div className="flex items-center gap-[5px]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ede9fe] border border-[#d8b4fe]" />
            <span>준비중</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
