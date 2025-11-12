'use client';

/**
 * Exemplo de página usando DynamicForm
 * Esta é a NOVA abordagem para criar formulários
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DynamicForm, { JSONSchema } from '@/components/forms/DynamicForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Schema do formulário (ATUALIZADO para usar citizenId - Fase 1)
const produtorSchema: JSONSchema = {
  type: 'object',
  title: 'Cadastro de Produtor Rural',
  description: 'Selecione um cidadão e preencha os dados específicos do produtor rural',
  properties: {
    citizenId: {
      type: 'string',
      title: 'ID do Cidadão',
      'x-component': 'CitizenAutocomplete'
    },
    tipoProdutor: {
      type: 'string',
      title: 'Tipo de Produtor',
      enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena'],
      enumNames: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena']
    },
    dap: {
      type: 'string',
      title: 'DAP (Declaração de Aptidão ao PRONAF)',
      description: 'Obrigatório para Agricultor Familiar'
    },
    areaTotalHectares: {
      type: 'number',
      title: 'Área Total (Hectares)',
      minimum: 0
    },
    principaisProducoes: {
      type: 'string',
      title: 'Principais Produções',
      widget: 'textarea',
      maxLength: 500
    },
  },
  required: ['citizenId', 'tipoProdutor']
};

export default function NovoProdutorDynamicPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsLoading(true);

    try {
      // Obter o serviço de cadastro de produtor
      const servicesResponse = await fetch('/api/services?moduleType=CADASTRO_PRODUTOR');
      const servicesData = await servicesResponse.json();

      if (!servicesData.success || servicesData.data.length === 0) {
        throw new Error('Serviço de cadastro de produtor não encontrado');
      }

      const service = servicesData.data[0];

      // Criar protocolo com o Handler Registry
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: service.id,
          formData: data
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar protocolo');
      }

      // Redirecionar para a página de detalhes do protocolo
      router.push(`/admin/protocolos/${result.data.protocol.id}`);

    } catch (error: any) {
      console.error('Erro ao criar produtor:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <Link href="/admin/secretarias/agricultura/produtores">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Produtores
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Produtor Rural</CardTitle>
          <CardDescription>
            Cadastre um novo produtor rural no sistema. Um protocolo será criado automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            schema={produtorSchema}
            onSubmit={handleSubmit}
            submitLabel="Criar Cadastro"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">✨ Usando DynamicForm</h3>
        <p className="text-sm text-blue-800">
          Esta página usa o novo componente <code className="bg-blue-100 px-1 rounded">DynamicForm</code> que:
        </p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
          <li>Gera o formulário automaticamente do JSON Schema</li>
          <li>Valida os dados com Zod</li>
          <li>Integra com o Handler Registry</li>
          <li>Reduz código em ~70%</li>
        </ul>
      </div>
    </div>
  );
}
