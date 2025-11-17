'use client'

/**
 * EXEMPLO DE INTEGRAÇÃO - CitizenLinkSelector em Formulários de Serviço
 *
 * Este arquivo demonstra como integrar o sistema de citizen links
 * em formulários de criação de protocolos de serviços.
 *
 * NÃO é um componente de produção - apenas referência!
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CitizenLinkSelector, CitizenLink } from '@/components/forms/CitizenLinkSelector'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

// ============================================================================
// EXEMPLO 1: Matrícula Escolar - Vínculo de Estudantes
// ============================================================================
export function ExampleSchoolEnrollment() {
  const [students, setStudents] = useState<CitizenLink[]>([])
  const currentCitizenId = 'current-citizen-id' // ID do responsável logado

  const handleSubmit = async () => {
    const protocolData = {
      serviceId: 'school-enrollment-service-id',
      citizenId: currentCitizenId,
      title: 'Matrícula Escolar',
      customData: {
        escola: 'E.M. João Silva',
        ano: '2024'
      },
      // Incluir citizen links no protocolo
      citizenLinks: students.map(student => ({
        linkedCitizenId: student.linkedCitizenId,
        linkType: student.linkType,
        role: student.role,
        contextData: student.contextData
      }))
    }

    // Enviar para API
    const response = await fetch('/api/admin/protocols', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(protocolData)
    })

    if (response.ok) {
      console.log('Protocolo criado com sucesso!')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matrícula Escolar - Exemplo de Integração</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Este é um exemplo de como integrar o CitizenLinkSelector em um
            formulário de matrícula escolar.
          </AlertDescription>
        </Alert>

        <div>
          <h3 className="font-semibold mb-2">Selecione os Alunos para Matrícula</h3>
          <CitizenLinkSelector
            citizenId={currentCitizenId}
            linkType="STUDENT"
            role="BENEFICIARY"
            multiple={true}
            selectedLinks={students}
            onLinkSelect={(link) => {
              setStudents([...students, link])
            }}
            onLinkRemove={(link) => {
              setStudents(students.filter(s => s.id !== link.id))
            }}
            contextFields={[
              {
                name: 'serie',
                label: 'Série',
                type: 'select',
                options: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano'],
                required: true
              },
              {
                name: 'turno',
                label: 'Turno',
                type: 'select',
                options: ['Manhã', 'Tarde', 'Noite'],
                required: true
              },
              {
                name: 'transporte',
                label: 'Necessita Transporte Escolar?',
                type: 'select',
                options: ['Sim', 'Não'],
                required: true
              }
            ]}
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSubmit} disabled={students.length === 0}>
            Finalizar Matrícula ({students.length} aluno(s))
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// EXEMPLO 2: Agendamento de Consulta - Vínculo de Paciente e Acompanhante
// ============================================================================
export function ExampleMedicalAppointment() {
  const [patient, setPatient] = useState<CitizenLink | null>(null)
  const [companion, setCompanion] = useState<CitizenLink | null>(null)
  const currentCitizenId = 'current-citizen-id'

  const handleSubmit = async () => {
    const links = []
    if (patient) links.push(patient)
    if (companion) links.push(companion)

    const protocolData = {
      serviceId: 'medical-appointment-service-id',
      citizenId: currentCitizenId,
      title: 'Agendamento de Consulta',
      customData: {
        especialidade: 'Cardiologia',
        data: '2024-12-01'
      },
      citizenLinks: links.map(link => ({
        linkedCitizenId: link.linkedCitizenId,
        linkType: link.linkType,
        role: link.role,
        contextData: link.contextData
      }))
    }

    console.log('Submitting:', protocolData)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <CitizenLinkSelector
            citizenId={currentCitizenId}
            linkType="PATIENT"
            role="BENEFICIARY"
            multiple={false}
            selectedLinks={patient ? [patient] : []}
            onLinkSelect={(link) => setPatient(link)}
            onLinkRemove={() => setPatient(null)}
            contextFields={[
              {
                name: 'convenio',
                label: 'Convênio',
                type: 'select',
                options: ['SUS', 'Particular', 'Plano de Saúde'],
                required: true
              },
              {
                name: 'prioridade',
                label: 'Prioridade',
                type: 'select',
                options: ['Normal', 'Alta', 'Urgente'],
                required: false
              }
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acompanhante (Opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <CitizenLinkSelector
            citizenId={currentCitizenId}
            linkType="COMPANION"
            role="COMPANION"
            multiple={false}
            selectedLinks={companion ? [companion] : []}
            onLinkSelect={(link) => setCompanion(link)}
            onLinkRemove={() => setCompanion(null)}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={!patient}>
        Agendar Consulta
      </Button>
    </div>
  )
}

// ============================================================================
// EXEMPLO 3: Cadastro em Programa Social - Beneficiários e Responsável
// ============================================================================
export function ExampleSocialProgram() {
  const [beneficiaries, setBeneficiaries] = useState<CitizenLink[]>([])
  const [responsible, setResponsible] = useState<CitizenLink | null>(null)
  const currentCitizenId = 'current-citizen-id'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Beneficiários do Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <CitizenLinkSelector
            citizenId={currentCitizenId}
            linkType="BENEFICIARY"
            role="BENEFICIARY"
            multiple={true}
            selectedLinks={beneficiaries}
            onLinkSelect={(link) => setBeneficiaries([...beneficiaries, link])}
            onLinkRemove={(link) => {
              setBeneficiaries(beneficiaries.filter(b => b.id !== link.id))
            }}
            contextFields={[
              {
                name: 'rendaFamiliar',
                label: 'Renda Familiar (R$)',
                type: 'number',
                required: true
              },
              {
                name: 'necessidadeEspecial',
                label: 'Necessidade Especial',
                type: 'select',
                options: ['Não possui', 'Física', 'Visual', 'Auditiva', 'Intelectual', 'Múltipla'],
                required: false
              }
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsável Legal</CardTitle>
        </CardHeader>
        <CardContent>
          <CitizenLinkSelector
            citizenId={currentCitizenId}
            linkType="GUARDIAN"
            role="RESPONSIBLE"
            multiple={false}
            selectedLinks={responsible ? [responsible] : []}
            onLinkSelect={(link) => setResponsible(link)}
            onLinkRemove={() => setResponsible(null)}
          />
        </CardContent>
      </Card>

      <Button disabled={beneficiaries.length === 0 || !responsible}>
        Cadastrar no Programa ({beneficiaries.length} beneficiário(s))
      </Button>
    </div>
  )
}

// ============================================================================
// EXEMPLO 4: Integração com JSON Schema Form
// ============================================================================
export function ExampleJSONSchemaIntegration() {
  const [formData, setFormData] = useState<any>({})
  const [citizenLinks, setCitizenLinks] = useState<CitizenLink[]>([])

  // Schema do serviço (vindo da API)
  const serviceSchema = {
    type: 'object',
    properties: {
      nomeEvento: { type: 'string', title: 'Nome do Evento' },
      dataEvento: { type: 'string', format: 'date', title: 'Data' },
      // ... outros campos
    }
  }

  const handleSubmit = () => {
    const protocolData = {
      serviceId: 'service-id',
      customData: formData,
      citizenLinks: citizenLinks.map(link => ({
        linkedCitizenId: link.linkedCitizenId,
        linkType: link.linkType,
        role: link.role,
        contextData: link.contextData
      }))
    }
    console.log('Protocol data:', protocolData)
  }

  return (
    <div className="space-y-4">
      {/* Formulário principal do serviço */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Aqui viria o JSONSchemaForm */}
          <div className="text-muted-foreground">
            [JSON Schema Form renderizado aqui]
          </div>
        </CardContent>
      </Card>

      {/* Seção de citizen links */}
      <Card>
        <CardHeader>
          <CardTitle>Cidadãos Vinculados</CardTitle>
        </CardHeader>
        <CardContent>
          <CitizenLinkSelector
            citizenId="current-citizen-id"
            linkType="FAMILY_MEMBER"
            role="BENEFICIARY"
            multiple={true}
            selectedLinks={citizenLinks}
            onLinkSelect={(link) => setCitizenLinks([...citizenLinks, link])}
            onLinkRemove={(link) => {
              setCitizenLinks(citizenLinks.filter(l => l.id !== link.id))
            }}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit}>
        Criar Protocolo
      </Button>
    </div>
  )
}

// ============================================================================
// EXEMPLO 5: Uso Programático do Hook
// ============================================================================
export function ExampleProgrammaticUsage() {
  const protocolId = 'existing-protocol-id'

  // Este exemplo mostra como usar o hook diretamente
  // para gerenciar links após a criação do protocolo

  /*
  import { useCitizenLinks } from '@/hooks/useCitizenLinks'

  const {
    links,
    loading,
    error,
    addLink,
    updateLink,
    verifyLink,
    removeLink,
    getLinksByType
  } = useCitizenLinks({ protocolId })

  // Carregar links automaticamente
  useEffect(() => {
    loadLinks(protocolId)
  }, [protocolId])

  // Adicionar link programaticamente
  const addStudent = async () => {
    await addLink({
      linkedCitizenId: 'student-id',
      linkType: 'STUDENT',
      role: 'BENEFICIARY',
      contextData: { serie: '5º ano', turno: 'Manhã' }
    })
  }

  // Filtrar por tipo
  const students = getLinksByType('STUDENT')
  const guardians = getLinksByType('GUARDIAN')

  // Verificar link
  const handleVerify = async (linkId: string) => {
    await verifyLink(linkId)
  }

  // Atualizar link
  const handleUpdate = async (linkId: string) => {
    await updateLink(linkId, {
      linkType: 'GUARDIAN',
      role: 'RESPONSIBLE',
      contextData: { grauParentesco: 'Mãe' }
    })
  }

  // Remover link
  const handleRemove = async (linkId: string) => {
    await removeLink(linkId)
  }
  */

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso Programático - Ver Código Fonte</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Veja o código fonte deste componente para exemplos de uso
          programático do hook useCitizenLinks.
        </p>
      </CardContent>
    </Card>
  )
}
