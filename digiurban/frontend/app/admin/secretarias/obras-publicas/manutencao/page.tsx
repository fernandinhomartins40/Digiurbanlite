'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { ProtocolBadge } from '@/components/admin/ProtocolBadge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SourceIndicator } from '@/components/admin/SourceIndicator';
import { ApprovalActions } from '@/components/admin/ApprovalActions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';

interface Manuteno {
  id: string;
  protocol: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  source: 'service' | 'manual' | 'import';
  createdAt: string;
}

export default function ManutenoPage() {
  const [data, setData] = useState<Manuteno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const limit = 10;

  useEffect(() => {
    fetchData();
  }, [page, search, statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call
      const mockData: Manuteno[] = [];
      setData(mockData);
      setTotal(mockData.length);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, notes?: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    fetchData();
  };

  const handleReject = async (id: string, reason: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    fetchData();
  };

  const columns = [
    {
      header: 'Protocolo',
      accessor: (row: Manuteno) => <ProtocolBadge protocol={row.protocol} />
    },
    {
      header: 'Descrição',
      accessor: 'description' as keyof Manuteno
    },
    {
      header: 'Status',
      accessor: (row: Manuteno) => <StatusBadge status={row.status} />
    },
    {
      header: 'Origem',
      accessor: (row: Manuteno) => <SourceIndicator source={row.source} />
    },
    {
      header: 'Data',
      accessor: (row: Manuteno) => new Date(row.createdAt).toLocaleDateString('pt-BR')
    },
    {
      header: 'Ações',
      accessor: (row: Manuteno) => (
        row.status === 'pending' ? (
          <ApprovalActions
            itemId={row.id}
            itemType="Manutenção"
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : null
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manutenção</h1>
          <p className="text-muted-foreground">Gerenciar manutenção</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={data}
        columns={columns}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage
        }}
        isLoading={isLoading}
        emptyMessage="Nenhum registro encontrado"
      />
    </div>
  );
}
