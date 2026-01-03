'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Eye } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  variables: string[];
}

interface TemplatePreviewProps {
  template: EmailTemplate;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderedText, setRenderedText] = useState('');
  const [renderedSubject, setRenderedSubject] = useState('');

  useEffect(() => {
    // Sample data for preview
    const sampleData: Record<string, string> = {
      citizenName: 'João Silva',
      userName: 'Maria Santos',
      tenantName: 'Prefeitura Municipal de DigiUrban',
      siteName: 'Portal do Cidadão',
      siteUrl: 'https://digiurban.com.br',
      supportEmail: 'suporte@digiurban.com.br',
      protocolNumber: '2024-0001-ABC',
      serviceName: 'Solicitação de Cartão de Estacionamento',
      confirmationUrl: 'https://digiurban.com.br/confirm/abc123def456',
      recoveryUrl: 'https://digiurban.com.br/recover/xyz789',
      trackingUrl: 'https://digiurban.com.br/protocol/2024-0001-ABC',
      status: 'Em andamento',
      createdAt: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      updatedAt: new Date().toLocaleDateString('pt-BR'),
      comment: 'Documentação recebida e em análise pela equipe técnica.',
      actionUrl: 'https://digiurban.com.br/action/123',
      actionText: 'Ver Detalhes',
      notificationTitle: 'Atualização Importante',
      notificationMessage: 'Seu protocolo foi atualizado.',
      recipientName: 'João Silva',
      senderName: 'Equipe DigiUrban',
      logoUrl: 'https://digiurban.com.br/logo.png',
    };

    // Render subject
    let subject = template.subject;
    template.variables.forEach((variable) => {
      const value = sampleData[variable] || `[${variable}]`;
      subject = subject.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });
    setRenderedSubject(subject);

    // Render HTML
    let html = template.htmlContent;
    template.variables.forEach((variable) => {
      const value = sampleData[variable] || `<span style="color: red;">[${variable}]</span>`;
      html = html.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });
    setRenderedHtml(html);

    // Render text
    let text = template.textContent || '';
    template.variables.forEach((variable) => {
      const value = sampleData[variable] || `[${variable}]`;
      text = text.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });
    setRenderedText(text);
  }, [template]);

  return (
    <div className="space-y-4">
      {/* Subject Preview */}
      <div className="border rounded-md p-4 bg-muted">
        <p className="text-sm font-medium text-muted-foreground mb-1">Assunto:</p>
        <p className="text-lg font-semibold">{renderedSubject}</p>
      </div>

      {/* Content Preview */}
      <Tabs defaultValue="rendered" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rendered">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="html">
            <Code className="mr-2 h-4 w-4" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="text">Texto</TabsTrigger>
        </TabsList>

        <TabsContent value="rendered">
          <div className="border rounded-md p-6 bg-white min-h-[500px]">
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        </TabsContent>

        <TabsContent value="html">
          <div className="border rounded-md p-4 bg-slate-950 text-slate-50 overflow-auto min-h-[500px]">
            <pre className="text-sm font-mono whitespace-pre-wrap">{renderedHtml}</pre>
          </div>
        </TabsContent>

        <TabsContent value="text">
          <div className="border rounded-md p-4 bg-slate-50 overflow-auto min-h-[500px]">
            <pre className="text-sm whitespace-pre-wrap">{renderedText}</pre>
          </div>
        </TabsContent>
      </Tabs>

      {/* Variables Used */}
      <div className="border rounded-md p-4 bg-muted">
        <p className="text-sm font-medium mb-2">Variáveis utilizadas:</p>
        <div className="flex flex-wrap gap-2">
          {template.variables.map((variable) => (
            <code
              key={variable}
              className="px-2 py-1 bg-slate-900 text-slate-50 rounded text-xs"
            >
              {`{{${variable}}}`}
            </code>
          ))}
          {template.variables.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma variável detectada</p>
          )}
        </div>
      </div>
    </div>
  );
}
