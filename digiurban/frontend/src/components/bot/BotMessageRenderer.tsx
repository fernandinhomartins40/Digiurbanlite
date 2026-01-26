'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPicker } from './CalendarPicker';
import { TimePicker } from './TimePicker';
import { ConfirmationCard } from './ConfirmationCard';
import { ProgressBar } from './ProgressBar';
import { LocationPicker } from './LocationPicker';
import { RatingCard } from './RatingCard';
import { DocumentUploadCard } from './DocumentUploadCard';
import { SearchableSelect } from './SearchableSelect';
import { MessageCard } from './MessageCard';
import { InteractiveCard } from './InteractiveCard';
import { QuickReplies } from './QuickReplies';
import { FormCard } from './FormCard';

interface BotMessageRendererProps {
  message: any;
  onInteraction: (data: any) => void;
}

export function BotMessageRenderer({ message, onInteraction }: BotMessageRendererProps) {
  const metadata = message?.metadata || {};
  const messageType = message?.messageType || metadata.messageType || 'text';
  const options = Array.isArray(metadata.options) ? metadata.options : [];
  const fields = Array.isArray(metadata.fields) ? metadata.fields : [];

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
      return (
        <div className="flex flex-col gap-2">
          {options.map((option: any) => (
            <Button
              key={option.id}
              variant="outline"
              onClick={() => onInteraction(option)}
              className="justify-start text-left"
            >
              <div>
                <div className="font-semibold">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      );
    }

    if (messageType === 'form' && fields.length > 0) {
      return <FormCard fields={fields} onSubmit={(data) => onInteraction(data)} />;
    }

    if (messageType === 'upload') {
      const uploadConfig = metadata.uploadConfig || {};
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

  return (
    <div className="space-y-3">
      {renderProgress()}

      {message?.content && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
        </div>
      )}

      {messageType === 'card' && metadata?.cards && (
        <div className="space-y-2">
          {metadata.cards.map((card: any) => (
            <MessageCard
              key={card.id}
              card={card}
              onAction={(action) => onInteraction(action)}
            />
          ))}
        </div>
      )}

      {renderStructuredInput() || (messageType === 'interactive' && renderLegacyInteractive())}

      {metadata?.quickReplies && (
        <QuickReplies
          replies={metadata.quickReplies}
          onSelect={(reply) => onInteraction(reply)}
        />
      )}
    </div>
  );
}

export default BotMessageRenderer;
