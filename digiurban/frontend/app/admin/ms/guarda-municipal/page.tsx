import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function GuardaMunicipalPage() {
  const config = allMSConfigs['guarda-municipal'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: guarda-municipal
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
