'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Stethoscope,
  Syringe,
  FlaskConical,
  Activity,
  AlertTriangle,
  Pill,
  FileCheck,
  ArrowRightLeft,
  Clock,
} from 'lucide-react';
import { FolhaDeRostoPage } from './FolhaDeRostoPage';
import { ConsultaMedicaSOAPForm } from './ConsultaMedicaSOAPForm';

interface ProntuarioPageProps {
  citizenId: string;
  atendimentoId?: string;
}

export function ProntuarioPage({ citizenId, atendimentoId }: ProntuarioPageProps) {
  const [activeTab, setActiveTab] = useState('folha-rosto');

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-10 h-auto">
          <TabsTrigger value="folha-rosto" className="flex flex-col gap-1 py-2">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Folha de Rosto</span>
          </TabsTrigger>

          <TabsTrigger value="soap" className="flex flex-col gap-1 py-2">
            <Stethoscope className="h-4 w-4" />
            <span className="text-xs">SOAP</span>
          </TabsTrigger>

          <TabsTrigger value="vacinacao" className="flex flex-col gap-1 py-2">
            <Syringe className="h-4 w-4" />
            <span className="text-xs">Vacinação</span>
          </TabsTrigger>

          <TabsTrigger value="exames" className="flex flex-col gap-1 py-2">
            <FlaskConical className="h-4 w-4" />
            <span className="text-xs">Exames</span>
          </TabsTrigger>

          <TabsTrigger value="problemas" className="flex flex-col gap-1 py-2">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Problemas</span>
          </TabsTrigger>

          <TabsTrigger value="alergias" className="flex flex-col gap-1 py-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Alergias</span>
          </TabsTrigger>

          <TabsTrigger value="prescricoes" className="flex flex-col gap-1 py-2">
            <Pill className="h-4 w-4" />
            <span className="text-xs">Prescrições</span>
          </TabsTrigger>

          <TabsTrigger value="atestados" className="flex flex-col gap-1 py-2">
            <FileCheck className="h-4 w-4" />
            <span className="text-xs">Atestados</span>
          </TabsTrigger>

          <TabsTrigger value="encaminhamentos" className="flex flex-col gap-1 py-2">
            <ArrowRightLeft className="h-4 w-4" />
            <span className="text-xs">Encaminhamentos</span>
          </TabsTrigger>

          <TabsTrigger value="historico" className="flex flex-col gap-1 py-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* Folha de Rosto */}
        <TabsContent value="folha-rosto">
          <FolhaDeRostoPage citizenId={citizenId} />
        </TabsContent>

        {/* SOAP */}
        <TabsContent value="soap">
          <ConsultaMedicaSOAPForm citizenId={citizenId} atendimentoId={atendimentoId} />
        </TabsContent>

        {/* Vacinação */}
        <TabsContent value="vacinacao">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Vacinação será implementado</p>
          </div>
        </TabsContent>

        {/* Exames */}
        <TabsContent value="exames">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Exames será implementado</p>
          </div>
        </TabsContent>

        {/* Problemas/Condições */}
        <TabsContent value="problemas">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Problemas/Condições será implementado</p>
          </div>
        </TabsContent>

        {/* Alergias */}
        <TabsContent value="alergias">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Alergias será implementado</p>
          </div>
        </TabsContent>

        {/* Prescrições */}
        <TabsContent value="prescricoes">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Prescrições será implementado</p>
          </div>
        </TabsContent>

        {/* Atestados */}
        <TabsContent value="atestados">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Atestados será implementado</p>
          </div>
        </TabsContent>

        {/* Encaminhamentos */}
        <TabsContent value="encaminhamentos">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Encaminhamentos será implementado</p>
          </div>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico">
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Módulo de Histórico será implementado</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
