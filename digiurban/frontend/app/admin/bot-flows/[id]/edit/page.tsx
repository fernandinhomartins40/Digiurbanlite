'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FlowEditor from '@/components/admin/FlowEditor/FlowEditor';
import { RefreshCw } from 'lucide-react';

export default function EditFlowPage() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;
  const [flowData, setFlowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFlowData();
  }, [flowId]);

  const loadFlowData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/flows/${flowId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar fluxo');
      }

      const data = await response.json();
      setFlowData(data.flow);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar fluxo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    const response = await fetch(`/api/admin/flows/${flowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar fluxo');
    }

    router.push('/admin/bot-flows');
  };

  const handleCancel = () => {
    router.push('/admin/bot-flows');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          <p className="font-bold">Erro ao carregar fluxo</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!flowData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p>Fluxo não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <FlowEditor
        flowId={flowId}
        initialData={flowData}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
