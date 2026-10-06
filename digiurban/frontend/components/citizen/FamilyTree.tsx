'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Heart, Baby, User, Users } from 'lucide-react';

interface FamilyMember {
  id: string;
  relationship: string;
  isDependent: boolean;
  // Novos campos Sprint 2
  monthlyIncome?: number | null;
  occupation?: string | null;
  education?: string | null;
  hasDisability?: boolean | null;
  member: {
    id: string;
    cpf: string;
    name: string;
    email: string;
    phone?: string;
    birthDate?: string;
    isActive: boolean;
  };
}

interface FamilyHead {
  id: string;
  cpf: string;
  name: string;
  email: string;
  phone?: string;
  address?: any;
}

interface FamilyTreeProps {
  family: {
    head: FamilyHead;
    members: FamilyMember[];
    memberOf: any[];
  };
  onAddMember?: () => void;
  onEditMember?: (memberId: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onViewMember?: (memberId: string) => void;
}

export function FamilyTree({
  family,
  onAddMember,
  onEditMember,
  onRemoveMember,
  onViewMember
}: FamilyTreeProps) {
  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      'SPOUSE': 'Cônjuge',
      'SON': 'Filho',
      'DAUGHTER': 'Filha',
      'FATHER': 'Pai',
      'MOTHER': 'Mãe',
      'BROTHER': 'Irmão',
      'SISTER': 'Irmã',
      'GRANDFATHER': 'Avô',
      'GRANDMOTHER': 'Avó',
      'GRANDSON': 'Neto',
      'GRANDDAUGHTER': 'Neta',
      'OTHER': 'Outro',
      'HEAD': 'Responsável',
    };
    return labels[relationship] || relationship;
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'SPOUSE':
        return <Heart className="h-6 w-6 text-pink-500" />;
      case 'SON':
      case 'DAUGHTER':
        return <Baby className="h-6 w-6 text-blue-500" />;
      case 'FATHER':
      case 'MOTHER':
        return <User className="h-6 w-6 text-indigo-500" />;
      case 'BROTHER':
      case 'SISTER':
        return <Users className="h-6 w-6 text-teal-500" />;
      case 'GRANDFATHER':
      case 'GRANDMOTHER':
        return <User className="h-6 w-6 text-amber-600" />;
      case 'GRANDSON':
      case 'GRANDDAUGHTER':
        return <Baby className="h-6 w-6 text-green-500" />;
      default:
        return <User className="h-6 w-6 text-gray-500" />;
    }
  };

  const calculateAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const describe = (familyMember: FamilyMember) => {
    const age = calculateAge(familyMember?.member?.birthDate);
    return [
      getRelationshipLabel(familyMember.relationship),
      age !== null ? `${age} ano${age === 1 ? '' : 's'}` : null,
      familyMember.isDependent ? 'dependente' : null,
      familyMember.hasDisability ? 'PcD' : null,
    ]
      .filter(Boolean)
      .join(' · ');
  };

  // Uma lista só: você (responsável) e cada pessoa da casa. Antes: quadro grande
  // do responsável, botão "Adicionar" repetido e detalhes escondidos atrás de ▶.
  return (
    <div className="space-y-5">
      <ul className="divide-y overflow-hidden rounded-2xl border bg-white">
        <li className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{family.head.name}</p>
            <p className="text-sm text-gray-500">Você · responsável pela família</p>
          </div>
        </li>

        {family.members.map((familyMember) => (
          <li key={familyMember.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 [&>svg]:h-5 [&>svg]:w-5">
              {getRelationshipIcon(familyMember.relationship)}
            </div>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => (onViewMember && familyMember?.member?.id ? onViewMember(familyMember.member.id) : onEditMember?.(familyMember.id))}
            >
              <p className="truncate font-medium text-gray-900">{familyMember?.member?.name || 'Nome não disponível'}</p>
              <p className="truncate text-sm text-gray-500">{describe(familyMember)}</p>
            </button>
            {onEditMember && (
              <Button variant="ghost" size="icon" aria-label={`Editar ${familyMember?.member?.name || ''}`} onClick={() => onEditMember(familyMember.id)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onRemoveMember && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${familyMember?.member?.name || ''}`}
                onClick={() => onRemoveMember(familyMember.id)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {family.members.length === 0 && (
        <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-gray-500">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          Ninguém foi adicionado ainda.
          {onAddMember && (
            <button type="button" onClick={onAddMember} className="ml-1 font-medium text-blue-600 hover:underline">
              Adicionar pessoa
            </button>
          )}
        </div>
      )}

      {(family.memberOf?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h3 className="px-1 text-sm font-semibold text-gray-700">Você também faz parte de</h3>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-white">
            {family.memberOf.map((relation) => (
              <li key={relation.id} className="px-4 py-3">
                <p className="font-medium text-gray-900">Família de {relation?.head?.name || '—'}</p>
                <p className="text-sm text-gray-500">Você é {getRelationshipLabel(relation.relationship).toLowerCase()} nesta família</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function FamilyTreeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Responsável */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Membros */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}