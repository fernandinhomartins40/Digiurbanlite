'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRelationshipLabel, getRelationshipEmoji } from '@/shared/constants/family.constants'

interface FamilyMember {
  id: string
  relationship: string
  isDependent: boolean
  member: {
    id: string
    name: string
    cpf: string
    birthDate?: string
  }
}

interface FamilyTreeDiagramProps {
  head: {
    id: string
    name: string
    cpf: string
    birthDate?: string
  }
  members: FamilyMember[]
}

export function FamilyTreeDiagram({ head, members }: FamilyTreeDiagramProps) {
  // Organizar membros por tipo de relacionamento
  const spouse = members.find(m => m.relationship === 'SPOUSE')
  const parents = members.filter(m => m.relationship === 'FATHER' || m.relationship === 'MOTHER')
  const grandparents = members.filter(m =>
    m.relationship === 'GRANDFATHER' || m.relationship === 'GRANDMOTHER'
  )
  const children = members.filter(m => m.relationship === 'SON' || m.relationship === 'DAUGHTER')
  const siblings = members.filter(m => m.relationship === 'BROTHER' || m.relationship === 'SISTER')
  const grandchildren = members.filter(m =>
    m.relationship === 'GRANDSON' || m.relationship === 'GRANDDAUGHTER'
  )
  const others = members.filter(m => m.relationship === 'OTHER')

  const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return ''
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return `${age} anos`
  }

  const PersonCard = ({ person, relationship, isHead = false }: {
    person: any
    relationship?: string
    isHead?: boolean
  }) => (
    <div className={`
      relative p-3 rounded-lg border-2 text-center min-w-[140px]
      ${isHead
        ? 'bg-blue-50 border-blue-400 shadow-md'
        : 'bg-white border-gray-300 hover:border-blue-300 transition-colors'
      }
    `}>
      {isHead && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white text-xs">Responsável</Badge>
        </div>
      )}

      <div className="text-2xl mb-1">
        {relationship ? getRelationshipEmoji(relationship) : '👑'}
      </div>

      <div className="font-semibold text-sm text-gray-900 mb-0.5 truncate">
        {person.name}
      </div>

      {relationship && (
        <div className="text-xs text-gray-600 mb-1">
          {getRelationshipLabel(relationship)}
        </div>
      )}

      {person.birthDate && (
        <div className="text-xs text-gray-500">
          {calculateAge(person.birthDate)}
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Árvore Genealógica</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8 overflow-x-auto pb-4">
          {/* Avós */}
          {grandparents.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-3 font-medium">Avós</div>
              <div className="flex gap-4 justify-center flex-wrap">
                {grandparents.map(gp => (
                  <PersonCard
                    key={gp.id}
                    person={gp.member}
                    relationship={gp.relationship}
                  />
                ))}
              </div>
              <div className="h-8 flex justify-center">
                <div className="w-0.5 h-full bg-gray-300"></div>
              </div>
            </div>
          )}

          {/* Pais */}
          {parents.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-3 font-medium">Pais</div>
              <div className="flex gap-4 justify-center flex-wrap">
                {parents.map(parent => (
                  <PersonCard
                    key={parent.id}
                    person={parent.member}
                    relationship={parent.relationship}
                  />
                ))}
              </div>
              <div className="h-8 flex justify-center">
                <div className="w-0.5 h-full bg-gray-300"></div>
              </div>
            </div>
          )}

          {/* Responsável e Cônjuge */}
          <div>
            <div className="text-xs text-gray-500 mb-3 font-medium">Núcleo Familiar</div>
            <div className="flex gap-8 justify-center items-center flex-wrap">
              <PersonCard person={head} isHead />

              {spouse && (
                <>
                  <div className="text-2xl text-gray-400">💕</div>
                  <PersonCard
                    person={spouse.member}
                    relationship={spouse.relationship}
                  />
                </>
              )}
            </div>
          </div>

          {/* Filhos */}
          {children.length > 0 && (
            <div>
              <div className="h-8 flex justify-center">
                <div className="w-0.5 h-full bg-gray-300"></div>
              </div>
              <div className="text-xs text-gray-500 mb-3 font-medium">Filhos</div>
              <div className="flex gap-4 justify-center flex-wrap">
                {children.map(child => (
                  <PersonCard
                    key={child.id}
                    person={child.member}
                    relationship={child.relationship}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Netos */}
          {grandchildren.length > 0 && (
            <div>
              <div className="h-8 flex justify-center">
                <div className="w-0.5 h-full bg-gray-300"></div>
              </div>
              <div className="text-xs text-gray-500 mb-3 font-medium">Netos</div>
              <div className="flex gap-4 justify-center flex-wrap">
                {grandchildren.map(gc => (
                  <PersonCard
                    key={gc.id}
                    person={gc.member}
                    relationship={gc.relationship}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Irmãos */}
          {siblings.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-3 font-medium">Irmãos</div>
              <div className="flex gap-4 justify-center flex-wrap">
                {siblings.map(sibling => (
                  <PersonCard
                    key={sibling.id}
                    person={sibling.member}
                    relationship={sibling.relationship}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Outros */}
          {others.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-3 font-medium">Outros</div>
              <div className="flex gap-4 justify-center flex-wrap">
                {others.map(other => (
                  <PersonCard
                    key={other.id}
                    person={other.member}
                    relationship={other.relationship}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Adicione membros para visualizar a árvore genealógica</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
