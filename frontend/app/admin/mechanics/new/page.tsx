'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import MechanicForm from '@/components/admin/MechanicForm';

export default function NewMechanicPage() {
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">정비사 추가</h1>
        <MechanicForm mode="create" />
      </div>
    </AdminLayout>
  );
}
