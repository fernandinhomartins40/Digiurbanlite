import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function DistribuicaoSementesPage() {
  const config = allMSConfigs['distribuicao-sementes'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: distribuicao-sementes
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
