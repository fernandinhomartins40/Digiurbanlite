'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
  selected?: string;
}

export function SearchableSelect({
  options,
  onSelect,
  placeholder = 'Digite para buscar...',
  selected,
}: SearchableSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(selected);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtra opções baseado na busca
  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(search.toLowerCase()) ||
      option.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
    setSearch('');
    onSelect(value);
  };

  const selectedOption = options.find(o => o.value === selectedValue);

  return (
    <div ref={dropdownRef} className="w-full min-w-0 max-w-full sm:max-w-md mx-auto relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : selectedOption?.label || ''}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full min-w-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto overflow-x-hidden">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-center text-gray-500">
              Nenhum resultado encontrado
            </div>
          ) : (
            filteredOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0
                  ${option.value === selectedValue ? 'bg-blue-50' : ''}
                `}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 break-words [overflow-wrap:anywhere]">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-sm text-gray-600 mt-1 break-words [overflow-wrap:anywhere]">
                        {option.description}
                      </div>
                    )}
                  </div>

                  {option.value === selectedValue && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected display */}
      {selectedOption && !isOpen && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium text-blue-900">
                Selecionado:
              </div>
              <div className="text-sm text-blue-700 break-words [overflow-wrap:anywhere]">{selectedOption.label}</div>
            </div>
            <Check className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
