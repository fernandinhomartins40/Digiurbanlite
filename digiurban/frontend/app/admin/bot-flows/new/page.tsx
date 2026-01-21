'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import FlowEditor from '@/components/admin/FlowEditor/FlowEditor';

export default function NewFlowPage() {
  const router = useRouter();

  const handleSave = async (data: any) => {
    const response = await fetch('/api/admin/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar fluxo');
    }

    router.push('/admin/bot-flows');
  };

  const handleCancel = () => {
    router.push('/admin/bot-flows');
  };

  return (
    <div className="p-6">
      <FlowEditor onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
