'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FamilyMember {
  id: string;
  relationship: string;
  isDependent: boolean;
  member: {
    id: string;
    cpf: string;
    name: string;
    email: string;
    phone?: string;
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
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const toggleMemberExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedMembers);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedMembers(newExpanded);
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'cônjuge':
        return '💑';
      case 'filho':
      case 'filha':
        return '👶';
      case 'pai':
        return '👨';
      case 'mãe':
        return '👩';
      case 'irmão':
      case 'irmã':
        return '👫';
      case 'avô':
        return '👴';
      case 'avó':
        return '👵';
      case 'neto':
      case 'neta':
        return '👧';
      default:
        return '👤';
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className="space-y-6">
      {/* Responsável da Família */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👑</span>
              <div>
                <CardTitle className="text-lg">Responsável da Família</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Você é o responsável pela composição familiar
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nome:</span>
              <span className="font-medium">{family.head.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CPF:</span>
              <span className="font-medium">{formatCPF(family.head.cpf)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-medium">{family.head.email}</span>
            </div>
            {family.head.phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Telefone:</span>
                <span className="font-medium">{formatPhone(family.head.phone)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Membros da Família */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Membros da Família ({family.members.length})
          </h3>
          {onAddMember && (
            <Button onClick={onAddMember} size="sm">
              <span className="mr-2">➕</span>
              Adicionar Membro
            </Button>
          )}
        </div>

        {family.members.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <span className="text-4xl mb-4 block">👨‍👩‍👧‍👦</span>
              <p className="text-muted-foreground mb-4">
                Você ainda não adicionou nenhum membro à sua família.
              </p>
              {onAddMember && (
                <Button onClick={onAddMember} variant="outline">
                  Adicionar Primeiro Membro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {family.members.map((familyMember) => (
              <Card key={familyMember.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {getRelationshipIcon(familyMember.relationship)}
                      </span>
                      <div>
                        <CardTitle className="text-base">
                          {familyMember.member.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {familyMember.relationship}
                          {familyMember.isDependent && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Dependente
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMemberExpansion(familyMember.id)}
                    >
                      {expandedMembers.has(familyMember.id) ? '▼' : '▶'}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {expandedMembers.has(familyMember.id) && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">CPF:</span>
                        <span className="font-medium">
                          {formatCPF(familyMember.member.cpf)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{familyMember.member.email}</span>
                      </div>
                      {familyMember.member.phone && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Telefone:</span>
                          <span className="font-medium">
                            {formatPhone(familyMember.member.phone)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-medium ${
                          familyMember.member.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {familyMember.member.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {onViewMember && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewMember(familyMember.member.id)}
                        className="flex-1"
                      >
                        Ver Detalhes
                      </Button>
                    )}

                    {onEditMember && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditMember(familyMember.id)}
                      >
                        ✏️
                      </Button>
                    )}

                    {onRemoveMember && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveMember(familyMember.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Membro de outras famílias */}
      {family.memberOf.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Membro de Outras Famílias ({family.memberOf.length})
          </h3>

          <div className="space-y-2">
            {family.memberOf.map((relation) => (
              <Card key={relation.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">👥</span>
                      <div>
                        <p className="font-medium">{relation.head.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          Você é {relation.relationship} nesta família
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="text-sm font-medium">
                        {formatCPF(relation.head.cpf)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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