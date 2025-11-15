# Seeds Modulares de Serviços - DigiUrban

## 📋 Visão Geral

Sistema de seeds modulares para facilitar a manutenção e organização dos serviços do DigiUrban. Cada secretaria possui seu próprio arquivo de seed independente.

## 📁 Estrutura de Arquivos

```
digiurban/backend/prisma/seeds/services/
├── types.ts                    # Tipos compartilhados (ServiceDefinition)
├── index.ts                    # Centralizador que importa todos os seeds
├── agriculture.seed.ts         # Agricultura (6 serviços)
├── culture.seed.ts             # Cultura (9 serviços)
├── education.seed.ts           # Educação (11 serviços)
├── environment.seed.ts         # Meio Ambiente (7 serviços)
├── health.seed.ts              # Saúde (8 serviços)
├── housing.seed.ts             # Habitação (7 serviços)
├── public-safety.seed.ts       # Segurança Pública (6 serviços)
├── public-services.seed.ts     # Serviços Públicos (10 serviços)
├── public-works.seed.ts        # Obras Públicas (8 serviços)
├── social.seed.ts              # Assistência Social (9 serviços)
├── sports.seed.ts              # Esportes (9 serviços)
├── tourism.seed.ts             # Turismo (15 serviços)
└── urban-planning.seed.ts      # Planejamento Urbano (9 serviços)
```

## 📊 Total de Serviços por Secretaria

| Secretaria | Arquivo | Serviços |
|------------|---------|----------|
| **Saúde** | `health.seed.ts` | 8 |
| **Educação** | `education.seed.ts` | 11 |
| **Assistência Social** | `social.seed.ts` | 9 |
| **Agricultura** | `agriculture.seed.ts` | 6 |
| **Cultura** | `culture.seed.ts` | 9 |
| **Esportes** | `sports.seed.ts` | 9 |
| **Habitação** | `housing.seed.ts` | 7 |
| **Meio Ambiente** | `environment.seed.ts` | 7 |
| **Obras Públicas** | `public-works.seed.ts` | 8 |
| **Planejamento Urbano** | `urban-planning.seed.ts` | 9 |
| **Segurança Pública** | `public-safety.seed.ts` | 6 |
| **Serviços Públicos** | `public-services.seed.ts` | 10 |
| **Turismo** | `tourism.seed.ts` | 15 |
| **TOTAL** | **13 arquivos** | **114 serviços** |

## 🚀 Como Usar

### Executar todos os seeds

```bash
npm run db:seed
```

### Executar seed antigo (backup)

```bash
# Seed consolidado
npm run db:seed:old

# Seed original
npm run db:seed:legacy
```

## 📝 Como Adicionar Novos Serviços

### 1. Editar o arquivo da secretaria correspondente

Por exemplo, para adicionar um serviço de Saúde, edite `health.seed.ts`:

```typescript
export const healthServices: ServiceDefinition[] = [
  // ... serviços existentes ...
  {
    name: 'Novo Serviço de Saúde',
    description: 'Descrição do serviço',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'NOVO_MODULO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG'],
    estimatedDays: 7,
    priority: 4,
    category: 'Categoria',
    icon: 'Icon',
    color: '#10b981',
    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        // ... outros campos
      ],
      fields: [
        {
          id: 'campo1',
          label: 'Campo 1',
          type: 'text',
          required: true
        },
        // ... outros campos
      ]
    }
  }
];
```

### 2. Executar o seed

```bash
npm run db:seed
```

## 🔧 Manutenção

### Vantagens da estrutura modular:

1. **Fácil manutenção**: Cada secretaria em um arquivo separado
2. **Organização**: Estrutura clara e intuitiva
3. **Escalabilidade**: Adicionar novos serviços é simples
4. **Versionamento**: Mudanças por secretaria são rastreáveis no git
5. **Performance**: Imports seletivos quando necessário

### Script de extração automática

Para recriar os seeds a partir do arquivo monolítico original:

```bash
python extract-services.py
```

Este script Python lê o arquivo `services-final.ts` e extrai automaticamente cada seção para seu respectivo arquivo modular.

## 📋 Códigos de Departamento

| Código | Secretaria |
|--------|-----------|
| `SAUDE` | Saúde |
| `EDUCACAO` | Educação |
| `ASSISTENCIA_SOCIAL` | Assistência Social |
| `AGRICULTURA` | Agricultura |
| `CULTURA` | Cultura |
| `ESPORTES` | Esportes |
| `HABITACAO` | Habitação |
| `MEIO_AMBIENTE` | Meio Ambiente |
| `OBRAS` | Obras Públicas ⚠️ |
| `PLANEJAMENTO` | Planejamento Urbano |
| `SEGURANCA` | Segurança Pública ⚠️ |
| `SERVICOS_PUBLICOS` | Serviços Públicos |
| `TURISMO` | Turismo |

⚠️ **Atenção**: Os departamentos `OBRAS` e `SEGURANCA` não existem no banco de dados. Os serviços relacionados serão pulados durante o seed até que os departamentos sejam criados.

## 🔄 Migração do Seed Antigo

O seed modular substitui completamente o arquivo monolítico `services-final.ts` (6001 linhas).

**Antes:**
- 1 arquivo com 6001 linhas
- Difícil de manter e navegar
- Todas as secretarias misturadas

**Depois:**
- 13 arquivos modulares
- Média de 450 linhas por arquivo
- Organização clara por secretaria
- Fácil manutenção

## 🎯 Próximos Passos

1. ✅ Seeds modulares criados (13 arquivos)
2. ✅ Script de extração automática funcionando
3. ✅ Package.json atualizado
4. ⚠️ Criar departamentos `OBRAS` e `SEGURANCA` no banco
5. ⚠️ Ajustar códigos de departamento se necessário
6. ✅ Testar seeds completos

## 📞 Suporte

Para adicionar uma nova secretaria:

1. Crie um novo arquivo `nome-secretaria.seed.ts` em `prisma/seeds/services/`
2. Exporte um array `nomeSecretariaServices: ServiceDefinition[]`
3. Adicione o import em `index.ts`
4. Adicione o spread `...nomeSecretariaServices` no array `allServices`
5. Execute `npm run db:seed`

---

**Gerado automaticamente em:** 14/11/2025
**Versão:** 1.0.0
**Total de serviços:** 114
