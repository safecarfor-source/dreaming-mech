'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Camera, Loader2, CheckCircle } from 'lucide-react';
import { quoteRequestApi, uploadApi } from '@/lib/api';

interface Props {
  mechanicId: number;
  mechanicName: string;
  onClose: () => void;
}

export default function QuoteRequestForm({ mechanicId, mechanicName, onClose }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 이미지 업로드
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > 3) {
      alert('사진은 최대 3장까지 첨부할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of acceptedFiles) {
        const response = await uploadApi.uploadImage(file);
        urls.push(response.data.url);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [images]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 3 - images.length,
    disabled: isUploading || images.length >= 3,
  });

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!customerName.trim()) return alert('이름을 입력해주세요');
    if (!customerPhone.trim()) return alert('연락처를 입력해주세요');
    if (!carModel.trim()) return alert('차종을 입력해주세요');
    if (description.trim().length < 10) return alert('증상을 10자 이상 입력해주세요');

    setIsSubmitting(true);
    try {
      await quoteRequestApi.create({
        mechanicId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        carModel: carModel.trim(),
        carYear: carYear.trim() || undefined,
        description: description.trim(),
        images: images.length > 0 ? images : undefined,
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error('견적 요청 실패:', error);
      const msg = error?.response?.data?.message;
      if (Array.isArray(msg)) {
        alert(msg.map((m: any) => m.message || m).join('\n'));
      } else {
        alert('견적 요청에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 text-center space-y-4">
        <CheckCircle size={48} className="mx-auto text-green-500" />
        <h3 className="text-xl font-bold text-gray-900">견적 요청 완료!</h3>
        <p className="text-gray-600">
          <strong>{mechanicName}</strong>에 견적 요청이 접수되었습니다.
          <br />
          정비소에서 카카오톡으로 알림을 받고 연락드릴 예정입니다.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-3 bg-[#1B4D3E] hover:bg-[#143D30] text-white rounded-xl font-medium transition-colors"
        >
          확인
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900">견적 요청</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      <p className="text-sm text-gray-500">
        <strong>{mechanicName}</strong>에 견적을 요청합니다.
      </p>

      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="홍길동"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B4D3E] text-gray-900"
        />
      </div>

      {/* 연락처 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="010-1234-5678"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B4D3E] text-gray-900"
        />
      </div>

      {/* 차종 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">차종 *</label>
        <input
          type="text"
          value={carModel}
          onChange={(e) => setCarModel(e.target.value)}
          placeholder="예: 현대 아반떼 2023"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B4D3E] text-gray-900"
        />
      </div>

      {/* 연식 (선택) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">연식 (선택)</label>
        <input
          type="text"
          value={carYear}
          onChange={(e) => setCarYear(e.target.value)}
          placeholder="예: 2023"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1B4D3E] text-gray-900"
        />
      </div>

      {/* 증상 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          증상/요청 내용 * <span className="text-gray-400 font-normal">({description.length}/1000)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="차량 증상이나 정비 요청 내용을 자세히 적어주세요 (최소 10자)"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#1B4D3E] text-gray-900"
        />
      </div>

      {/* 사진 첨부 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사진 첨부 (선택, 최대 3장)
        </label>
        <div className="flex gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 rounded-full"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <div
              {...getRootProps()}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <Loader2 size={20} className="text-gray-400 animate-spin" />
              ) : (
                <Camera size={20} className="text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 제출 버튼 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-3 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-gray-400 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            요청 중...
          </>
        ) : (
          '견적 요청하기'
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        견적 요청 시 정비소에 카카오톡 알림이 발송됩니다.
      </p>
    </div>
  );
}
