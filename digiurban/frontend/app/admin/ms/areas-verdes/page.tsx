import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function AreasVerdesPage() {
  const config = allMSConfigs['areas-verdes'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: areas-verdes
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
