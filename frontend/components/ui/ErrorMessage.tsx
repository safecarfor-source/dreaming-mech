import { AlertCircle } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle size={48} className="text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
      <p className="text-gray-600 text-center mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
