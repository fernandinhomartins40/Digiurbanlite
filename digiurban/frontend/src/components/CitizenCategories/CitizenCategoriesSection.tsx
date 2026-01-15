/**
 * ============================================================================
 * CITIZEN CATEGORIES SECTION COMPONENT
 * ============================================================================
 * Seção que exibe e gerencia categorias de um cidadão
 */

import React, { useState, useEffect } from 'react';
import { CitizenCategoryAssignment } from '@/types/citizen-categories';
import { getCitizenCategories } from '@/services/citizen-categories.service';
import CategoryBadge from './CategoryBadge';
import { Plus, Loader2, X } from 'lucide-react';

interface CitizenCategoriesSectionProps {
  citizenId: string;
  token: string;
  onManageCategories?: () => void;
  editable?: boolean;
  className?: string;
}

export const CitizenCategoriesSection: React.FC<CitizenCategoriesSectionProps> = ({
  citizenId,
  token,
  onManageCategories,
  editable = true,
  className = '',
}) => {
  const [categories, setCategories] = useState<CitizenCategoryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias
  useEffect(() => {
    loadCategories();
  }, [citizenId, token]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCitizenCategories(citizenId, token, true);
      setCategories(data);
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
      setError(err.message || 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="ml-2 text-gray-600">Carregando categorias...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="text-center py-8">
          <X className="mx-auto text-red-500 mb-2" size={32} />
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadCategories}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Categorias do Cidadão</h3>
          <p className="text-sm text-gray-500 mt-1">
            Categorias e classificações atribuídas a este cidadão
          </p>
        </div>
        {editable && onManageCategories && (
          <button
            onClick={onManageCategories}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Gerenciar Categorias
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Nenhuma categoria atribuída</p>
            <p className="text-gray-500 text-sm mt-1">
              As categorias são atribuídas automaticamente após aprovação de serviços
            </p>
            {editable && onManageCategories && (
              <button
                onClick={onManageCategories}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Adicionar manualmente
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((assignment) => (
                assignment.category && (
                  <CategoryBadge
                    key={assignment.id}
                    category={assignment.category}
                    size="md"
                    showIcon={true}
                  />
                )
              ))}
            </div>

            {/* Informações adicionais */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Detalhes das Categorias
              </h4>
              <div className="space-y-2">
                {categories.map((assignment) => (
                  assignment.category && (
                    <div
                      key={assignment.id}
                      className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 rounded-md p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {assignment.category.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({assignment.category.department})
                          </span>
                        </div>
                        {assignment.category.description && (
                          <p className="text-gray-600 text-xs">
                            {assignment.category.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Atribuída em:{' '}
                          {new Date(assignment.assignedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenCategoriesSection;
