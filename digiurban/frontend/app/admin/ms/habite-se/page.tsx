import { MSTemplate } from '@/components/ms/MSTemplate';
import { allMSConfigs } from '@/lib/ms-configs';

export default function HabiteSePage() {
  const config = allMSConfigs['habite-se'];

  if (!config) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">
          Configuração não encontrada para: habite-se
        </h1>
      </div>
    );
  }

  return <MSTemplate config={config} />;
}
