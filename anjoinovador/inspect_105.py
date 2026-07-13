"""Inspeciona a estrutura atual da tabela 10.5"""
from docx import Document
from docx.oxml.ns import qn
import docx.table as dtbl

doc = Document('DigiUrban - Plano de Trabalho Parana Anjo Inovador - PREENCHIDO.docx')

t17 = doc.tables[17]
cell_105 = t17.rows[1].cells[0]
inner_tbls = cell_105._tc.findall('.//' + qn('w:tbl'))

print(f'Numero de tabelas internas: {len(inner_tbls)}')

for ti, itbl in enumerate(inner_tbls):
    tbl = dtbl.Table(itbl, doc)
    print(f'\n=== TABELA INTERNA {ti} ({len(tbl.rows)} linhas x {len(tbl.columns)} cols) ===')
    for ri, row in enumerate(tbl.rows):
        cols = []
        for ci, cell in enumerate(row.cells):
            txt = cell.text[:40].replace('\n', ' | ')
            cols.append(f'[{ci}]{txt}')
        print(f'  L{ri}: {" || ".join(cols)}')
