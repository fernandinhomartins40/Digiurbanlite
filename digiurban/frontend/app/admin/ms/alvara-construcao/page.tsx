import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function AlvaraConstrucaoPage() {
  const config = allMSConfigs['alvara-construcao'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: alvara-construcao
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
