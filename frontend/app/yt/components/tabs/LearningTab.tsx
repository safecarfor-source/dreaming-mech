'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Link,
  FileText,
  Loader2,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { analyzeLearnContent } from '../../lib/api';

type InputMode = 'file' | 'url' | 'text';

interface LearningTabProps {
  projectId: string;
}

export default function LearningTab({ projectId }: LearningTabProps) {
  const [mode, setMode] = useState<InputMode>('file');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: false,
  });

  const canAnalyze = () => {
    if (mode === 'file') return !!uploadedFile;
    if (mode === 'url') return url.trim().length > 0;
    if (mode === 'text') return text.trim().length > 0;
    return false;
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    setResult('');
    setSaved(false);

    try {
      let content = '';

      if (mode === 'file' && uploadedFile) {
        content = await uploadedFile.text();
      } else if (mode === 'url') {
        content = url;
      } else {
        content = text;
      }

      const data = await analyzeLearnContent({
        type: mode,
        content,
        projectId,
      });

      setResult(data.result);
    } catch {
      setError('분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    // 저장 완료 표시 (실제 저장은 analyzeLearnContent에서 처리)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const MODES: { key: InputMode; label: string; icon: React.ReactNode }[] = [
    { key: 'file', label: '파일 업로드', icon: <Upload className="w-3.5 h-3.5" /> },
    { key: 'url', label: 'URL', icon: <Link className="w-3.5 h-3.5" /> },
    { key: 'text', label: '텍스트', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* 입력 방식 탭 */}
      <div className="flex gap-2">
        {MODES.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              mode === key
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* 입력 영역 */}
      <div>
        {mode === 'file' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-violet-500 bg-violet-500/5'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <input {...getInputProps()} />
            {uploadedFile ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-white text-sm font-medium">
                  {uploadedFile.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                  }}
                  className="text-gray-500 hover:text-gray-300 text-xs underline"
                >
                  다른 파일 선택
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                <p className="text-gray-300 text-sm">
                  {isDragActive
                    ? '여기에 놓으세요'
                    : '파일을 드래그하거나 클릭하세요'}
                </p>
                <p className="text-gray-600 text-xs">
                  HTML, TXT, 이미지 파일 지원
                </p>
              </div>
            )}
          </div>
        )}

        {mode === 'url' && (
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        )}

        {mode === 'text' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="분석할 내용을 여기에 붙여넣으세요..."
            rows={8}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed"
          />
        )}
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {/* 분석 버튼 */}
      <button
        onClick={handleAnalyze}
        disabled={analyzing || !canAnalyze()}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            분석 중...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            분석 시작
          </>
        )}
      </button>

      {/* 분석 결과 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold text-sm">분석 결과</h4>
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  saved
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-gray-800 text-gray-300 hover:text-white border border-gray-600'
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    저장됨
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    저장
                  </>
                )}
              </button>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {result}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
