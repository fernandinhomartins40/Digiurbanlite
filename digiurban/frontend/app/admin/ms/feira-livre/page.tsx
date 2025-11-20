import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function FeiraLivrePage() {
  const config = allMSConfigs['feira-livre'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: feira-livre
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
