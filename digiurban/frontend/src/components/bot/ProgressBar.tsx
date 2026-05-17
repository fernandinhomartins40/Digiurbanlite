'use client';

import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export function ProgressBar({ currentStep, totalSteps, label }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full min-w-0 overflow-hidden mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {label || `Etapa ${currentStep} de ${totalSteps}`}
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full bg-blue-100 rounded h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-700 to-teal-600 h-2 rounded transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex flex-wrap justify-between gap-1 mt-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
          <div
            key={step}
            className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold transition-all shrink-0 ${
              step < currentStep
                ? 'bg-blue-700 text-white'
                : step === currentStep
                ? 'bg-teal-700 text-white ring-2 ring-teal-100'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {step < currentStep ? '✓' : step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgressBar;
