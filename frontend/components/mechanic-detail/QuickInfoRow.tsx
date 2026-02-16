import { Car, CreditCard } from 'lucide-react';

interface Props {
  parkingAvailable?: boolean | null;
  paymentMethods?: string[];
}

export default function QuickInfoRow({ parkingAvailable, paymentMethods }: Props) {
  const hasParking = parkingAvailable !== undefined && parkingAvailable !== null;
  const hasPayment = paymentMethods && paymentMethods.length > 0;

  if (!hasParking && !hasPayment) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {hasParking && (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Car size={16} className={parkingAvailable ? 'text-green-600' : 'text-red-500'} />
          <span>
            주차 {parkingAvailable ? '가능' : '불가'}
          </span>
        </div>
      )}
      {hasPayment && (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <CreditCard size={16} className="text-blue-500" />
          <span>{paymentMethods!.join(' · ')}</span>
        </div>
      )}
    </div>
  );
}
