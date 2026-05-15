'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  className?: string;
}

export function QuickReplies({ replies, onSelect, className = '' }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className={`flex w-full min-w-0 max-w-full flex-col gap-2 my-2 overflow-hidden ${className}`}>
      {replies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          className="w-full min-w-0 h-auto py-2 px-3 justify-start bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 transition-all text-left overflow-hidden"
        >
          <Sparkles className="w-3 h-3 mr-2 shrink-0" />
          <span className="min-w-0 break-words [overflow-wrap:anywhere] text-xs leading-relaxed">{reply}</span>
        </Button>
      ))}
    </div>
  );
}

export default QuickReplies;
