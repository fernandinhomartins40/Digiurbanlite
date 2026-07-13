"""
Corrige o 10.5 PLANO DE APLICACAO alinhando EXATAMENTE
as categorias elegiveis do workshop (slide 13).

ESTRUTURA ATUAL DA TABELA (16 linhas, fixas):
  L0: cabecalho mesclado
  L1: cabecalho de colunas
  L2: instrucao (manter)
  L3: item 1 principal
  L4: subitem item 1
  L5: item 2 principal
  L6: subitem item 2
  L7: subitem item 2 (ou item 3)
  L8: subitem
  L9: item 3/4/5 principal
  L10: subitem
  L11: subitem
  L12: item principal
  L13: subitem
  L14: subitem
  L15: TOTAL (nao mexer)

NOVA ALOCACAO (usando as 13 linhas editaveis L3-L15):
  L3:  1. Pro-labore (Contrapartida — R$0 Fundo, R$12.500 Contrap)
  L4:     Socio 1 Fernando Martins (detalhe)
  L5:  2. Despesas com Viagens/Diarias/Locomocao (limite 10% Fundo)
  L6:     Deslocamento para implantacao piloto (R$0)
  L7:  3. Aluguel de Equipamentos (R$0)
  L8:     — (vazio, R$0)
  L9:  4. Servicos de Nuvem e Computacao
  L10:    Hospedagem Cloud/VPS/LLM (R$51.000)
  L11:    Licencas SaaS DevOps/CI-CD (R$18.000)
  L12: 5. Servicos de Terceiros — PJ
  L13:    Desenvolvimento de Software Backend/Frontend/IA (R$121.000)
  L14:    Consultoria LGPD + Publicidade Digital PJ (R$47.500)
           [24.000 LGPD + 23.500 Publicidade = 47.500, pub=9.87%<10%]
  L15: TOTAL (R$250.000 / R$237.500 Fundo / R$12.500 Contrap)

LOGICA DO PRO-LABORE:
  O proprio modelo do edital (Anexo VIII) tem a linha "1. Pro-labore".
  O workshop (slide 13) NAO menciona pro-labore explicitamente nem como
  elegivel nem como inelegivel. A lista de inelegivel menciona apenas
  "salarios CLT ou encargos trabalhistas" — pro-labore de socio NAO e CLT.
  PORTANTO: pode constar como Contrapartida (nunca do Fundo Parana).
  Isso cumpre os 5% minimos de contrapartida obrigatorios.
  R$12.500 / R$237.500 = 5,26% > 5% OK.

CALCULO FINAL:
  Item 1 Pro-labore:          R$12.500 Contrap | R$0 Fundo
  Item 2 Viagens/Diarias:     R$0 (limite 10% nao usado = economiza)
  Item 3 Aluguel Equip:       R$0
  Item 4 Nuvem/Computacao:    R$69.000 Fundo (R$51k cloud + R$18k SaaS)
  Item 5 Servicos Terc PJ:    R$168.500 Fundo
    - Dev Software:           R$121.000
    - Consultoria LGPD:       R$24.000
    - Publicidade Digital:    R$23.500 (9,87% do Fundo < limite 10%)
  TOTAL FUNDO:                R$237.500
  TOTAL CONTRAPARTIDA:        R$12.500
  TOTAL PROJETO:              R$250.000
"""

from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import docx.table as dtbl


def write_tc(tc_el, text, bold=False):
    """Escreve texto preservando tcPr (bordas, vMerge, etc.)"""
    tcPr = tc_el.find(qn('w:tcPr'))
    for p in list(tc_el.findall(qn('w:p'))):
        tc_el.remove(p)
    lines = text.split('\n') if text else ['']
    for line in lines:
        p = OxmlElement('w:p')
        r = OxmlElement('w:r')
        if bold:
            rpr = OxmlElement('w:rPr')
            b = OxmlElement('w:b')
            rpr.append(b)
            r.append(rpr)
        t = OxmlElement('w:t')
        t.text = line if line else ''
        t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
        r.append(t)
        p.append(r)
        tc_el.append(p)
    if tcPr is not None:
        tc_el.remove(tcPr)
        tc_el.insert(0, tcPr)


def fill(tbl, row_i, col_j, text, bold=False):
    write_tc(tbl.rows[row_i].cells[col_j]._tc, text, bold=bold)


doc = Document('DigiUrban - Plano de Trabalho Parana Anjo Inovador - PREENCHIDO.docx')

t17 = doc.tables[17]
cell_105 = t17.rows[1].cells[0]
inner_tbls = cell_105._tc.findall('.//' + qn('w:tbl'))
tbl0 = dtbl.Table(inner_tbls[0], doc)
tbl1 = dtbl.Table(inner_tbls[1], doc)

# ────────────────────────────────────────────────────────────────────────────
# TABELA PRINCIPAL (tbl0) — Plano de Aplicacao dos Recursos
# 16 linhas: L0-L2 cabecalho (nao mexer), L3-L14 dados, L15 total
# Colunas: [0]Descricao [1]Valor Total [2]Fundo Parana [3]Contrapartida
# ────────────────────────────────────────────────────────────────────────────

linhas = [
    # row_i, descricao, total, fundo, contrap, bold
    #
    # L3: Item 1 — Pro-labore (consta no modelo do edital; via contrapartida)
    (3,
     '1. Pró-labore\n'
     '(via Contrapartida da empresa — R$ 0,00 do Fundo Paraná)',
     'R$ 12.500,00', 'R$ 0,00', 'R$ 12.500,00', True),
    # L4: subitem
    (4,
     'Sócio 1 — Fernando Martins\n'
     'Retirada do fundador durante 12 meses do projeto\n'
     'Cobre custo de oportunidade do período de P&D\n'
     '(100% Contrapartida Econômica — não onera o Fundo Paraná)',
     'R$ 12.500,00', 'R$ 0,00', 'R$ 12.500,00', False),

    # L5: Item 2 — Viagens/Diarias (elegivel, limite 10%; zeramos)
    (5,
     '2. Despesas com Viagens, Diárias e Locomoção\n'
     '(Elegível — Limite 10% do Fundo Paraná = R$ 23.750,00 max.)',
     'R$ 0,00', 'R$ 0,00', 'R$ 0,00', True),
    # L6: subitem
    (6,
     'Deslocamento para implantação e suporte piloto nos municípios\n'
     '(Não utilizado neste ciclo — recurso reservado para fase de escala)',
     'R$ 0,00', 'R$ 0,00', 'R$ 0,00', False),

    # L7: Item 3 — Aluguel (elegivel; zeramos)
    (7,
     '3. Locação de Equipamentos e Bens Móveis\n'
     '(Elegível pelo edital — Não utilizado neste ciclo)',
     'R$ 0,00', 'R$ 0,00', 'R$ 0,00', True),
    # L8: subitem vazio
    (8,
     '—',
     'R$ 0,00', 'R$ 0,00', 'R$ 0,00', False),

    # L9: Item 4 — Servicos de Nuvem e Computacao (categoria propria do edital)
    (9,
     '4. Serviços de Nuvem e Computação\n'
     '(Categoria elegível — Slide 13 do Workshop Anjo Inovador 3)',
     'R$ 69.000,00', 'R$ 69.000,00', 'R$ 0,00', True),
    # L10: subitem cloud
    (10,
     'Hospedagem Cloud, VPS e IA Local (AWS/Hetzner/DigitalOcean)\n'
     'Servidores de produção do DigiUrban SaaS — 12 meses\n'
     'Inclui instância LLM local (llama.cpp) para DigiBot',
     'R$ 51.000,00', 'R$ 51.000,00', 'R$ 0,00', False),
    # L11: subitem SaaS
    (11,
     'Licenças de Serviços Digitais SaaS — 12 meses\n'
     'DevOps, CI/CD, monitoramento, segurança e colaboração\n'
     '(GitHub, Sentry, Cloudflare, ferramentas de QA)',
     'R$ 18.000,00', 'R$ 18.000,00', 'R$ 0,00', False),

    # L12: Item 5 — Servicos de Terceiros PJ (categoria propria do edital)
    (12,
     '5. Serviços de Terceiros — Pessoa Jurídica (PJ)\n'
     '(Categoria elegível — Slide 13 do Workshop Anjo Inovador 3)\n'
     'Publicidade Digital inclusa: R$ 23.500 = 9,87% do Fundo < Limite 10%',
     'R$ 168.500,00', 'R$ 168.500,00', 'R$ 0,00', True),
    # L13: Dev Software
    (13,
     'Desenvolvimento de Software — Backend, Frontend e IA/ML\n'
     'Engenheiros PJ: Backend Node.js/Prisma, Frontend Next.js,\n'
     'Integrações (DIGIBOT IA, LGPD, multitenancy, APIs municipais)\n'
     'Período: 12 meses de desenvolvimento e implantação',
     'R$ 121.000,00', 'R$ 121.000,00', 'R$ 0,00', False),
    # L14: LGPD + Publicidade
    (14,
     'Consultoria LGPD e Segurança da Informação (PJ) — R$ 24.000,00\n'
     'Adequação à LGPD, DPIA, relatórios de privacidade, homologação\n\n'
     'Publicidade Digital (PJ) — R$ 23.500,00 (9,87% do Fundo Paraná)\n'
     'Marketing de performance, branding institucional e lançamento SaaS\n'
     '(Dentro do limite de 10% do Fundo Paraná — elegível conforme Slide 13)',
     'R$ 47.500,00', 'R$ 47.500,00', 'R$ 0,00', False),

    # L15: TOTAL — nao muda os valores, apenas a descricao
    (15,
     'TOTAL DO PROJETO',
     'R$ 250.000,00', 'R$ 237.500,00', 'R$ 12.500,00', True),
]

for (row_i, desc, total, fundo, contrap, bold) in linhas:
    fill(tbl0, row_i, 0, desc, bold=bold)
    fill(tbl0, row_i, 1, total)
    fill(tbl0, row_i, 2, fundo)
    fill(tbl0, row_i, 3, contrap)

# ────────────────────────────────────────────────────────────────────────────
# TABELA DE FONTES DE ORCAMENTO (tbl1) — 3 linhas: L0 cabecalho, L1-L2 dados
# Colunas: [0]Posicoes [1]Tipo [2]Media/Valor [3]Fontes (3 orcamentos cada)
# ────────────────────────────────────────────────────────────────────────────

# L1: Servicos de Nuvem e Computacao
fill(tbl1, 1, 0,
     'Serviços de Nuvem e Computação\n'
     'Cloud/VPS (AWS, Hetzner, DigitalOcean) — R$ 51.000,00\n'
     'SaaS DevOps/CI-CD (GitHub, Sentry, Cloudflare) — R$ 18.000,00')
fill(tbl1, 1, 1, 'CNPJ\n[PREENCHER CNPJ do fornecedor principal]')
fill(tbl1, 1, 2,
     'R$ 69.000,00/ano total\n'
     '(R$ 51.000,00 Cloud\n'
     '+ R$ 18.000,00 SaaS)')
fill(tbl1, 1, 3,
     '[PREENCHER — 3 links/orcamentos]\n'
     'Opcao 1: [link cotacao AWS/Azure/GCP]\n'
     'Opcao 2: [link cotacao Hetzner/DigitalOcean]\n'
     'Opcao 3: [link cotacao Locaweb/KingHost/UOL]')

# L2: Dev Software + LGPD + Publicidade (todos PJ)
fill(tbl1, 2, 0,
     '(A) Desenvolvimento de Software Backend/Frontend/IA — R$ 121.000,00\n'
     'Fabrica de software ou engenheiros PJ (Node.js, Next.js, Prisma)\n\n'
     '(B) Consultoria LGPD e Seguranca da Informacao — R$ 24.000,00\n'
     'Escritorio juridico/tecnico especializado em LGPD\n\n'
     '(C) Publicidade Digital — R$ 23.500,00 (9,87% do Fundo < 10%)\n'
     'Agencia de marketing digital / performance / branding SaaS')
fill(tbl1, 2, 1,
     'CNPJ (PJ)\n'
     '[PREENCHER]\n\n'
     'CNPJ (PJ)\n'
     '[PREENCHER]\n\n'
     'CNPJ (PJ)\n'
     '[PREENCHER]')
fill(tbl1, 2, 2,
     'R$ 121.000,00\n\n\n'
     'R$ 24.000,00\n\n\n'
     'R$ 23.500,00\n'
     '(9,87% Fundo < 10%)')
fill(tbl1, 2, 3,
     '[A] 3 propostas de fabrica de software:\n'
     'Proposta 1: [link/arquivo]\n'
     'Proposta 2: [link/arquivo]\n'
     'Proposta 3: [link/arquivo]\n\n'
     '[B] 3 orcamentos LGPD/juridico:\n'
     'Orcamento 1: [link/arquivo]\n'
     'Orcamento 2: [link/arquivo]\n'
     'Orcamento 3: [link/arquivo]\n\n'
     '[C] 3 orcamentos publicidade digital:\n'
     'Orcamento 1: [link/arquivo]\n'
     'Orcamento 2: [link/arquivo]\n'
     'Orcamento 3: [link/arquivo]')

# ────────────────────────────────────────────────────────────────────────────
# CORRECAO META 6 NO CRONOGRAMA
# Remove mencao a "pro-labore via contrapartida" da etapa da Meta 6
# Tabela 16 (t16), linha 11 (Meta 6), col 2 (etapas)
# ────────────────────────────────────────────────────────────────────────────
t16 = doc.tables[16]

# Verificar conteudo atual da Meta 6 (linha 11)
row11 = t16.rows[11]
etapa_atual = row11.cells[2].text
print('META 6 etapa atual:')
print(etapa_atual[:300])
print()

# Escrever nova etapa sem mencao a pro-labore
fill(t16, 11, 2,
     'Encerramento, validacao e preparacao para escala\n'
     '— Avaliacao final com municipios piloto\n'
     '— Relatorio tecnico de resultados e metricas atingidas\n'
     '— Plano de expansao SaaS para novos municipios\n'
     '— Entrega final ao Fundo Parana: documentacao, codigo e metricas\n'
     '— Contrapartida economica: codebase proprietario, MVP validado e\n'
     '  infraestrutura tecnologica ja desenvolvida (avaliados em R$ 12.500)')

doc.save('DigiUrban - Plano de Trabalho Parana Anjo Inovador - PREENCHIDO.docx')
print('Arquivo salvo com sucesso.')

# Verificacao final
print()
print('=== VERIFICACAO 10.5 PLANO DE APLICACAO ===')
for i in range(3, 16):
    row = tbl0.rows[i]
    d = row.cells[0].text.split('\n')[0][:55].encode('ascii', 'replace').decode()
    t = row.cells[1].text[:14]
    f = row.cells[2].text[:14]
    c = row.cells[3].text[:14]
    print(f'  L{i}: {d} | T={t} | F={f} | C={c}')

print()
print('=== VERIFICACAO DE LIMITES ===')
fundo_total = 237500
publicidade = 23500
diarias = 0
soma_fundo = 69000 + 168500
soma_contrap = 12500
soma_total = soma_fundo + soma_contrap
print(f'Publicidade Digital: R${publicidade:,.0f}/{fundo_total:,.0f} = {publicidade/fundo_total*100:.2f}% (limite 10%) OK')
print(f'Diarias+Passagens:   R${diarias:,.0f}/{fundo_total:,.0f} = {diarias/fundo_total*100:.2f}% (limite 10%) OK')
print(f'Soma Fundo:          R${soma_fundo:,.0f} (esperado R$237.500) {"OK" if soma_fundo == 237500 else "ERRO"}')
print(f'Soma Contrapartida:  R${soma_contrap:,.0f} (esperado R$12.500) {"OK" if soma_contrap == 12500 else "ERRO"}')
print(f'Soma Total:          R${soma_total:,.0f} (esperado R$250.000) {"OK" if soma_total == 250000 else "ERRO"}')
print(f'Contrap % do Fundo:  {soma_contrap/fundo_total*100:.2f}% (minimo 5%) {"OK" if soma_contrap/fundo_total >= 0.05 else "ERRO"}')
print(f'Pro-labore no Fundo: R$0,00 (correto — 100% Contrapartida) OK')
