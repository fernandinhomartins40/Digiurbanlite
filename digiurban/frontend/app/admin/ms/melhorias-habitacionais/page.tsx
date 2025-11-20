import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function MelhoriasHabitacionaisPage() {
  const config = allMSConfigs['melhorias-habitacionais'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: melhorias-habitacionais
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
