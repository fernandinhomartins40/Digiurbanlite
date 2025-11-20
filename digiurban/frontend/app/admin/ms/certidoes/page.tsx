import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function CertidoesPage() {
  const config = allMSConfigs['certidoes'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: certidoes
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
