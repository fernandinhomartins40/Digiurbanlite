# Padrão de Páginas de Secretarias

Este documento define o padrão que TODAS as páginas de secretarias devem seguir, baseado em `agricultura/page.tsx`.

## Estrutura Completa

```tsx
export default function Secretaria{Name}Page() {
  // ... hooks e estado ...

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Chamados Pendentes do Prefeito */}
      {/* Estatísticas Gerais */}
      {/* Ações Rápidas */}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1: MÓDULOS DE GESTÃO DE DADOS (COM_DADOS)                */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2: SERVIÇOS GERAIS (SEM_DADOS) - PAINEL ÚNICO            */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÕES DUPLICADAS REMOVIDAS - Agora temos apenas 2 seções:     */}
      {/* 1. Módulos COM_DADOS (acima) - painéis individuais             */}
      {/* 2. Serviços Gerais SEM_DADOS (acima) - painel agregado         */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Sugestões Inteligentes de Serviços com Dados */}
      {/* Modal de Seleção de Serviços */}
    </div>
  );
}
```

## Seções que DEVEM ser REMOVIDAS

❌ Certidões, Declarações e Documentos (com cards individuais SEM_DADOS)
❌ Serviços COM_DADOS - Com formulários e dados estruturados
❌ Serviços Disponíveis
❌ Qualquer outra listagem duplicada de serviços

## Seções que DEVEM ser MANTIDAS

✅ Header
✅ Chamados Pendentes do Prefeito
✅ Estatísticas Gerais (4 cards)
✅ Ações Rápidas (2 botões)
✅ SEÇÃO 1: Módulos de Gestão de Dados (COM_DADOS)
✅ SEÇÃO 2: Serviços Gerais (SEM_DADOS) - PAINEL ÚNICO
✅ Sugestões Inteligentes de Serviços COM_DADOS
✅ Modal de Seleção de Serviços

## Template SEÇÃO 1 - Módulos COM_DADOS

```tsx
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1: MÓDULOS DE GESTÃO DE DADOS (COM_DADOS)                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-blue-600" />
            Módulos de Gestão de Dados
          </h2>
          <p className="text-sm text-muted-foreground">
            Painéis completos com checklist, timeline e dados estruturados. Cada módulo é criado automaticamente quando você configura um serviço COM_DADOS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departmentLoading ? (
            {/* Skeletons */}
          ) : modules.length > 0 ? (
            {/* Cards dos módulos COM blue badge */}
          ) : (
            {/* Card vazio com botão "Criar Primeiro Serviço COM_DADOS" */}
          )}
        </div>
      </div>
```

## Template SEÇÃO 2 - Serviços Gerais SEM_DADOS

```tsx
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2: SERVIÇOS GERAIS (SEM_DADOS) - PAINEL ÚNICO            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-600" />
            Serviços Gerais (Certidões e Documentos)
          </h2>
          <p className="text-sm text-muted-foreground">
            Painel consolidado para gerenciar todos os serviços SEM_DADOS (certidões, declarações e documentos oficiais)
          </p>
        </div>

        {servicesLoading ? (
          {/* Skeleton único */}
        ) : services.filter((s: any) => s.serviceType === 'SEM_DADOS').length > 0 ? (
          {/* CARD ÚNICO GRANDE COM BADGE VERDE "Painel Agregado SEM_DADOS" */}
          {/* Link para /admin/secretarias/{dept}/servicos-gerais */}
        ) : (
          {/* Card vazio com botão "Criar Primeiro Serviço SEM_DADOS" */}
        )}
      </div>
```

## Checklist de Atualização

Para cada secretaria:

1. [ ] Localizar seção "Módulos Padrões" antiga
2. [ ] Substituir por SEÇÃO 1 (Módulos de Gestão de Dados)
3. [ ] Localizar seção "Certidões, Declarações e Documentos" antiga
4. [ ] Substituir por SEÇÃO 2 (Serviços Gerais - PAINEL ÚNICO)
5. [ ] Remover seção "Serviços COM_DADOS"
6. [ ] Remover seção "Serviços Disponíveis"
7. [ ] Adicionar comentário de seções removidas
8. [ ] Manter seção "Sugestões Inteligentes"
9. [ ] Verificar departmentCode em todos os botões/links

## Lista de Secretarias a Atualizar

- [x] agricultura ✅ (padrão de referência)
- [x] saude ✅
- [ ] educacao
- [ ] assistencia-social
- [ ] cultura
- [ ] esportes
- [ ] habitacao
- [ ] meio-ambiente
- [ ] obras-publicas
- [ ] planejamento-urbano
- [ ] seguranca-publica
- [ ] servicos-publicos
- [ ] turismo
