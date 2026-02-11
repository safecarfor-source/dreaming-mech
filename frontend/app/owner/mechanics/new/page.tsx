'use client';

import OwnerLayout from '@/components/owner/OwnerLayout';
import MechanicForm from '@/components/admin/MechanicForm';

export default function OwnerNewMechanicPage() {
  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">매장 등록</h1>
        <MechanicForm
          mode="create"
          apiBasePath="/owner/mechanics"
          redirectPath="/owner/mechanics"
        />
      </div>
    </OwnerLayout>
  );
}
