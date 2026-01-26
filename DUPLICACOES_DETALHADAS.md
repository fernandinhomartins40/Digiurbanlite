# Lista Detalhada de Duplicações Entre Sugestões e Seeds

Este documento lista todas as 41 duplicações encontradas entre as sugestões (frontend) e os seeds (backend).

## Legenda

- ✅ **REMOVER**: Duplicação confirmada (100% ou >95% similaridade)
- ⚠️ **VERIFICAR**: Possível duplicação (75-95% similaridade) - pode ser falso positivo
- ℹ️ **Contexto**: Informação adicional sobre a duplicação

---

## 1. Agricultura (5 duplicações)

### ✅ REMOVER: Cadastro de Produtor Rural
- **Sugestão**: "Cadastro de Produtor Rural"
- **Seed**: "Cadastro de Produtor Rural"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: DAP - Declaração de Aptidão ao PRONAF
- **Sugestão**: "DAP - Declaração de Aptidão ao PRONAF"
- **Seed**: "DAP Digital - Declaração de Aptidão ao Pronaf"
- **Similaridade**: 81.0%
- **ℹ️ Nota**: Nomes ligeiramente diferentes, mas referem-se ao mesmo serviço

### ✅ REMOVER: Cadastro de Agroindústria Familiar
- **Sugestão**: "Cadastro de Agroindústria Familiar"
- **Seed**: "Cadastro de Agroindústria Familiar"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Licença para Perfuração de Poço
- **Sugestão**: "Licença para Perfuração de Poço"
- **Seed**: "Licença para Perfuração de Poço"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Inscrição na Feira do Produtor
- **Sugestão**: "Inscrição na Feira do Produtor"
- **Seed**: "Inscrição na Feira do Produtor"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 2. Assistência Social (3 duplicações)

### ✅ REMOVER: Solicitação de Cesta Básica
- **Sugestão**: "Solicitação de Cesta Básica"
- **Seed**: "Solicitação de Cesta Básica"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Cadastro Único (CadÚnico)
- **Sugestão**: "Cadastro Único (CadÚnico)"
- **Seed**: "Cadastro Único (CadÚnico)"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ⚠️ VERIFICAR: Atendimento CREAS vs CRAS
- **Sugestão**: "Atendimento CREAS"
- **Seed**: "Atendimento CRAS"
- **Similaridade**: 94.1%
- **ℹ️ Contexto**:
  - **CREAS**: Centro de Referência Especializado de Assistência Social (atende casos de violação de direitos)
  - **CRAS**: Centro de Referência de Assistência Social (atendimento básico)
- **Recomendação**: **NÃO REMOVER** - são serviços diferentes, apenas com nomes similares

---

## 3. Cultura (5 duplicações)

### ⚠️ VERIFICAR: Cadastro de Artista Local
- **Sugestão**: "Cadastro de Artista Local"
- **Seed**: "Cadastro de Artistas Locais"
- **Similaridade**: 87.5%
- **ℹ️ Nota**: Singular vs Plural - verificar se são o mesmo serviço
- **Recomendação**: Provavelmente remover (mesmo serviço)

### ⚠️ VERIFICAR: Reserva de Centro Cultural
- **Sugestão**: "Reserva de Centro Cultural"
- **Seed**: "Reserva de Espaço Cultural"
- **Similaridade**: 78.3%
- **ℹ️ Contexto**:
  - "Centro Cultural" pode se referir a um equipamento específico
  - "Espaço Cultural" é mais genérico
- **Recomendação**: Verificar se "Centro Cultural" está coberto por "Espaço Cultural"

### ⚠️ VERIFICAR: Inscrição em Festivais Culturais
- **Sugestão**: "Inscrição em Festivais Culturais"
- **Seed**: "Inscrição em Oficinas Culturais"
- **Similaridade**: 79.3%
- **ℹ️ Contexto**: **Festivais** ≠ **Oficinas** - são serviços completamente diferentes
- **Recomendação**: **NÃO REMOVER** - falso positivo

### ⚠️ VERIFICAR: Cadastro de Ponto de Cultura (1)
- **Sugestão**: "Cadastro de Ponto de Cultura"
- **Seed**: "Cadastro de Evento Cultural"
- **Similaridade**: 83.3%
- **ℹ️ Contexto**: **Ponto de Cultura** ≠ **Evento Cultural**
- **Recomendação**: **NÃO REMOVER** - falso positivo

### ✅ REMOVER: Cadastro de Ponto de Cultura (2)
- **Sugestão**: "Cadastro de Ponto de Cultura"
- **Seed**: "Cadastro Ponto Cultura"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 4. Educação (6 duplicações)

### ✅ REMOVER: Matrícula Escolar
- **Sugestão**: "Matrícula Escolar"
- **Seed**: "Matrícula Escolar"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Transporte Escolar
- **Sugestão**: "Transporte Escolar"
- **Seed**: "Transporte Escolar"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Transferência de Escola
- **Sugestão**: "Transferência de Escola"
- **Seed**: "Transferência Escolar"
- **Similaridade**: 95.2%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Histórico Escolar
- **Sugestão**: "Histórico Escolar"
- **Seed**: "Histórico Escolar"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ⚠️ VERIFICAR: Matrícula em Pré-Escola
- **Sugestão**: "Matrícula em Pré-Escola"
- **Seed**: "Matrícula Escolar"
- **Similaridade**: 75.0%
- **ℹ️ Contexto**:
  - "Matrícula Escolar" é genérica (pode incluir pré-escola)
  - "Matrícula em Pré-Escola" é específica
- **Recomendação**: Verificar se o seed "Matrícula Escolar" cobre pré-escola. Se sim, remover sugestão.

### ⚠️ VERIFICAR: Lista de Material Escolar
- **Sugestão**: "Lista de Material Escolar"
- **Seed**: "Solicitação de Material Escolar"
- **Similaridade**: 75.0%
- **ℹ️ Contexto**:
  - "Lista" pode ser apenas consulta (SEM_DADOS)
  - "Solicitação" é pedido de material (COM_DADOS)
- **Recomendação**: **NÃO REMOVER** - são serviços diferentes

---

## 5. Esportes (3 duplicações)

### ⚠️ VERIFICAR: Reserva de Ginásio Esportivo
- **Sugestão**: "Reserva de Ginásio Esportivo"
- **Seed**: "Reserva de Espaço Esportivo"
- **Similaridade**: 80.0%
- **ℹ️ Contexto**: "Ginásio" pode estar incluído em "Espaço Esportivo"
- **Recomendação**: Verificar se "Espaço Esportivo" cobre ginásios. Se sim, remover.

### ✅ REMOVER: Inscrição em Corrida de Rua
- **Sugestão**: "Inscrição em Corrida de Rua"
- **Seed**: "Inscrição Corrida de Rua"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Empréstimo de Material Esportivo
- **Sugestão**: "Empréstimo de Material Esportivo"
- **Seed**: "Empréstimo Material Esportivo"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 6. Habitação (3 duplicações)

### ✅ REMOVER: Regularização Fundiária
- **Sugestão**: "Regularização Fundiária"
- **Seed**: "Regularização Fundiária"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Usucapião Urbano
- **Sugestão**: "Usucapião Urbano"
- **Seed**: "Usucapião Urbano"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Declaração de Residência
- **Sugestão**: "Declaração de Residência"
- **Seed**: "Declaração de Residência"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 7. Meio Ambiente (4 duplicações)

### ✅ REMOVER: Licença Ambiental Simplificada
- **Sugestão**: "Licença Ambiental Simplificada"
- **Seed**: "Licença Ambiental Simplificada"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Denúncia Ambiental
- **Sugestão**: "Denúncia Ambiental"
- **Seed**: "Denúncia Ambiental"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Denúncia de Poluição Sonora
- **Sugestão**: "Denúncia de Poluição Sonora"
- **Seed**: "Denúncia Poluição Sonora"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Autorização de Manejo de Fauna
- **Sugestão**: "Autorização de Manejo de Fauna"
- **Seed**: "Autorização Manejo Fauna"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 8. Obras Públicas (0 duplicações)

**Nenhuma duplicação encontrada!** 🎉

Todas as 233 sugestões são de serviços novos.

---

## 9. Planejamento Urbano (3 duplicações)

### ✅ REMOVER: Alvará de Construção
- **Sugestão**: "Alvará de Construção"
- **Seed**: "Alvará de Construção"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Aprovação de Projeto Arquitetônico
- **Sugestão**: "Aprovação de Projeto Arquitetônico"
- **Seed**: "Aprovação de Projeto Arquitetônico"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ⚠️ VERIFICAR: Certidão de Restrições Urbanísticas
- **Sugestão**: "Certidão de Restrições Urbanísticas"
- **Seed**: "Certidão de Diretrizes Urbanísticas"
- **Similaridade**: 84.4%
- **ℹ️ Contexto**:
  - "Restrições" informa limitações (ex: área de preservação, recuos)
  - "Diretrizes" informa parâmetros construtivos (gabarito, taxa de ocupação)
- **Recomendação**: Verificar se são documentos distintos. Provavelmente são o mesmo serviço.

---

## 10. Saúde (3 duplicações)

### ✅ REMOVER: Solicitação de Medicamento
- **Sugestão**: "Solicitação de Medicamento"
- **Seed**: "Solicitação de Medicamentos"
- **Similaridade**: 95.8%
- **ℹ️ Nota**: Singular vs Plural
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Agendamento de Vacinação
- **Sugestão**: "Agendamento de Vacinação"
- **Seed**: "Agendamento de Vacinação"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Solicitação de Exames
- **Sugestão**: "Solicitação de Exames"
- **Seed**: "Solicitação de Exames"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 11. Segurança Pública (2 duplicações)

### ⚠️ VERIFICAR: Solicitação de Ronda Escolar
- **Sugestão**: "Solicitação de Ronda Escolar"
- **Seed**: "Solicitação de Patrulha Escolar"
- **Similaridade**: 78.6%
- **ℹ️ Contexto**: "Ronda" e "Patrulha" têm o mesmo significado
- **Recomendação**: Remover (mesmo serviço com nomenclatura diferente)

### ✅ REMOVER: Denúncia de Violência Doméstica
- **Sugestão**: "Denúncia de Violência Doméstica"
- **Seed**: "Denúncia de Violência Doméstica"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 12. Serviços Públicos (1 duplicação)

### ✅ REMOVER: Limpeza de Boca de Lobo
- **Sugestão**: "Limpeza de Boca de Lobo"
- **Seed**: "Limpeza de Boca de Lobo"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

---

## 13. Turismo (3 duplicações)

### ✅ REMOVER: Cadastro de Guia Turístico
- **Sugestão**: "Cadastro de Guia Turístico"
- **Seed**: "Cadastro de Guia Turístico"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ✅ REMOVER: Cadastro de Estabelecimento Turístico
- **Sugestão**: "Cadastro de Estabelecimento Turístico"
- **Seed**: "Cadastro de Estabelecimento Turístico"
- **Similaridade**: 100.0%
- **Ação**: Remover sugestão (já implementado)

### ⚠️ VERIFICAR: Autorização para Evento Turístico
- **Sugestão**: "Autorização para Evento Turístico"
- **Seed**: "Autorização para Transporte Turístico"
- **Similaridade**: 75.0%
- **ℹ️ Contexto**: **Evento** ≠ **Transporte**
- **Recomendação**: **NÃO REMOVER** - falso positivo

---

## Resumo de Ações

### ✅ Remover Imediatamente (29 sugestões)

Duplicações confirmadas com 100% ou >95% similaridade:

**Agricultura (5)**:
- Cadastro de Produtor Rural
- DAP - Declaração de Aptidão ao PRONAF
- Cadastro de Agroindústria Familiar
- Licença para Perfuração de Poço
- Inscrição na Feira do Produtor

**Assistência Social (2)**:
- Solicitação de Cesta Básica
- Cadastro Único (CadÚnico)

**Cultura (1)**:
- Cadastro de Ponto de Cultura

**Educação (4)**:
- Matrícula Escolar
- Transporte Escolar
- Transferência de Escola
- Histórico Escolar

**Esportes (2)**:
- Inscrição em Corrida de Rua
- Empréstimo de Material Esportivo

**Habitação (3)**:
- Regularização Fundiária
- Usucapião Urbano
- Declaração de Residência

**Meio Ambiente (4)**:
- Licença Ambiental Simplificada
- Denúncia Ambiental
- Denúncia de Poluição Sonora
- Autorização de Manejo de Fauna

**Planejamento Urbano (2)**:
- Alvará de Construção
- Aprovação de Projeto Arquitetônico

**Saúde (3)**:
- Solicitação de Medicamento
- Agendamento de Vacinação
- Solicitação de Exames

**Segurança Pública (1)**:
- Denúncia de Violência Doméstica

**Serviços Públicos (1)**:
- Limpeza de Boca de Lobo

**Turismo (2)**:
- Cadastro de Guia Turístico
- Cadastro de Estabelecimento Turístico

---

### ⚠️ Verificar Manualmente (12 sugestões)

Possíveis duplicações que precisam de análise humana:

**Assistência Social (1)**:
- Atendimento CREAS vs CRAS → Provavelmente NÃO remover (serviços diferentes)

**Cultura (3)**:
- Cadastro de Artista Local → Provavelmente remover
- Reserva de Centro Cultural → Verificar escopo
- Inscrição em Festivais Culturais → NÃO remover (falso positivo)

**Educação (2)**:
- Matrícula em Pré-Escola → Verificar se está coberta por "Matrícula Escolar"
- Lista de Material Escolar → NÃO remover (serviço diferente)

**Esportes (1)**:
- Reserva de Ginásio Esportivo → Verificar se está coberta por "Espaço Esportivo"

**Planejamento Urbano (1)**:
- Certidão de Restrições Urbanísticas → Provavelmente remover

**Segurança Pública (1)**:
- Solicitação de Ronda Escolar → Provavelmente remover

**Turismo (1)**:
- Autorização para Evento Turístico → NÃO remover (falso positivo)

---

## Total Final

- **Remover com certeza**: 29 sugestões
- **Verificar manualmente**: 12 sugestões
- **Falsos positivos identificados**: 4 sugestões
- **Total de análises**: 41 duplicações detectadas

**Estimativa conservadora**: 29-35 sugestões devem ser removidas (dependendo da verificação manual).
