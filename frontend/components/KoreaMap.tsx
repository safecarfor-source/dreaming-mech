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

// 라벨 위치 보정 (영역이 작아 글자가 겹치는 지역)
const LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
  seoul: { dx: 0, dy: -4 },
  gyeonggi: { dx: 0, dy: 3 },
  incheon: { dx: -5, dy: 0 },
  gangwon: { dx: -5, dy: 5 },
  chungbuk: { dx: -2, dy: 0 },
  chungnam: { dx: 5, dy: 0 },
  jeonbuk: { dx: 3, dy: 0 },
  jeonnam: { dx: 3, dy: -3 },
  gyeongbuk: { dx: -4, dy: -3 },
};

// 지역 확대 설정
const REGION_SCALES: Record<string, { cx: number; cy: number; scale: number }> = {
  seoul: { cx: 192.3, cy: 172.3, scale: 3.9 },
};

export default function KoreaMap({
  regionCounts,
  selectedRegion,
  onRegionClick,
}: KoreaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getRegionFill = (regionId: string) => {
    if (selectedRegion === regionId) return '#1B4D3E';
    if (hoveredRegion === regionId) return '#E8F5E9';
    return '#ffffff';
  };

  const getRegionStroke = (regionId: string) => {
    if (selectedRegion === regionId) return '#143D30';
    if (hoveredRegion === regionId) return '#2D7A5F';
    return '#D1D5DB';
  };

  const getBadgeFill = (regionId: string) => {
    if (selectedRegion === regionId) return '#FF6B35';
    if (hoveredRegion === regionId) return '#1B4D3E';
    return '#374151';
  };

  const regionName = (regionId: string) => {
    const region = REGIONS.find((r) => r.id === regionId);
    return region?.name || '';
  };

  const entries = Object.entries(REGION_PATHS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex justify-center mb-6"
    >
      <div className="w-full max-w-full sm:max-w-sm md:max-w-lg">
        <svg
          viewBox="168 155 75 100"
          className="w-full h-auto"
          role="img"
          aria-label="대한민국 지도 - 지역을 클릭하여 정비소를 찾으세요"
        >
          {/* 배경 */}
          <rect x="168" y="155" width="75" height="100" rx="4" fill="#F0EDE8" />

          {/* 1단계: 지역 영역(path) 먼저 모두 렌더링 — 서브패스를 개별 path로 */}
          {entries.map(([regionId, { paths: regionPaths }]) => {
            const hitArea = HIT_AREAS[regionId];
            const scaleInfo = REGION_SCALES[regionId];

            return (
              <g
                key={`path-${regionId}`}
                onClick={() => onRegionClick(regionId)}
                onMouseEnter={() => setHoveredRegion(regionId)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{ cursor: 'pointer' }}
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
                {hitArea && (
                  <rect
                    x={hitArea.x}
                    y={hitArea.y}
                    width={hitArea.w}
                    height={hitArea.h}
                    fill="transparent"
                  />
                )}

                {regionPaths.map((pathD, idx) => (
                  <path
                    key={idx}
                    d={pathD}
                    fill={getRegionFill(regionId)}
                    stroke={getRegionStroke(regionId)}
                    strokeWidth={
                      selectedRegion === regionId || hoveredRegion === regionId
                        ? 0.6
                        : 0.4
                    }
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    transform={
                      scaleInfo
                        ? `translate(${scaleInfo.cx * (1 - scaleInfo.scale)}, ${scaleInfo.cy * (1 - scaleInfo.scale)}) scale(${scaleInfo.scale})`
                        : undefined
                    }
                    style={{
                      transition:
                        'fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
                    }}
                  />
                ))}
              </g>
            );
          })}

          {/* 2단계: 글자(라벨)를 맨 위에 렌더링 — 절대 가려지지 않음 */}
          {entries.map(([regionId, { labelX, labelY }]) => {
            const offset = LABEL_OFFSETS[regionId] || { dx: 0, dy: 0 };
            const scaleInfo = REGION_SCALES[regionId];

            // 확대된 지역은 중심점 기준으로 라벨 배치
            const lx = scaleInfo
              ? scaleInfo.cx + offset.dx
              : labelX + offset.dx;
            const ly = scaleInfo
              ? scaleInfo.cy + offset.dy
              : labelY + offset.dy;

            const name = regionName(regionId);
            const count = regionCounts[regionId] || 0;
            const hasCount = count > 0;

            return (
              <g
                key={`label-${regionId}`}
                onClick={() => onRegionClick(regionId)}
                onMouseEnter={() => setHoveredRegion(regionId)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* 뱃지 배경 */}
                <rect
                  x={lx - (name.length * 2.5) - 1}
                  y={ly - 4}
                  width={name.length * 5 + 2}
                  height={hasCount ? 11 : 6}
                  rx="1.5"
                  ry="1.5"
                  fill={getBadgeFill(regionId)}
                  opacity="0.85"
                  style={{ transition: 'fill 0.2s ease' }}
                />

                {/* 지역 이름 */}
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="4.5"
                  fontWeight="900"
                  fontFamily="Pretendard, -apple-system, sans-serif"
                  style={{
                    userSelect: 'none',
                  }}
                >
                  {name}
                </text>

                {/* 정비소 수 */}
                {hasCount && (
                  <text
                    x={lx}
                    y={ly + 5}
                    textAnchor="middle"
                    fill="#FFD4BC"
                    fontSize="3.5"
                    fontWeight="700"
                    fontFamily="Pretendard, -apple-system, sans-serif"
                    style={{
                      userSelect: 'none',
                    }}
                  >
                    {count}곳
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
