'use client';

/**
 * ABA 4: Exportação Profissional
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { useModuleExport, type ExportFormat } from '@/hooks/useModuleExport';

interface ModuleExportTabProps {
  protocols: any[];
  service: any;
}

export function ModuleExportTab({ protocols, service }: ModuleExportTabProps) {
  const { exportData, isExporting } = useModuleExport(protocols, service);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const schema = service?.formSchema;
  const availableFields = Object.keys(schema?.properties || {});

  const handleExport = async () => {
    await exportData({
      format,
      selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Exportar Dados do Módulo</CardTitle>
          <CardDescription>
            Exporte {protocols.length} protocolos em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formato */}
          <div>
            <Label className="mb-3 block">Formato de Exportação</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  CSV (.csv)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <File className="h-4 w-4" />
                  JSON (.json)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campos */}
          <div>
            <Label className="mb-3 block">Campos a Exportar (opcional)</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
              {availableFields.map(fieldKey => {
                const fieldSchema = schema.properties[fieldKey];
                return (
                  <div key={fieldKey} className="flex items-center space-x-2">
                    <Checkbox
                      id={fieldKey}
                      checked={selectedFields.includes(fieldKey)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFields([...selectedFields, fieldKey]);
                        } else {
                          setSelectedFields(selectedFields.filter(f => f !== fieldKey));
                        }
                      }}
                    />
                    <Label htmlFor={fieldKey} className="cursor-pointer">
                      {fieldSchema.title || fieldKey}
                    </Label>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Deixe vazio para exportar todos os campos
            </p>
          </div>

          {/* Botão */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar Dados'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
