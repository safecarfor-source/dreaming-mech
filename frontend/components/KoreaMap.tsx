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

  const hasCount = (regionId: string) => (regionCounts[regionId] || 0) > 0;

  // path 색상: 정비소 있으면 진한 보라, 없으면 연한 보라
  const getRegionFill = (regionId: string) => {
    if (selectedRegion === regionId) return '#5B3FBF';
    if (hoveredRegion === regionId) return '#7C4DFF';
    if (hasCount(regionId)) return '#7C4DFF';
    return '#C4B5FD';
  };

  const getRegionStroke = (regionId: string) => {
    if (selectedRegion === regionId) return '#3D2B8F';
    if (hoveredRegion === regionId) return '#5B3FBF';
    return '#A78BFA';
  };

  // 뱃지 배경색
  const getBadgeFill = (regionId: string) => {
    if (selectedRegion === regionId) return '#F59E0B'; // 선택: 주황
    if (hoveredRegion === regionId) return '#3D2B8F';  // 호버: 진한 남보라
    if (hasCount(regionId)) return '#2D1B69';          // 정비소 있음: 남보라
    return '#8B7BC8';                                   // 정비소 없음: 연한 남보라
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
      {/* HTML 디자인 스타일: 흰 카드 + 그림자 */}
      <div className="w-full max-w-full sm:max-w-sm md:max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden p-2">
        <svg
          viewBox="168 155 75 100"
          className="w-full h-auto"
          role="img"
          aria-label="대한민국 지도 - 지역을 클릭하여 정비소를 찾으세요"
        >
          {/* 배경: 연보라 그라데이션 */}
          <rect x="168" y="155" width="75" height="100" rx="4" fill="#F5F3FF" />

          {/* 1단계: 지역 path 렌더링 */}
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
                        ? 0.7
                        : 0.5
                    }
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    transform={
                      scaleInfo
                        ? `translate(${scaleInfo.cx * (1 - scaleInfo.scale)}, ${scaleInfo.cy * (1 - scaleInfo.scale)}) scale(${scaleInfo.scale})`
                        : undefined
                    }
                    style={{
                      transition: 'fill 0.25s cubic-bezier(0.4,0,0.2,1), stroke 0.25s ease',
                    }}
                  />
                ))}
              </g>
            );
          })}

          {/* 2단계: 뱃지 라벨 렌더링 (항상 최상단) */}
          {entries.map(([regionId, { labelX, labelY }]) => {
            const offset = LABEL_OFFSETS[regionId] || { dx: 0, dy: 0 };
            const scaleInfo = REGION_SCALES[regionId];

            const lx = scaleInfo
              ? scaleInfo.cx + offset.dx
              : labelX + offset.dx;
            const ly = scaleInfo
              ? scaleInfo.cy + offset.dy
              : labelY + offset.dy;

            const name = regionName(regionId);
            const count = regionCounts[regionId] || 0;
            const showCount = count > 0;

            // 뱃지 크기 계산
            const badgeW = name.length * 5 + 8;
            const badgeH = showCount ? 13 : 7;
            const badgeX = lx - badgeW / 2;
            const badgeY = ly - 5;

            return (
              <g
                key={`label-${regionId}`}
                onClick={() => onRegionClick(regionId)}
                onMouseEnter={() => setHoveredRegion(regionId)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{
                  cursor: 'pointer',
                  filter: hoveredRegion === regionId || selectedRegion === regionId
                    ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
                  transition: 'filter 0.25s ease',
                }}
              >
                {/* 뱃지 배경 — rounded-2xl 느낌의 rx 큰 값 */}
                <rect
                  x={badgeX}
                  y={badgeY}
                  width={badgeW}
                  height={badgeH}
                  rx="3"
                  ry="3"
                  fill={getBadgeFill(regionId)}
                  style={{ transition: 'fill 0.25s cubic-bezier(0.4,0,0.2,1)' }}
                />

                {/* 지역 이름 */}
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="4"
                  fontWeight="900"
                  fontFamily="Pretendard, -apple-system, sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {name}
                </text>

                {/* 정비소 수 — HTML의 큰 숫자 스타일 */}
                {showCount && (
                  <text
                    x={lx}
                    y={ly + 5.5}
                    textAnchor="middle"
                    fill="#E9D5FF"
                    fontSize="4"
                    fontWeight="900"
                    fontFamily="Pretendard, -apple-system, sans-serif"
                    style={{ userSelect: 'none' }}
                  >
                    {count}곳
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* 하단 안내 — HTML 디자인의 하단 정보 스타일 */}
        <div className="text-center pb-3 pt-1">
          <div className="inline-flex items-center gap-2 text-purple-600 text-xs font-medium">
            <span className="w-2 h-2 bg-purple-600 rounded-full" />
            지역을 클릭하여 정비소를 찾아보세요
          </div>
        </div>
      </div>
    </motion.div>
  );
}
