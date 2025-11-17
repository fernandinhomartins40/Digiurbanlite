# Coleta de CNPJs de Prefeituras Brasileiras

Este diretório contém scripts para coletar e integrar CNPJs de todas as 5.570 prefeituras brasileiras.

## Status Atual

- **Total de municípios**: 5.570
- **Com CNPJ válido**: 8 (0,14%)
- **Sem CNPJ**: 5.562 (99,86%)
- **População total**: 213.415.160 habitantes

## Scripts Disponíveis

### 1. Coleta de Capitais (COMECE POR AQUI! ⭐)

**Arquivo**: `coletar-cnpjs-capitais.js`

Script especializado para coletar CNPJs das 27 capitais brasileiras rapidamente.

**Vantagens**:
- ✅ Apenas 27 municípios
- ✅ ~25% da população brasileira
- ✅ Tempo: 5-10 minutos
- ✅ CNPJs fáceis de encontrar
- ✅ Ganho rápido de cobertura

**Como usar**:
```bash
cd digiurban/backend/src/data
node coletar-cnpjs-capitais.js
```

**Progresso salvo em**: `cnpj-coletados.json`

---

### 2. Coleta Interativa (Todos os Municípios)

**Arquivo**: `coletar-cnpjs-interativo.js`

Script interativo que abre o Google automaticamente para cada município e permite colar o CNPJ encontrado.

**Vantagens**:
- ✅ Mais confiável (você valida cada CNPJ)
- ✅ Funciona para todos os municípios
- ✅ Salva progresso automaticamente
- ✅ Pode pausar e continuar depois

**Como usar**:
```bash
cd digiurban/backend/src/data
node coletar-cnpjs-interativo.js
```

**Comandos durante a coleta**:
- Digite o CNPJ no formato `XX.XXX.XXX/XXXX-XX`
- `n` - Pular município
- `s` - Salvar e sair
- `q` - Sair sem salvar
- `Ctrl+C` - Salvar e sair

**Progresso salvo em**: `cnpj-coletados.json`

---

### 3. Validação de CNPJs

**Arquivo**: `validar-cnpjs.js`

Valida todos os CNPJs usando o algoritmo oficial da Receita Federal.

**O que faz**:
- ✅ Valida dígitos verificadores de CNPJs
- ✅ Detecta CNPJs duplicados
- ✅ Mostra cobertura por estado
- ✅ Lista maiores municípios sem CNPJ
- ✅ Identifica formatação incorreta

**Como usar**:
```bash
cd digiurban/backend/src/data
node validar-cnpjs.js
```

---

### 4. Limpeza de CNPJs Inválidos

**Arquivo**: `limpar-cnpjs-invalidos.js`

Remove CNPJs que não passam na validação.

**O que faz**:
- ✅ Remove CNPJs inválidos
- ✅ Cria backup antes de modificar
- ✅ Salva lista de CNPJs removidos

**Como usar**:
```bash
cd digiurban/backend/src/data
node limpar-cnpjs-invalidos.js
```

---

### 5. Integração de CNPJs

**Arquivo**: `integrar-cnpjs-coletados.js`

Integra os CNPJs coletados (de qualquer script) no arquivo principal `municipios-brasil.json`.

**Como usar**:
```bash
cd digiurban/backend/src/data
node integrar-cnpjs-coletados.js
```

**O que faz**:
- ✅ Lê `cnpj-coletados.json` ou `cnpj-automatico.json`
- ✅ Atualiza `municipios-brasil.json`
- ✅ Detecta conflitos (CNPJs diferentes para o mesmo município)
- ✅ Mostra estatísticas finais

---

### 6. Busca Manual na Receita Federal

**Arquivo**: `buscar-cnpj-receita.js`

Helper para buscar CNPJs manualmente no site da Receita Federal quando o Google não encontrar.

**Como usar**:
```bash
cd digiurban/backend/src/data
node buscar-cnpj-receita.js
```

---

### 7. Coleta Automática (Experimental)

**Arquivo**: `buscar-cnpjs-automatico.js`

Tenta buscar CNPJs automaticamente via API pública. Processa apenas municípios >50k habitantes.

**Limitações**:
- ⚠️ API gratuita com rate limiting
- ⚠️ Pode não encontrar todos os CNPJs
- ⚠️ Mais lento devido às pausas necessárias

**Como usar**:
```bash
cd digiurban/backend/src/data
node buscar-cnpjs-automatico.js
```

---

## Fluxo de Trabalho Recomendado

### Opção 1: Rápido (Apenas Capitais - 10 minutos)

```bash
# 1. Coletar capitais
node coletar-cnpjs-capitais.js

# 2. Integrar CNPJs
node integrar-cnpjs-coletados.js

# 3. Validar
node validar-cnpjs.js
```

**Resultado**: ~27 municípios (0,5% do total, ~25% da população)

---

### Opção 2: Completo (Todos os Municípios - várias sessões)

```bash
# 1. Coletar capitais primeiro
node coletar-cnpjs-capitais.js

# 2. Integrar capitais
node integrar-cnpjs-coletados.js

# 3. Coletar demais municípios (faça em várias sessões)
node coletar-cnpjs-interativo.js
# Pressione 's' para salvar e sair
# Execute novamente para continuar

# 4. Integrar todos
node integrar-cnpjs-coletados.js

# 5. Validar
node validar-cnpjs.js

# 6. Limpar inválidos (se houver)
node limpar-cnpjs-invalidos.js
```

**Resultado**: 5.570 municípios (100%)

---

## Formato dos Arquivos

### cnpj-coletados.json
```json
{
  "1234567": {
    "cnpj": "12.345.678/0001-90",
    "nome": "São Paulo",
    "uf": "SP",
    "populacao": 11904961,
    "coletadoEm": "2025-01-18T12:30:00.000Z"
  }
}
```

### municipios-brasil.json (atualizado)
```json
[
  {
    "codigo_ibge": "3550308",
    "nome": "São Paulo",
    "uf": "SP",
    "regiao": "Sudeste",
    "populacao": 11904961,
    "cnpj": "46.395.000/0001-39",
    "capital": true,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "ddd": 11
  }
]
```

---

## Dicas para Coleta Rápida

1. **Use múltiplas sessões**: Execute o script em várias janelas do terminal, cada uma coletando municípios de um estado diferente

2. **Priorize capitais e grandes cidades**: O script já ordena por população

3. **Use atalhos**:
   - Copie o CNPJ do Google com `Ctrl+C`
   - Cole no terminal com `Ctrl+V` ou botão direito

4. **Salve frequentemente**: O script salva automaticamente a cada 5 CNPJs, mas você pode pressionar `s` a qualquer momento

5. **Verifique o formato**: O Google sempre mostra o CNPJ no formato correto: `XX.XXX.XXX/XXXX-XX`

---

## Fontes de CNPJ

### Busca no Google
```
CNPJ prefeitura [Nome do Município] [UF]
```

### Sites Úteis
- https://www.cnpj.ws/
- https://www.receita.fazenda.gov.br/
- https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp

---

## Estimativa de Tempo

- **Coleta interativa**: ~2-3 segundos por município = ~4-5 horas para todos
- **Coleta automática**: ~3 segundos por município + pausas = ~8-10 horas

**Recomendação**: Faça em várias sessões, coletando 100-200 CNPJs por dia.

---

## Troubleshooting

### Erro: "Formato inválido"
Use exatamente o formato: `XX.XXX.XXX/XXXX-XX` (com pontos, barra e traço)

### CNPJ não encontrado no Google
- Tente variações: "prefeitura municipal", "pref municipal"
- Busque diretamente no site da Receita Federal
- Use `n` para pular e voltar depois

### Script travou
Pressione `Ctrl+C` - o progresso será salvo automaticamente

### Arquivo cnpj-coletados.json corrompido
O script cria backups automáticos. Procure por arquivos `.backup` no diretório.

---

## Contribuindo

Se você coletar CNPJs e quiser compartilhar:

1. Execute `integrar-cnpjs-coletados.js`
2. Commit o arquivo `municipios-brasil.json` atualizado
3. Compartilhe o `cnpj-coletados.json` para outros continuarem

---

## Próximos Passos

Após coletar todos os CNPJs:

1. ✅ Validar CNPJs duplicados
2. ✅ Verificar CNPJs inválidos
3. ✅ Atualizar schema do Prisma se necessário
4. ✅ Testar auto-fill no formulário de criação de tenant

---

## Autor

Scripts criados para o projeto DigiUrban.
