'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Images, Upload, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface GallerySectionProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export default function GallerySection({ images, onImagesChange }: GallerySectionProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > 10) {
        alert('갤러리 이미지는 최대 10장까지 추가할 수 있습니다.');
        return;
      }

      setUploading(true);
      const uploadedUrls: string[] = [];

      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const response = await api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          uploadedUrls.push(response.data.url);
        }

        onImagesChange([...images, ...uploadedUrls]);
      } catch (error) {
        console.error('갤러리 이미지 업로드 실패:', error);
        alert('이미지 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    },
    [images, onImagesChange],
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 10 - images.length,
    disabled: uploading || images.length >= 10,
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Images className="text-purple-600" />
        갤러리 ({images.length}/10)
      </h2>

      {/* 업로드된 이미지 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img
                src={url}
                alt={`갤러리 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 영역 */}
      {images.length < 10 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-purple-600 bg-purple-600/5'
              : uploading
                ? 'border-gray-200 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader2 className="mx-auto mb-3 text-purple-600 animate-spin" size={36} />
              <p className="text-gray-600 text-sm">업로드 중...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto mb-3 text-gray-400" size={36} />
              <p className="text-gray-600 text-sm">
                {isDragActive
                  ? '여기에 드롭하세요'
                  : '갤러리 이미지를 드래그하거나 클릭하세요'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                여러 장 동시 업로드 가능 (최대 {10 - images.length}장)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
