'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ruralProgramsConfig } from '@/lib/module-configs/agriculture';
import { ArrowLeft, Edit, Trash2, Users, FileText, Download, CheckCircle, XCircle, Clock, Eye, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EnrollmentDetailsModal } from '@/components/admin/programs/EnrollmentDetailsModal';

export default function VisualizarProgramaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Inscrições
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<any>(null);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialogs
  const [approveDialog, setApproveDialog] = useState<any>(null);
  const [rejectDialog, setRejectDialog] = useState<any>(null);
  const [detailsDialog, setDetailsDialog] = useState<any>(null);
  const [enrollmentDetails, setEnrollmentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const apiEndpoint = ruralProgramsConfig.apiEndpoint || '/api/admin/secretarias/agricultura/programas';

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'enrollments') {
      fetchEnrollments();
    }
  }, [activeTab, statusFilter]);

  const fetchData = async () => {
    try {
      const response = await apiClient.get(`${apiEndpoint}/${id}`);

      if (!response.ok) throw new Error('Erro ao carregar dados');

      const result = await response.json();
      setData(result.data || result);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do programa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setEnrollmentsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);

      const response = await apiClient.get(`${apiEndpoint}/${id}/enrollments?${queryParams}`);
      if (!response.ok) throw new Error('Erro ao carregar inscrições');

      const result = await response.json();
      setEnrollments(result.data || []);
      setEnrollmentStats(result.stats || null);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar inscrições',
        variant: 'destructive',
      });
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este programa?')) return;

    try {
      const response = await apiClient.delete(`${apiEndpoint}/${id}`);

      if (!response.ok) throw new Error('Erro ao excluir');

      toast({
        title: 'Sucesso',
        description: 'Programa excluído com sucesso',
      });

      router.push('/admin/secretarias/agricultura/programas');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir programa',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async () => {
    if (!approveDialog) return;

    try {
      const response = await apiClient.put(
        `${apiEndpoint}/${id}/enrollments/${approveDialog.id}/approve`,
        { adminNotes }
      );

      if (!response.ok) throw new Error('Erro ao aprovar');

      toast({
        title: 'Sucesso',
        description: 'Inscrição aprovada com sucesso',
      });

      setApproveDialog(null);
      setAdminNotes('');
      fetchEnrollments();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar inscrição',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectionReason.trim()) {
      toast({
        title: 'Erro',
        description: 'Motivo da rejeição é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.put(
        `${apiEndpoint}/${id}/enrollments/${rejectDialog.id}/reject`,
        { rejectionReason, adminNotes }
      );

      if (!response.ok) throw new Error('Erro ao rejeitar');

      toast({
        title: 'Sucesso',
        description: 'Inscrição rejeitada',
      });

      setRejectDialog(null);
      setAdminNotes('');
      setRejectionReason('');
      fetchEnrollments();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar inscrição',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    window.open(`${apiEndpoint}/${id}/enrollments/export?status=${statusFilter}`, '_blank');
  };

  const handleViewDetails = async (enrollment: any) => {
    setDetailsDialog(enrollment);
    setLoadingDetails(true);

    try {
      const response = await apiClient.get(`${apiEndpoint}/${id}/enrollments/${enrollment.id}`);

      if (!response.ok) throw new Error('Erro ao carregar detalhes');

      const result = await response.json();
      setEnrollmentDetails(result.data);
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar detalhes da inscrição',
        variant: 'destructive',
      });
      setDetailsDialog(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const renderFieldValue = (field: any, value: any) => {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
      case 'select':
        const option = field.options?.find((o: any) => o.value === value);
        return option ? option.label : value;
      case 'boolean':
        return value ? 'Sim' : 'Não';
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(value);
      default:
        return value;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      PENDING: { label: 'Pendente', variant: 'secondary' },
      APPROVED: { label: 'Aprovado', variant: 'default' },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' },
      CANCELLED: { label: 'Cancelado', variant: 'outline' },
    };

    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Programa não encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="text-muted-foreground mt-1">
              {ruralProgramsConfig.displayNameSingular}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/secretarias/agricultura/programas/${id}/editar`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">
            <FileText className="h-4 w-4 mr-2" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="enrollments">
            <Users className="h-4 w-4 mr-2" />
            Inscrições
            {enrollmentStats?.pending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {enrollmentStats.pending}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Aba Informações */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Programa</CardTitle>
              <CardDescription>Dados cadastrais e informações detalhadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ruralProgramsConfig.fields
                  .filter((field) => field.showInDetails)
                  .map((field) => (
                    <div key={field.name} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </div>
                      <div className="text-base">
                        {field.name === 'status' ? (
                          <Badge variant={data[field.name] === 'ACTIVE' ? 'default' : 'secondary'}>
                            {renderFieldValue(field, data[field.name])}
                          </Badge>
                        ) : (
                          renderFieldValue(field, data[field.name])
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Metadados */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Metadados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {data.createdAt && (
                    <div>
                      <span className="text-muted-foreground">Cadastrado em:</span>{' '}
                      <span className="font-medium">
                        {new Date(data.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {data.updatedAt && (
                    <div>
                      <span className="text-muted-foreground">Última atualização:</span>{' '}
                      <span className="font-medium">
                        {new Date(data.updatedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Inscrições */}
        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Inscrições</CardTitle>
                  <CardDescription>
                    Gerencie e aprove inscrições dos cidadãos neste programa
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>

              {/* Estatísticas */}
              {enrollmentStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{enrollmentStats.total}</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-700">Pendentes</div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {enrollmentStats.pending}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700">Aprovados</div>
                    <div className="text-2xl font-bold text-green-700">
                      {enrollmentStats.approved}
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-700">Rejeitados</div>
                    <div className="text-2xl font-bold text-red-700">
                      {enrollmentStats.rejected}
                    </div>
                  </div>
                </div>
              )}

              {/* Filtros */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('PENDING')}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Pendentes
                </Button>
                <Button
                  variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('APPROVED')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aprovados
                </Button>
                <Button
                  variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('REJECTED')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejeitados
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {enrollmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma inscrição encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidato</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.applicantName || enrollment.citizen?.name}
                        </TableCell>
                        <TableCell>
                          {enrollment.applicantCpf || enrollment.citizen?.cpf}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {enrollment.applicantEmail || enrollment.citizen?.email}
                            <br />
                            {enrollment.applicantPhone || enrollment.citizen?.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{enrollment.protocol?.number}</code>
                        </TableCell>
                        <TableCell>
                          {new Date(enrollment.enrollmentDate).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(enrollment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            {enrollment.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setApproveDialog(enrollment)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setRejectDialog(enrollment)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rejeitar
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Detalhes da Inscrição */}
      <EnrollmentDetailsModal
        open={!!detailsDialog}
        enrollment={detailsDialog}
        enrollmentDetails={enrollmentDetails}
        loading={loadingDetails}
        apiEndpoint={apiEndpoint}
        programId={id}
        onClose={() => {
          setDetailsDialog(null);
          setEnrollmentDetails(null);
        }}
        onApprove={(enrollment) => {
          setApproveDialog(enrollment);
          setDetailsDialog(null);
        }}
        onReject={(enrollment) => {
          setRejectDialog(enrollment);
          setDetailsDialog(null);
        }}
        onRefresh={() => handleViewDetails(detailsDialog)}
      />

      {/* Dialog Aprovar */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Inscrição</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aprovar a inscrição de{' '}
              <strong>{approveDialog?.applicantName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione observações sobre a aprovação..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove}>Confirmar Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rejeitar */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Inscrição</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição da inscrição de{' '}
              <strong>{rejectDialog?.applicantName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documentação incompleta, não atende aos requisitos..."
                required
              />
            </div>
            <div>
              <Label>Observações Adicionais (opcional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione observações internas..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
