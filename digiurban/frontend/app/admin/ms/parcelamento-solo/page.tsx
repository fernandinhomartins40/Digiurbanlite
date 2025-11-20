import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function ParcelamentoSoloPage() {
  const config = allMSConfigs['parcelamento-solo'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: parcelamento-solo
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
