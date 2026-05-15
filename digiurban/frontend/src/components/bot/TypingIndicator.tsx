'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  userName?: string;
}

export function TypingIndicator({ userName = 'DigiBot' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start my-2">
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm max-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-3 h-3 text-slate-700" />
          <span className="text-xs font-semibold text-slate-700">{userName}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
