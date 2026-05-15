'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
          className="w-full min-w-0 h-auto rounded-lg border-slate-300 bg-white py-2 px-3 justify-start text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors text-left overflow-hidden"
        >
          <ArrowRight className="w-3 h-3 mr-2 shrink-0" />
          <span className="min-w-0 break-words [overflow-wrap:anywhere] text-xs leading-relaxed">{reply}</span>
        </Button>
      ))}
    </div>
  );
}

export default QuickReplies;
