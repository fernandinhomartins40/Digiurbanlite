'use client';

import React from 'react';
import { FileText, Building2, Clock, AlignLeft, Paperclip } from 'lucide-react';

interface ReviewCardData {
  service?: string | null;
  department?: string | null;
  estimatedDays?: number | null;
  description?: string | null;
  formFields?: Array<{ label: string; value: string }>;
  documentsCount?: number;
  documents?: Array<{ name: string; type?: string | null }>;
}

interface ReviewCardProps {
  data: ReviewCardData;
}

export function ReviewCard({ data }: ReviewCardProps) {
  const hasFormFields = Array.isArray(data.formFields) && data.formFields.length > 0;
  const hasDocs = (data.documentsCount ?? 0) > 0;

  return (
    <div className="w-full min-w-0 max-w-full rounded-xl border border-blue-100 bg-white shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100 px-4 py-3">
        <div className="shrink-0 rounded-lg bg-blue-100 p-1.5">
          <FileText className="h-4 w-4 text-blue-700" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Revisão da Solicitação</p>
          <p className="text-[11px] text-blue-600 mt-0.5">Verifique os dados antes de confirmar</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">

        {/* Serviço + Secretaria */}
        {(data.service || data.department) && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-2">
            {data.service && (
              <div className="flex items-start gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Serviço</p>
                  <p className="text-sm font-semibold text-slate-900 break-words mt-0.5">{data.service}</p>
                </div>
              </div>
            )}
            {data.department && (
              <div className="flex items-start gap-2 min-w-0">
                <Building2 className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Secretaria</p>
                  <p className="text-sm text-slate-700 break-words mt-0.5">{data.department}</p>
                </div>
              </div>
            )}
            {data.estimatedDays && (
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-slate-600">
                  Prazo estimado: <span className="font-semibold text-slate-800">{data.estimatedDays} dias úteis</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Descrição */}
        {data.description && (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <AlignLeft className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Descrição</p>
            </div>
            <p className="text-sm text-slate-700 break-words [overflow-wrap:anywhere] leading-relaxed pl-5">
              {data.description}
            </p>
          </div>
        )}

        {/* Campos do formulário */}
        {hasFormFields && (
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Dados Informados</p>
            <div className="space-y-0 rounded-lg border border-slate-100 overflow-hidden">
              {data.formFields!.map((field, i) => (
                <div
                  key={i}
                  className={`flex min-w-0 gap-3 px-3 py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}
                >
                  <span className="text-xs text-slate-500 shrink-0 w-[40%] break-words">{field.label}</span>
                  <span className="text-xs font-medium text-slate-800 min-w-0 break-words [overflow-wrap:anywhere] flex-1 text-right">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentos */}
        {hasDocs && (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Documentos Anexados ({data.documentsCount})
              </p>
            </div>
            <div className="space-y-1 pl-5">
              {(data.documents || []).map((doc, i) => (
                <div key={i} className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-slate-400 shrink-0">{i + 1}.</span>
                  <span className="text-xs text-slate-700 break-words [overflow-wrap:anywhere] min-w-0">{doc.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewCard;
