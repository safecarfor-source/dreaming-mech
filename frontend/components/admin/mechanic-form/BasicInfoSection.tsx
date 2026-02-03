interface BasicInfoSectionProps {
  formData: {
    name: string;
    location: string;
    phone: string;
    description: string;
    isActive: boolean;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onActiveChange: (isActive: boolean) => void;
}

export default function BasicInfoSection({
  formData,
  onChange,
  onActiveChange,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          정비소 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
          placeholder="예: 강남 오토센터"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지역 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
            placeholder="예: 강남구"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
            placeholder="예: 02-1234-5678"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
          rows={4}
          placeholder="정비소 소개를 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
        <select
          name="isActive"
          value={formData.isActive ? 'true' : 'false'}
          onChange={(e) => onActiveChange(e.target.value === 'true')}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 text-gray-900"
        >
          <option value="true">활성</option>
          <option value="false">비활성</option>
        </select>
      </div>
    </div>
  );
}
