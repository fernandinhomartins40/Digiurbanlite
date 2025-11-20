import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function ProtecaoComunitariaPage() {
  const config = allMSConfigs['protecao-comunitaria'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: protecao-comunitaria
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
