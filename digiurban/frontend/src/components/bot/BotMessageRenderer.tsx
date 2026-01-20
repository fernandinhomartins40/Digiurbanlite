'use client';

import React from 'react';
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

interface BotMessageRendererProps {
  message: any;
  onInteraction: (data: any) => void;
}

export function BotMessageRenderer({ message, onInteraction }: BotMessageRendererProps) {
  const { messageType, metadata } = message;

  // DEBUG: Log para verificar o que está chegando
  console.log('🔍 [BotMessageRenderer] Mensagem recebida:', {
    messageType,
    metadata,
    hasQuickReplies: !!metadata?.quickReplies,
    quickReplies: metadata?.quickReplies
  });

  // Renderiza barra de progresso se houver
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

  // Renderiza componente baseado no tipo
  const renderInteractive = () => {
    const stepType = metadata?.stepType;

    switch (stepType) {
      case 'date':
        return (
          <CalendarPicker
            onSelect={date => onInteraction(date.toISOString())}
            minDate={metadata.minDate}
            maxDate={metadata.maxDate}
          />
        );

      case 'time':
        return (
          <TimePicker
            onSelect={time => onInteraction(time)}
            availableTimes={metadata.availableTimes}
          />
        );

      case 'location':
        return (
          <LocationPicker
            onSelect={location => onInteraction(location)}
            allowCurrentLocation={metadata.allowCurrentLocation}
            allowManualAddress={metadata.allowManualAddress}
          />
        );

      case 'file_upload':
        return (
          <DocumentUploadCard
            onUpload={files => onInteraction(files)}
            accept={metadata.accept}
            maxFiles={metadata.maxFiles}
            maxSize={metadata.maxSize}
          />
        );

      case 'searchable_select':
        return (
          <SearchableSelect
            options={metadata.options || []}
            onSelect={value => onInteraction(value)}
            placeholder={metadata.placeholder}
          />
        );

      case 'selection':
      case 'multiple_choice':
        return (
          <InteractiveCard
            type={stepType === 'multiple_choice' ? 'multiple-choice' : 'single-choice'}
            question={metadata.question || 'Selecione uma opção'}
            options={metadata.options || []}
            onSelect={selected => onInteraction(selected)}
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

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {renderProgress()}

      {/* Texto da mensagem */}
      {message.content && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
        </div>
      )}

      {/* Cards */}
      {messageType === 'card' && metadata?.cards && (
        <div className="space-y-2">
          {metadata.cards.map((card: any) => (
            <MessageCard
              key={card.id}
              card={card}
              onAction={action => onInteraction(action)}
            />
          ))}
        </div>
      )}

      {/* Componente interativo */}
      {messageType === 'interactive' && renderInteractive()}

      {/* Quick Replies */}
      {metadata?.quickReplies && (
        <QuickReplies
          replies={metadata.quickReplies}
          onSelect={reply => onInteraction(reply)}
        />
      )}
    </div>
  );
}

export default BotMessageRenderer;
