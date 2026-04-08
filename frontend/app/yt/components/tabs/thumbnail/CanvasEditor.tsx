'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { CanvasEditorProps } from './types';
import { removeBackground, uploadCanvasToS3, saveThumbnail } from '../../../lib/api';

// react-konva는 SSR 비활성화 필수
const Stage = dynamic(() => import('react-konva').then((m) => m.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then((m) => m.Layer), { ssr: false });
const KonvaImage = dynamic(() => import('react-konva').then((m) => m.Image), { ssr: false });
const Text = dynamic(() => import('react-konva').then((m) => m.Text), { ssr: false });
const Transformer = dynamic(() => import('react-konva').then((m) => m.Transformer), { ssr: false });

// 캔버스 고정 크기
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

// 한글 폰트 옵션
const FONT_OPTIONS = [
  { value: 'Black Han Sans', label: 'Black Han Sans' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR Bold' },
  { value: 'Jua', label: 'Jua' },
];

interface TextNode {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
}

interface ImageNode {
  id: string;
  type: 'background' | 'person';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  draggable: boolean;
}

export default function CanvasEditor({ backgroundUrl, strategy, projectId, onBack }: CanvasEditorProps) {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 캔버스 상태
  const [images, setImages] = useState<ImageNode[]>([]);
  const [texts, setTexts] = useState<TextNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  // 텍스트 편집 패널 상태
  const [editText, setEditText] = useState('');
  const [editFontSize, setEditFontSize] = useState(80);
  const [editFontFamily, setEditFontFamily] = useState('Black Han Sans');
  const [editFill, setEditFill] = useState('#FFFFFF');
  const [editStroke, setEditStroke] = useState('#000000');
  const [editStrokeWidth, setEditStrokeWidth] = useState(4);

  // 로딩
  const [removingBg, setRemovingBg] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  // 스케일 (반응형 표시용)
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // 폰트 로딩 대기
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  // 반응형 스케일 계산
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const newScale = Math.min(containerWidth / CANVAS_WIDTH, 1);
        setScale(newScale);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // 배경 이미지 자동 로드
  useEffect(() => {
    if (backgroundUrl && !images.find((img) => img.type === 'background')) {
      loadImage(backgroundUrl, 'bg-' + Date.now(), 'background');
    }
  }, [backgroundUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // 전략 텍스트 자동 추가
  useEffect(() => {
    if (strategy && texts.length === 0 && fontsReady) {
      const initialTexts: TextNode[] = [];
      if (strategy.textMain) {
        initialTexts.push({
          id: 'main-text',
          text: strategy.textMain,
          x: 80,
          y: 280,
          fontSize: 100,
          fontFamily: 'Black Han Sans',
          fill: strategy.colorScheme?.textColor || '#FFFFFF',
          stroke: '#000000',
          strokeWidth: 5,
          draggable: true,
        });
      }
      if (strategy.textSub) {
        initialTexts.push({
          id: 'sub-text',
          text: strategy.textSub,
          x: 80,
          y: 400,
          fontSize: 60,
          fontFamily: 'Black Han Sans',
          fill: strategy.colorScheme?.accentColor || '#FFD700',
          stroke: '#000000',
          strokeWidth: 3,
          draggable: true,
        });
      }
      if (initialTexts.length > 0) {
        setTexts(initialTexts);
      }
    }
  }, [strategy, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // 이미지 로드 헬퍼
  const loadImage = useCallback((src: string, id: string, type: 'background' | 'person') => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImages((prev) => ({ ...prev, [id]: img }));

      if (type === 'background') {
        setImages((prev) => [
          ...prev.filter((i) => i.type !== 'background'),
          { id, type, src, x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, draggable: false },
        ]);
      } else {
        // 인물: 캔버스 높이의 80%로 비율 유지 리사이즈
        const ratio = img.width / img.height;
        const height = CANVAS_HEIGHT * 0.8;
        const width = height * ratio;
        setImages((prev) => [
          ...prev,
          { id, type, src, x: (CANVAS_WIDTH - width) / 2, y: CANVAS_HEIGHT - height, width, height, draggable: true },
        ]);
      }
    };
    img.src = src;
  }, []);

  // 인물 사진 업로드 + 배경 제거
  const handlePersonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRemovingBg(true);
    try {
      const { s3Url } = await removeBackground(file);
      loadImage(s3Url, 'person-' + Date.now(), 'person');
    } catch (err) {
      console.error('배경 제거 실패:', err);
      // 실패 시 원본 업로드
      const url = URL.createObjectURL(file);
      loadImage(url, 'person-' + Date.now(), 'person');
    } finally {
      setRemovingBg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 텍스트 추가
  const handleAddText = () => {
    const id = 'text-' + Date.now();
    const newText: TextNode = {
      id,
      text: '텍스트 입력',
      x: 100,
      y: 300,
      fontSize: editFontSize,
      fontFamily: editFontFamily,
      fill: editFill,
      stroke: editStroke,
      strokeWidth: editStrokeWidth,
      draggable: true,
    };
    setTexts((prev) => [...prev, newText]);
    setSelectedId(id);
  };

  // 선택된 텍스트 업데이트
  const updateSelectedText = (updates: Partial<TextNode>) => {
    if (!selectedId) return;
    setTexts((prev) => prev.map((t) => (t.id === selectedId ? { ...t, ...updates } : t)));
  };

  // 선택 변경 시 편집 패널 동기화
  useEffect(() => {
    const selected = texts.find((t) => t.id === selectedId);
    if (selected) {
      setEditText(selected.text);
      setEditFontSize(selected.fontSize);
      setEditFontFamily(selected.fontFamily);
      setEditFill(selected.fill);
      setEditStroke(selected.stroke);
      setEditStrokeWidth(selected.strokeWidth);
    }
  }, [selectedId, texts]);

  // Transformer 연결
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    if (selectedId) {
      const node = stage.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  // 스테이지 빈 곳 클릭 → 선택 해제
  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  };

  // 요소 삭제
  const handleDelete = () => {
    if (!selectedId) return;
    setTexts((prev) => prev.filter((t) => t.id !== selectedId));
    setImages((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  };

  // PNG 내보내기
  const handleExport = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      // 선택 해제
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: 'image/png' });
      const base64 = dataUrl.split(',')[1];
      const { s3Url } = await uploadCanvasToS3(base64);

      // DB에 저장
      await saveThumbnail({
        projectId,
        imageUrl: s3Url,
        baseImageUrl: backgroundUrl,
        canvasData: { texts, images: images.map(({ id, type, src, x, y, width, height }) => ({ id, type, src, x, y, width, height })) },
        strategy: strategy as unknown as Record<string, unknown>,
      });

      alert('썸네일이 저장되었습니다! 갤러리에서 확인하세요.');
    } catch (err) {
      console.error('내보내기 실패:', err);
      alert('내보내기 실패: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // 다운로드 (로컬)
  const handleDownload = () => {
    if (!stageRef.current) return;
    setSelectedId(null);
    setTimeout(() => {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: 'image/png' });
      const link = document.createElement('a');
      link.download = `thumbnail-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }, 100);
  };

  const selectedText = texts.find((t) => t.id === selectedId);

  return (
    <div className="space-y-4">
      {/* 상단 툴바 */}
      <div className="flex flex-wrap items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
          >
            ← 돌아가기
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePersonUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={removingBg}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {removingBg ? '배경 제거 중...' : '👤 인물 추가'}
        </button>

        <button
          onClick={handleAddText}
          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          ✏️ 텍스트 추가
        </button>

        {selectedId && (
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500"
          >
            🗑️ 삭제
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={handleDownload}
          className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          💾 다운로드
        </button>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 font-medium"
        >
          {exporting ? '저장 중...' : '🚀 PNG 내보내기 + 저장'}
        </button>
      </div>

      {/* 캔버스 + 텍스트 패널 */}
      <div className="flex gap-4">
        {/* 캔버스 */}
        <div ref={containerRef} className="flex-1 bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
          <div
            style={{
              width: CANVAS_WIDTH * scale,
              height: CANVAS_HEIGHT * scale,
              margin: '0 auto',
            }}
          >
            {fontsReady && (
              <Stage
                ref={stageRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                scaleX={scale}
                scaleY={scale}
                style={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
                onClick={handleStageClick}
                onTap={handleStageClick}
              >
                <Layer>
                  {/* 배경 */}
                  {images
                    .filter((img) => img.type === 'background')
                    .map((img) =>
                      loadedImages[img.id] ? (
                        <KonvaImage
                          key={img.id}
                          id={img.id}
                          image={loadedImages[img.id]}
                          x={img.x}
                          y={img.y}
                          width={img.width}
                          height={img.height}
                        />
                      ) : null,
                    )}

                  {/* 인물 */}
                  {images
                    .filter((img) => img.type === 'person')
                    .map((img) =>
                      loadedImages[img.id] ? (
                        <KonvaImage
                          key={img.id}
                          id={img.id}
                          image={loadedImages[img.id]}
                          x={img.x}
                          y={img.y}
                          width={img.width}
                          height={img.height}
                          draggable
                          onClick={() => setSelectedId(img.id)}
                          onTap={() => setSelectedId(img.id)}
                          onDragEnd={(e: any) => {
                            setImages((prev) =>
                              prev.map((i) =>
                                i.id === img.id ? { ...i, x: e.target.x(), y: e.target.y() } : i,
                              ),
                            );
                          }}
                          onTransformEnd={(e: any) => {
                            const node = e.target;
                            setImages((prev) =>
                              prev.map((i) =>
                                i.id === img.id
                                  ? {
                                      ...i,
                                      x: node.x(),
                                      y: node.y(),
                                      width: Math.max(20, node.width() * node.scaleX()),
                                      height: Math.max(20, node.height() * node.scaleY()),
                                    }
                                  : i,
                              ),
                            );
                            node.scaleX(1);
                            node.scaleY(1);
                          }}
                        />
                      ) : null,
                    )}

                  {/* 텍스트 */}
                  {texts.map((t) => (
                    <Text
                      key={t.id}
                      id={t.id}
                      text={t.text}
                      x={t.x}
                      y={t.y}
                      fontSize={t.fontSize}
                      fontFamily={t.fontFamily}
                      fill={t.fill}
                      stroke={t.stroke}
                      strokeWidth={t.strokeWidth}
                      draggable
                      onClick={() => setSelectedId(t.id)}
                      onTap={() => setSelectedId(t.id)}
                      onDragEnd={(e: any) => {
                        setTexts((prev) =>
                          prev.map((item) =>
                            item.id === t.id ? { ...item, x: e.target.x(), y: e.target.y() } : item,
                          ),
                        );
                      }}
                    />
                  ))}

                  {/* 트랜스포머 */}
                  <Transformer ref={transformerRef} />
                </Layer>
              </Stage>
            )}
          </div>
        </div>

        {/* 우측 텍스트 편집 패널 */}
        {selectedText && (
          <div className="w-64 space-y-3 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h3 className="text-sm font-bold text-gray-300">텍스트 편집</h3>

            <div>
              <label className="block text-xs text-gray-400 mb-1">내용</label>
              <input
                type="text"
                value={editText}
                onChange={(e) => {
                  setEditText(e.target.value);
                  updateSelectedText({ text: e.target.value });
                }}
                className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">폰트</label>
              <select
                value={editFontFamily}
                onChange={(e) => {
                  setEditFontFamily(e.target.value);
                  updateSelectedText({ fontFamily: e.target.value });
                }}
                className="w-full bg-gray-900 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                크기: {editFontSize}px
              </label>
              <input
                type="range"
                min={20}
                max={200}
                value={editFontSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEditFontSize(val);
                  updateSelectedText({ fontSize: val });
                }}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">글자 색</label>
                <input
                  type="color"
                  value={editFill}
                  onChange={(e) => {
                    setEditFill(e.target.value);
                    updateSelectedText({ fill: e.target.value });
                  }}
                  className="w-full h-8 bg-gray-900 rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">테두리 색</label>
                <input
                  type="color"
                  value={editStroke}
                  onChange={(e) => {
                    setEditStroke(e.target.value);
                    updateSelectedText({ stroke: e.target.value });
                  }}
                  className="w-full h-8 bg-gray-900 rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                테두리 두께: {editStrokeWidth}
              </label>
              <input
                type="range"
                min={0}
                max={10}
                value={editStrokeWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEditStrokeWidth(val);
                  updateSelectedText({ strokeWidth: val });
                }}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 안내 텍스트 */}
      {images.length === 0 && texts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">👆 위 버튼으로 인물 사진과 텍스트를 추가하세요</p>
          <p className="text-sm mt-2">
            AI 배경이 자동으로 로드됩니다. 인물 사진을 올리면 배경이 자동 제거됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
