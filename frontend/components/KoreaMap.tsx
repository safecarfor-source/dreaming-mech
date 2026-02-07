'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { REGIONS } from '@/lib/regionMap';
import { REGION_PATHS } from '@/lib/koreaMapPaths';

interface KoreaMapProps {
  regionCounts: Record<string, number>;
  selectedRegion: string | null;
  onRegionClick: (regionId: string) => void;
}

// 인천처럼 섬이 많아 클릭이 어려운 지역용 히트 영역
const HIT_AREAS: Record<string, { x: number; y: number; w: number; h: number }> = {
  incheon: { x: 176, y: 166, w: 14, h: 16 },
};

export default function KoreaMap({
  regionCounts,
  selectedRegion,
  onRegionClick,
}: KoreaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getRegionFill = (regionId: string) => {
    if (selectedRegion === regionId) return '#bf00ff';
    if (hoveredRegion === regionId) return '#f3e8ff';
    if (regionCounts[regionId] > 0) return '#faf5ff';
    return '#f5f5f4';
  };

  const getRegionStroke = (regionId: string) => {
    if (selectedRegion === regionId) return '#7c3aed';
    if (hoveredRegion === regionId) return '#bf00ff';
    if (regionCounts[regionId] > 0) return '#c084fc';
    return '#78716c';
  };

  const getTextColor = (regionId: string) => {
    if (selectedRegion === regionId) return '#ffffff';
    if (regionCounts[regionId] > 0) return '#6d28d9';
    return '#1c1917';
  };

  const getRegionOpacity = (regionId: string) => {
    if (regionCounts[regionId] === 0 && selectedRegion !== regionId) return 0.55;
    return 1;
  };

  const regionName = (regionId: string) => {
    const region = REGIONS.find((r) => r.id === regionId);
    return region?.name || '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex justify-center mb-6"
    >
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
        <svg
          viewBox="145 148 110 110"
          className="w-full h-auto"
          role="img"
          aria-label="대한민국 지도 - 지역을 클릭하여 정비소를 찾으세요"
        >
          {/* 붓 터치 느낌 필터 */}
          <defs>
            <filter id="brush" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" result="turbulence" />
              <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="0.4" />
            </filter>
          </defs>

          {/* 지역 path 렌더링 */}
          {Object.entries(REGION_PATHS).map(([regionId, { d, labelX, labelY }]) => {
            const hitArea = HIT_AREAS[regionId];
            return (
              <g
                key={regionId}
                onClick={() => onRegionClick(regionId)}
                onMouseEnter={() => setHoveredRegion(regionId)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{
                  cursor: 'pointer',
                  opacity: getRegionOpacity(regionId),
                }}
                role="button"
                tabIndex={0}
                aria-label={`${regionName(regionId)} - 정비소 ${regionCounts[regionId] || 0}곳`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRegionClick(regionId);
                  }
                }}
              >
                {/* 히트 영역 (섬 지역용 - 투명 사각형) */}
                {hitArea && (
                  <rect
                    x={hitArea.x}
                    y={hitArea.y}
                    width={hitArea.w}
                    height={hitArea.h}
                    fill="transparent"
                  />
                )}

                {/* 지역 영역 */}
                <path
                  d={d}
                  fill={getRegionFill(regionId)}
                  stroke={getRegionStroke(regionId)}
                  strokeWidth={
                    selectedRegion === regionId || hoveredRegion === regionId
                      ? 1.1
                      : 0.55
                  }
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter="url(#brush)"
                  style={{
                    transition:
                      'fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
                  }}
                />

                {/* 지역 이름 */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill={getTextColor(regionId)}
                  fontSize="4.5"
                  fontWeight="900"
                  style={{
                    pointerEvents: 'none',
                    transition: 'fill 0.2s ease',
                    userSelect: 'none',
                  }}
                >
                  {regionName(regionId)}
                </text>

                {/* 정비소 수 */}
                {regionCounts[regionId] > 0 && (
                  <text
                    x={labelX}
                    y={labelY + 5}
                    textAnchor="middle"
                    fill={selectedRegion === regionId ? '#e9d5ff' : '#bf00ff'}
                    fontSize="3.5"
                    fontWeight="700"
                    style={{
                      pointerEvents: 'none',
                      transition: 'fill 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    {regionCounts[regionId]}곳
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* 안내 문구 */}
        <p className="text-center text-sm text-gray-400 mt-2">
          지역을 클릭하여 정비소를 찾아보세요
        </p>
      </div>
    </motion.div>
  );
}
