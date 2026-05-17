'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  userName?: string;
}

export function TypingIndicator({ userName = 'DigiBot' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start my-2 w-full min-w-0 overflow-hidden">
      <div className="bg-white border border-blue-100 rounded-lg px-4 py-3 shadow-sm w-fit max-w-[200px] overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-3 h-3 text-blue-700" />
          <span className="text-xs font-semibold text-blue-800">{userName}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
