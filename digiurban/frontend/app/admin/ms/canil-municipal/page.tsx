import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function CanilMunicipalPage() {
  const config = allMSConfigs['canil-municipal'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: canil-municipal
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
