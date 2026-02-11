import { Image } from 'lucide-react';
import ImageUpload from '../ImageUpload';

interface AdditionalInfoSectionProps {
  formData: {
    mainImageUrl: string;
    youtubeUrl: string;
    youtubeLongUrl: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (url: string) => void;
}

export default function AdditionalInfoSection({
  formData,
  onChange,
  onImageUpload,
}: AdditionalInfoSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Image className="text-purple-600" />
        추가 정보
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          대표 이미지
        </label>
        <ImageUpload
          currentImage={formData.mainImageUrl}
          onUpload={onImageUpload}
        />
        {formData.mainImageUrl && (
          <p className="text-xs text-gray-500 mt-2">
            {formData.mainImageUrl}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          유튜브 숏폼 (쇼츠) URL
        </label>
        <input
          type="url"
          name="youtubeUrl"
          value={formData.youtubeUrl}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
          placeholder="https://www.youtube.com/shorts/xxxxxxx"
        />
        <p className="text-xs text-gray-400 mt-1">세로 영상 (쇼츠)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          유튜브 롱폼 (일반 영상) URL
        </label>
        <input
          type="url"
          name="youtubeLongUrl"
          value={formData.youtubeLongUrl}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
          placeholder="https://www.youtube.com/watch?v=xxxxxxx"
        />
        <p className="text-xs text-gray-400 mt-1">가로 영상 (일반 유튜브 영상)</p>
      </div>
    </div>
  );
}
