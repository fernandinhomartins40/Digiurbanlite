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
    <div className="w-full mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {label || `Etapa ${currentStep} de ${totalSteps}`}
        </span>
        <span className="text-sm font-semibold text-blue-600">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
          <div
            key={step}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
              step < currentStep
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : step === currentStep
                ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                : 'bg-gray-300 text-gray-600'
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
