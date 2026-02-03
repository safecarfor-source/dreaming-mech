import { Search, MapPin } from 'lucide-react';
import EditableMap from '../EditableMap';

interface LocationSectionProps {
  formData: {
    address: string;
    mapLat: number;
    mapLng: number;
  };
  isSearching: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressSearch: () => void;
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

export default function LocationSection({
  formData,
  isSearching,
  onChange,
  onAddressSearch,
  onMarkerDragEnd,
}: LocationSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <MapPin className="text-purple-600" />
        위치 정보
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          주소 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddressSearch();
              }
            }}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
            placeholder="도로명 주소를 입력하세요 (예: 서울시 강남구 테헤란로 123)"
            required
          />
          <button
            type="button"
            onClick={onAddressSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Search size={20} />
            {isSearching ? '검색 중...' : '지도에서 찾기'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          도로명 주소를 입력하고 "지도에서 찾기"를 클릭하세요.
        </p>
      </div>

      <EditableMap
        center={{ lat: formData.mapLat, lng: formData.mapLng }}
        marker={{ lat: formData.mapLat, lng: formData.mapLng }}
        onMarkerDragEnd={onMarkerDragEnd}
      />

      <div className="bg-gray-50 p-4 rounded-xl">
        <p className="text-sm text-gray-600">
          <span className="font-medium">선택된 좌표:</span> 위도{' '}
          {Number(formData.mapLat).toFixed(6)}, 경도 {Number(formData.mapLng).toFixed(6)}
        </p>
      </div>
    </div>
  );
}
