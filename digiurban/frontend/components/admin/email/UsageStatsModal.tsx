'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { BarChart3, Send, CheckCircle, XCircle, TrendingUp, Calendar, Clock } from 'lucide-react';

interface UsageStatsModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

export function UsageStatsModal({ open, onClose, accountId }: UsageStatsModalProps) {
  const { apiRequest } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (open && accountId) {
      fetchStats();
    }
  }, [open, accountId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/admin/email-accounts/${accountId}/usage`, {
        method: 'GET'
      });

      if (response?.success) {
        setStats(response.usage);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!stats) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Estatísticas de Uso
          </DialogTitle>
          <DialogDescription>
            Estatísticas detalhadas de envio de emails
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Uso do Mês Atual */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Uso do Mês Atual
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Send className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.currentMonth.totalSent}
                    </p>
                    <p className="text-sm text-gray-600">Total Enviados</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {stats.currentMonth.delivered}
                    </p>
                    <p className="text-sm text-gray-600">Entregues</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <XCircle className="w-8 h-8 text-red-600 mb-2" />
                    <p className="text-2xl font-bold text-red-600">
                      {stats.currentMonth.failed}
                    </p>
                    <p className="text-sm text-gray-600">Falhas</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.currentMonth.deliveryRate}
                    </p>
                    <p className="text-sm text-gray-600">Taxa de Entrega</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Limites */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Limites e Uso
            </h3>

            {/* Limite Diário */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Limite Diário</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.limits.usedToday} / {stats.limits.daily} ({stats.percentages.daily}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    parseFloat(stats.percentages.daily) >= 90 ? 'bg-red-600' :
                    parseFloat(stats.percentages.daily) >= 70 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, parseFloat(stats.percentages.daily))}%` }}
                />
              </div>
            </div>

            {/* Limite Mensal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Limite Mensal</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stats.limits.usedThisMonth} / {stats.limits.monthly} ({stats.percentages.monthly}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    parseFloat(stats.percentages.monthly) >= 90 ? 'bg-red-600' :
                    parseFloat(stats.percentages.monthly) >= 70 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, parseFloat(stats.percentages.monthly))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Alertas */}
          {(parseFloat(stats.percentages.daily) >= 80 || parseFloat(stats.percentages.monthly) >= 80) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Atenção:</strong> Esta conta está próxima do limite de envios.
                {parseFloat(stats.percentages.monthly) >= 90 && ' Considere aumentar os limites mensais.'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
