# Guia de Uso - Sistema de Citizen Links

Este guia explica como usar os componentes do sistema de citizen links (vinculação de cidadãos) em protocolos.

## Componentes Disponíveis

### 1. `useCitizenLinks` - Hook de Gerenciamento

Hook React para gerenciar citizen links de um protocolo.

**Localização:** `/hooks/useCitizenLinks.ts`

#### Exemplo de Uso

```typescript
import { useCitizenLinks } from '@/hooks/useCitizenLinks'

function MyComponent() {
  const {
    links,           // Array de links carregados
    loading,         // Estado de carregamento
    error,           // Mensagem de erro (se houver)
    loadLinks,       // Carregar links do protocolo
    addLink,         // Adicionar novo link
    updateLink,      // Atualizar link existente
    verifyLink,      // Verificar link manualmente
    removeLink,      // Remover link
    addMultipleLinks,// Adicionar múltiplos links
    getLinksByType,  // Filtrar por tipo
    getVerifiedLinks,// Obter apenas verificados
    getUnverifiedLinks // Obter não verificados
  } = useCitizenLinks({
    protocolId: 'protocol-id-here',
    autoLoad: false
  })

  // Carregar links
  useEffect(() => {
    loadLinks('protocol-id')
  }, [])

  // Adicionar link
  const handleAddLink = async () => {
    const newLink = await addLink({
      linkedCitizenId: 'citizen-id',
      linkType: 'STUDENT',
      role: 'BENEFICIARY',
      contextData: { serie: '5º ano', turno: 'Manhã' }
    })
  }

  // Verificar link
  const handleVerify = async (linkId: string) => {
    await verifyLink(linkId)
  }
}
```

### 2. `CitizenLinkSelector` - Seletor de Cidadãos

Componente para selecionar cidadãos a serem vinculados ao protocolo.

**Localização:** `/components/forms/CitizenLinkSelector.tsx`

#### Props

```typescript
interface CitizenLinkSelectorProps {
  citizenId: string              // ID do cidadão solicitante
  linkType: string               // STUDENT, GUARDIAN, COMPANION, etc
  role?: string                  // BENEFICIARY, RESPONSIBLE, etc
  onLinkSelect: (link) => void   // Callback ao selecionar
  onLinkRemove?: (link) => void  // Callback ao remover
  selectedLinks?: CitizenLink[]  // Links já selecionados
  multiple?: boolean             // Permitir múltiplos
  allowManualEntry?: boolean     // Permitir entrada manual
  contextFields?: Array<{        // Campos adicionais
    name: string
    label: string
    type: 'text' | 'number' | 'select'
    options?: string[]
    required?: boolean
  }>
}
```

#### Exemplo de Uso

```typescript
import { CitizenLinkSelector } from '@/components/forms/CitizenLinkSelector'

function ProtocolForm() {
  const [selectedStudents, setSelectedStudents] = useState([])

  return (
    <CitizenLinkSelector
      citizenId={currentCitizen.id}
      linkType="STUDENT"
      role="BENEFICIARY"
      multiple={true}
      selectedLinks={selectedStudents}
      onLinkSelect={(link) => {
        setSelectedStudents([...selectedStudents, link])
      }}
      onLinkRemove={(link) => {
        setSelectedStudents(selectedStudents.filter(l => l.id !== link.id))
      }}
      contextFields={[
        {
          name: 'serie',
          label: 'Série',
          type: 'select',
          options: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'],
          required: true
        },
        {
          name: 'turno',
          label: 'Turno',
          type: 'select',
          options: ['Manhã', 'Tarde', 'Noite'],
          required: true
        }
      ]}
    />
  )
}
```

### 3. `CitizenLinksDisplay` - Visualização de Links

Componente para exibir citizen links de um protocolo com opções de edição.

**Localização:** `/components/protocol/CitizenLinksDisplay.tsx`

#### Props

```typescript
interface CitizenLinksDisplayProps {
  protocolId: string            // ID do protocolo
  citizenLinks?: CitizenLink[]  // Links (se já carregados)
  editable?: boolean            // Permitir editar/remover
  onUpdate?: () => void         // Callback após atualização
}
```

#### Exemplo de Uso

```typescript
import { CitizenLinksDisplay } from '@/components/protocol/CitizenLinksDisplay'

// Visualização simples (apenas leitura)
<CitizenLinksDisplay
  protocolId={protocol.id}
  citizenLinks={protocol.citizenLinks}
  editable={false}
/>

// Com edição (área admin)
<CitizenLinksDisplay
  protocolId={protocol.id}
  citizenLinks={protocol.citizenLinks}
  editable={true}
  onUpdate={() => {
    // Recarregar dados do protocolo
    loadProtocolData()
  }}
/>
```

## Tipos de Links Disponíveis

```typescript
// linkType (tipo de vínculo)
type LinkType =
  | 'STUDENT'           // Aluno
  | 'GUARDIAN'          // Responsável Legal
  | 'PATIENT'           // Paciente
  | 'COMPANION'         // Acompanhante
  | 'DEPENDENT'         // Dependente
  | 'FAMILY_MEMBER'     // Membro da Família
  | 'AUTHORIZED_PERSON' // Pessoa Autorizada
  | 'BENEFICIARY'       // Beneficiário
  | 'WITNESS'           // Testemunha
  | 'OTHER'             // Outro

// role (papel no protocolo)
type Role =
  | 'BENEFICIARY'   // Beneficiário
  | 'RESPONSIBLE'   // Responsável
  | 'AUTHORIZED'    // Autorizado
  | 'COMPANION'     // Acompanhante
  | 'WITNESS'       // Testemunha
  | 'OTHER'         // Outro
```

## Integração nos Detalhes do Protocolo

Os componentes já estão integrados nas páginas de detalhes de protocolo:

### Área Admin
**Arquivo:** `/app/admin/protocolos/[id]/page.tsx`

- Nova tab "Cidadãos" no sistema de tabs
- Componente `CitizenLinksDisplay` com `editable={true}`
- Permite verificar, editar e remover links

### Área do Cidadão
**Arquivo:** `/app/cidadao/protocolos/[id]/page.tsx`

- Nova tab "Cidadãos Vinculados"
- Componente `CitizenLinksDisplay` com `editable={false}`
- Apenas visualização dos cidadãos vinculados

## Fluxo de Uso Completo

### 1. Durante a Criação do Protocolo

```typescript
// Em um formulário de serviço
const [citizenLinks, setCitizenLinks] = useState([])

// Usar CitizenLinkSelector para selecionar
<CitizenLinkSelector
  citizenId={currentUser.id}
  linkType="STUDENT"
  role="BENEFICIARY"
  onLinkSelect={(link) => setCitizenLinks([...citizenLinks, link])}
  selectedLinks={citizenLinks}
/>

// Ao submeter o protocolo
const protocolData = {
  // ... outros dados
  citizenLinks: citizenLinks.map(link => ({
    linkedCitizenId: link.linkedCitizenId,
    linkType: link.linkType,
    role: link.role,
    contextData: link.contextData
  }))
}
```

### 2. Após a Criação (Gerenciamento)

```typescript
// Na página de detalhes do protocolo
const { addLink, updateLink, verifyLink, removeLink } = useCitizenLinks()

// Adicionar novo link
await addLink({
  linkedCitizenId: 'citizen-id',
  linkType: 'COMPANION',
  role: 'COMPANION'
}, protocolId)

// Verificar vínculo
await verifyLink(linkId, protocolId)

// Atualizar vínculo
await updateLink(linkId, {
  linkType: 'GUARDIAN',
  role: 'RESPONSIBLE'
}, protocolId)

// Remover vínculo
await removeLink(linkId, protocolId)
```

## API Endpoints Utilizados

Os componentes fazem chamadas para as seguintes rotas da API:

- `GET /api/admin/protocols/:protocolId/citizen-links` - Listar links
- `POST /api/admin/protocols/:protocolId/citizen-links` - Criar link
- `PUT /api/admin/protocols/:protocolId/citizen-links/:linkId` - Atualizar link
- `POST /api/admin/protocols/:protocolId/citizen-links/:linkId/verify` - Verificar link
- `DELETE /api/admin/protocols/:protocolId/citizen-links/:linkId` - Remover link
- `GET /api/admin/citizens/:citizenId/available-for-link?linkType=X` - Buscar cidadãos disponíveis
- `GET /api/admin/citizens/search?cpf=XXX` - Buscar por CPF

## Validações e Verificação

O sistema possui validação automática de vínculos:

1. **Auto-verificação**: Links de membros da composição familiar são automaticamente verificados
2. **Verificação manual**: Administradores podem verificar links manualmente
3. **Validação de relacionamento**: O sistema valida se o relacionamento esperado está presente

## Contexto Adicional (contextData)

Use `contextData` para armazenar informações específicas do tipo de link:

```typescript
// Exemplo: Matrícula escolar
{
  linkedCitizenId: 'student-id',
  linkType: 'STUDENT',
  role: 'BENEFICIARY',
  contextData: {
    serie: '5º ano',
    turno: 'Manhã',
    escola: 'E.M. João Silva',
    numeroMatricula: '2024001234'
  }
}

// Exemplo: Consulta médica
{
  linkedCitizenId: 'patient-id',
  linkType: 'PATIENT',
  role: 'BENEFICIARY',
  contextData: {
    especialidade: 'Cardiologia',
    convenio: 'SUS',
    prioridade: 'Alta'
  }
}
```

## Tratamento de Erros

Todos os componentes e hooks incluem tratamento de erros:

```typescript
const { error, loading } = useCitizenLinks()

if (loading) {
  return <LoadingSpinner />
}

if (error) {
  return <ErrorMessage message={error} />
}
```

## Notificações (Toast)

Os hooks usam o sistema de toast para feedback ao usuário:

- ✅ Sucesso ao adicionar/atualizar/remover links
- ❌ Erros de validação ou API
- ℹ️ Informações sobre verificação de vínculos

## Próximos Passos

Para integrar o sistema de citizen links em um novo serviço:

1. Adicione o `CitizenLinkSelector` no formulário de criação do protocolo
2. Capture os links selecionados e envie junto com o protocolo
3. Os links serão exibidos automaticamente na página de detalhes
4. Use o `useCitizenLinks` hook se precisar de gerenciamento customizado
