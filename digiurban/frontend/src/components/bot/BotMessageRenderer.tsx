'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CalendarPicker } from './CalendarPicker';
import { TimePicker } from './TimePicker';
import { ConfirmationCard } from './ConfirmationCard';
import { ProgressBar } from './ProgressBar';
import { LocationPicker } from './LocationPicker';
import { RatingCard } from './RatingCard';
import { DocumentUploadCard } from './DocumentUploadCard';
import { SearchableSelect } from './SearchableSelect';
import { MessageCard } from './MessageCard';
import { ProtocolDetailCard } from './ProtocolDetailCard';
import { InteractiveCard } from './InteractiveCard';
import { QuickReplies } from './QuickReplies';
import { FormCard } from './FormCard';
import { DepartmentCarousel } from './DepartmentCarousel';
import { ServiceCarousel } from './ServiceCarousel';
import { BotDocumentUpload } from './BotDocumentUpload';

interface BotMessageRendererProps {
  message: any;
  onInteraction: (data: any) => void;
  disabled?: boolean;
}

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 min-w-0 break-words [overflow-wrap:anywhere]">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-slate-900">{children}</strong>,
  ul: ({ children }: any) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }: any) => <li className="marker:text-slate-400 min-w-0 break-words [overflow-wrap:anywhere]">{children}</li>,
  hr: () => <hr className="my-4 border-slate-200" />,
  h1: ({ children }: any) => <h1 className="mb-3 text-lg font-semibold text-slate-900 break-words">{children}</h1>,
  h2: ({ children }: any) => <h2 className="mb-3 text-base font-semibold text-slate-900 break-words">{children}</h2>,
  h3: ({ children }: any) => <h3 className="mb-2 text-sm font-semibold text-slate-900 break-words">{children}</h3>,
  code: ({ children }: any) => <code className="text-xs bg-slate-100 px-1 rounded break-all">{children}</code>,
};

export function BotMessageRenderer({ message, onInteraction, disabled = false }: BotMessageRendererProps) {
  const metadata = message?.metadata || {};
  const messageType = message?.messageType || metadata.messageType || 'text';
  const options = Array.isArray(metadata.options) ? metadata.options : [];
  const fields = Array.isArray(metadata.fields) ? metadata.fields : [];
  const cards = Array.isArray(metadata.cards) ? metadata.cards : [];

  const renderProgress = () => {
    if (metadata?.progress && metadata?.totalSteps) {
      return (
        <ProgressBar
          currentStep={metadata.currentStepNumber || 1}
          totalSteps={metadata.totalSteps}
        />
      );
    }
    return null;
  };

  const renderLegacyInteractive = () => {
    const stepType = metadata?.stepType;

    switch (stepType) {
      case 'date':
        return (
          <CalendarPicker
            onSelect={(date) => onInteraction(date.toISOString())}
            minDate={metadata.minDate}
            maxDate={metadata.maxDate}
          />
        );
      case 'time':
        return (
          <TimePicker
            onSelect={(time) => onInteraction(time)}
            availableTimes={metadata.availableTimes}
          />
        );
      case 'location':
        return (
          <LocationPicker
            onSelect={(location) => onInteraction(location)}
            allowCurrentLocation={metadata.allowCurrentLocation}
            allowManualAddress={metadata.allowManualAddress}
          />
        );
      case 'file_upload':
        return (
          <DocumentUploadCard
            onUpload={(files) => onInteraction(files)}
            accept={metadata.accept}
            maxFiles={metadata.maxFiles}
            maxSize={metadata.maxSize}
          />
        );
      case 'searchable_select':
        return (
          <SearchableSelect
            options={metadata.options || []}
            onSelect={(value) => onInteraction(value)}
            placeholder={metadata.placeholder}
          />
        );
      case 'selection':
      case 'multiple_choice':
        return (
          <InteractiveCard
            type={stepType === 'multiple_choice' ? 'multiple-choice' : 'single-choice'}
            question={metadata.question || 'Selecione uma opcao'}
            options={metadata.options || []}
            onSelect={(selected) => onInteraction(selected)}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationCard
            data={metadata.confirmationData || {}}
            onConfirm={() => onInteraction('confirmed')}
            onCancel={() => onInteraction('cancelled')}
          />
        );
      case 'rating':
        return (
          <RatingCard
            onSubmit={(rating: number, comment?: string) => onInteraction({ rating, comment })}
            title={metadata.title}
            subtitle={metadata.subtitle}
          />
        );
      default:
        return null;
    }
  };

  const renderStructuredInput = () => {
    if (messageType === 'menu' && options.length > 0) {
      const displayMode = metadata?.displayMode;

      if (displayMode === 'department_carousel') {
        return (
          <DepartmentCarousel
            options={options}
            onSelect={(option) => onInteraction(option)}
          />
        );
      }

      if (displayMode === 'service_carousel') {
        return (
          <ServiceCarousel
            options={options}
            categories={metadata?.categories}
            departmentName={metadata?.departmentName}
            onSelect={(option) => onInteraction(option)}
          />
        );
      }

      return (
          <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((option: any) => (
            <button
              key={option.id}
              onClick={() => onInteraction(option)}
              className="group min-w-0 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors duration-200 hover:border-blue-600 hover:bg-slate-50 overflow-hidden"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 text-sm leading-snug break-words">{option.label}</div>
                  {option.description && (
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-500 line-clamp-2 break-words">
                      {option.description}
                    </div>
                  )}
                </div>
                <div className="shrink-0 mt-0.5 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 transition-colors group-hover:bg-blue-100 whitespace-nowrap max-[380px]:hidden">
                  Selecionar
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (messageType === 'card' && cards.length > 0) {
      return (
        <div className="grid w-full min-w-0 gap-3 grid-cols-1">
          {cards.map((card: any) => (
            <MessageCard
              key={card.id}
              card={card}
              onAction={(action) => onInteraction(action)}
            />
          ))}
        </div>
      );
    }

    if (messageType === 'form' && fields.length > 0) {
      return <FormCard fields={fields} onSubmit={(data) => onInteraction(data)} />;
    }

    if (messageType === 'upload') {
      const uploadConfig = metadata.uploadConfig || {};
      const requiredDocs = metadata.requiredDocuments;

      if (Array.isArray(requiredDocs) && requiredDocs.length > 0) {
        return (
          <BotDocumentUpload
            requiredDocuments={requiredDocs}
            allowSkip={uploadConfig.allowSkip !== false}
            maxFiles={uploadConfig.maxFiles || 5}
            onSubmit={(files) => onInteraction(files)}
            onSkip={() => onInteraction('pular')}
          />
        );
      }

      const accept = Array.isArray(uploadConfig.allowedTypes)
        ? uploadConfig.allowedTypes.join(',')
        : undefined;
      const maxFiles = uploadConfig.maxFiles || (uploadConfig.multiple ? 5 : 1);
      const maxSize = uploadConfig.maxFileSize
        ? uploadConfig.maxFileSize * 1024 * 1024
        : undefined;

      return (
        <DocumentUploadCard
          onUpload={(files) => onInteraction(files)}
          accept={accept}
          maxFiles={maxFiles}
          maxSize={maxSize}
          title={uploadConfig.text || 'Envie os documentos'}
        />
      );
    }

    if (messageType === 'location') {
      const locationConfig = metadata.locationConfig || {};
      return (
        <LocationPicker
          onSelect={(location) => onInteraction(location)}
          allowCurrentLocation={locationConfig.allowCurrentLocation !== false}
          allowManualAddress={locationConfig.allowManualInput !== false}
        />
      );
    }

    return null;
  };

  const structuredInput = renderStructuredInput() || (messageType === 'interactive' && renderLegacyInteractive());

  return (
    <div className="space-y-3 w-full min-w-0 max-w-full overflow-hidden">
      {renderProgress()}

      {message?.content && (
        <div className="w-full min-w-0 max-w-full rounded-lg border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm overflow-hidden">
          <div className="min-w-0 text-[15px] leading-7 text-slate-800 break-words [overflow-wrap:anywhere]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {metadata?.protocolDetailCard && (
        <ProtocolDetailCard data={metadata.protocolDetailCard} />
      )}

      {structuredInput && (
        <div className={`w-full min-w-0 max-w-full overflow-hidden ${disabled ? 'pointer-events-none opacity-60' : ''}`} aria-disabled={disabled}>
          {structuredInput}
        </div>
      )}

      {metadata?.quickReplies && (
        <QuickReplies
          replies={metadata.quickReplies}
          onSelect={(reply) => {
            if (!disabled) onInteraction(reply)
          }}
          className={disabled ? 'pointer-events-none opacity-60' : undefined}
        />
      )}
    </div>
  );
}

export default BotMessageRenderer;
