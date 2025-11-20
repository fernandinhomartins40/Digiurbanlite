import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function CasaPopularPage() {
  const config = allMSConfigs['casa-popular'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: casa-popular
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
