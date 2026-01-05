import { Card, CardContent } from '@/components/ui/card';
import { Mail, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface EmailQuickStatsProps {
  stats: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
  };
}

export function EmailQuickStats({ stats }: EmailQuickStatsProps) {
  const deliveryRate = stats.total > 0
    ? ((stats.delivered / stats.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Enviados</p>
              <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
            </div>
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entregues</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered.toLocaleString()}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Falharam</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed.toLocaleString()}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taxa de Entrega</p>
              <p className="text-2xl font-bold text-blue-600">{deliveryRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
