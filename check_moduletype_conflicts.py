#!/usr/bin/env python3
"""
Verificar se há moduleTypes compartilhados entre COM_DADOS e SEM_DADOS
"""

import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(r"c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds")
SERVICES_DIR = BASE_DIR / "services"

print("\n" + "="*80)
print("VERIFICACAO DE CONFLITOS DE MODULETYPE")
print("="*80)

secretarias = [
    'health.seed.ts', 'education.seed.ts', 'social.seed.ts', 'agriculture.seed.ts',
    'culture.seed.ts', 'sports.seed.ts', 'housing.seed.ts', 'environment.seed.ts',
    'public-works.seed.ts', 'urban-planning.seed.ts', 'public-safety.seed.ts',
    'public-services.seed.ts', 'tourism.seed.ts', 'finance.seed.ts',
    'administration.seed.ts', 'civil-defense.seed.ts', 'women-policies.seed.ts',
    'technology-innovation.seed.ts', 'transport-transit.seed.ts',
    'economic-development.seed.ts', 'urban-mobility.seed.ts'
]

# Estrutura: moduleType -> { 'COM_DADOS': [serviços], 'SEM_DADOS': [serviços] }
moduletype_map = defaultdict(lambda: {'COM_DADOS': [], 'SEM_DADOS': []})
service_count = 0

print("\nLendo todos os servicos...")

for filename in secretarias:
    file_path = SERVICES_DIR / filename
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extrair TODOS os serviços com nome, serviceType e moduleType
        # Padrão mais robusto
        pattern = r"name:\s*['\"]([^'\"]+)['\"][\s\S]{0,800}?serviceType:\s*['\"]([^'\"]+)['\"][\s\S]{0,500}?moduleType:\s*['\"]([A-Z_]+)['\"]"
        matches = re.findall(pattern, content)

        for service_name, service_type, module_type in matches:
            service_count += 1
            if 'COM_DADOS' in service_type:
                moduletype_map[module_type]['COM_DADOS'].append(service_name)
            elif 'SEM_DADOS' in service_type:
                moduletype_map[module_type]['SEM_DADOS'].append(service_name)

print(f"Total de servicos encontrados: {service_count}")
print(f"Total de moduleTypes unicos: {len(moduletype_map)}")

# Análise 1: ModuleTypes compartilhados entre COM_DADOS e SEM_DADOS
print("\n" + "="*80)
print("CONFLITO 1: ModuleTypes usados por COM_DADOS e SEM_DADOS")
print("="*80)

conflitos_tipo = []
for module_type, services in moduletype_map.items():
    if services['COM_DADOS'] and services['SEM_DADOS']:
        conflitos_tipo.append((module_type, services))

if conflitos_tipo:
    print(f"\nEncontrados {len(conflitos_tipo)} moduleTypes com conflito de tipo!")
    print("\nEste e um ERRO GRAVE de arquitetura!\n")

    for i, (module_type, services) in enumerate(conflitos_tipo, 1):
        print(f"{i}. {module_type}")
        print(f"   COM_DADOS ({len(services['COM_DADOS'])} servicos):")
        for s in services['COM_DADOS']:
            print(f"     - {s}")
        print(f"   SEM_DADOS ({len(services['SEM_DADOS'])} servicos):")
        for s in services['SEM_DADOS']:
            print(f"     - {s}")
        print()
else:
    print("\nNenhum conflito encontrado! Cada moduleType e usado apenas por um tipo.")

# Análise 2: ModuleTypes compartilhados por múltiplos serviços DO MESMO TIPO
print("="*80)
print("CONFLITO 2: ModuleTypes compartilhados por multiplos servicos")
print("="*80)

compartilhados_com_dados = []
compartilhados_sem_dados = []

for module_type, services in moduletype_map.items():
    if len(services['COM_DADOS']) > 1:
        compartilhados_com_dados.append((module_type, services['COM_DADOS']))
    if len(services['SEM_DADOS']) > 1:
        compartilhados_sem_dados.append((module_type, services['SEM_DADOS']))

print(f"\nModuleTypes COM_DADOS compartilhados: {len(compartilhados_com_dados)}")
if compartilhados_com_dados:
    print("\nPrimeiros 10 exemplos:")
    for i, (module_type, services) in enumerate(compartilhados_com_dados[:10], 1):
        print(f"{i}. {module_type} ({len(services)} servicos):")
        for s in services[:3]:
            print(f"   - {s}")
        if len(services) > 3:
            print(f"   ... e mais {len(services) - 3}")

print(f"\nModuleTypes SEM_DADOS compartilhados: {len(compartilhados_sem_dados)}")
if compartilhados_sem_dados:
    print("\nPrimeiros 10 exemplos:")
    for i, (module_type, services) in enumerate(compartilhados_sem_dados[:10], 1):
        print(f"{i}. {module_type} ({len(services)} servicos):")
        for s in services[:3]:
            print(f"   - {s}")
        if len(services) > 3:
            print(f"   ... e mais {len(services) - 3}")

# Análise 3: Estatísticas gerais
print("\n" + "="*80)
print("ESTATISTICAS GERAIS")
print("="*80)

moduletypes_unicos = len([mt for mt, s in moduletype_map.items() if len(s['COM_DADOS']) == 1 and len(s['SEM_DADOS']) == 0])
moduletypes_unicos += len([mt for mt, s in moduletype_map.items() if len(s['COM_DADOS']) == 0 and len(s['SEM_DADOS']) == 1])

moduletypes_compartilhados = len([mt for mt, s in moduletype_map.items() if len(s['COM_DADOS']) > 1 or len(s['SEM_DADOS']) > 1])

print(f"\nTotal de servicos: {service_count}")
print(f"Total de moduleTypes: {len(moduletype_map)}")
print(f"\nModuleTypes UNICOS (1 servico por moduleType): {moduletypes_unicos}")
print(f"ModuleTypes COMPARTILHADOS (2+ servicos): {moduletypes_compartilhados}")
print(f"\nPorcentagem de moduleTypes compartilhados: {moduletypes_compartilhados/len(moduletype_map)*100:.1f}%")

# Análise 4: Quantos workflows são necessários?
print("\n" + "="*80)
print("NECESSIDADE DE WORKFLOWS")
print("="*80)

servicos_com_dados = sum(len(s['COM_DADOS']) for s in moduletype_map.values())
servicos_sem_dados = sum(len(s['SEM_DADOS']) for s in moduletype_map.values())

print(f"\nServicos COM_DADOS: {servicos_com_dados}")
print(f"Servicos SEM_DADOS: {servicos_sem_dados}")

# Se cada serviço precisa de seu próprio workflow
print(f"\nWorkflows necessarios (1 por servico COM_DADOS): {servicos_com_dados}")
print(f"Workflows customizados existentes: 81")
print(f"Deficit: {servicos_com_dados - 81}")

# Salvando relatório
report_lines = []
report_lines.append("# Relatorio de Conflitos de ModuleType\n")
report_lines.append(f"**Total de Servicos:** {service_count}")
report_lines.append(f"**Total de ModuleTypes:** {len(moduletype_map)}")
report_lines.append(f"**ModuleTypes Unicos:** {moduletypes_unicos}")
report_lines.append(f"**ModuleTypes Compartilhados:** {moduletypes_compartilhados}")
report_lines.append(f"\n**Servicos COM_DADOS:** {servicos_com_dados}")
report_lines.append(f"**Servicos SEM_DADOS:** {servicos_sem_dados}")
report_lines.append(f"\n**Workflows Necessarios:** {servicos_com_dados}")
report_lines.append(f"**Workflows Existentes:** 81")
report_lines.append(f"**Deficit:** {servicos_com_dados - 81}")

if conflitos_tipo:
    report_lines.append(f"\n---\n## CONFLITO CRITICO: ModuleTypes Mistos\n")
    report_lines.append(f"**{len(conflitos_tipo)} moduleTypes usados por COM_DADOS e SEM_DADOS simultaneamente!**\n")
    for module_type, services in conflitos_tipo:
        report_lines.append(f"### {module_type}")
        report_lines.append(f"**COM_DADOS ({len(services['COM_DADOS'])}):**")
        for s in services['COM_DADOS']:
            report_lines.append(f"- {s}")
        report_lines.append(f"\n**SEM_DADOS ({len(services['SEM_DADOS'])}):**")
        for s in services['SEM_DADOS']:
            report_lines.append(f"- {s}")
        report_lines.append("")

if compartilhados_com_dados:
    report_lines.append(f"\n---\n## ModuleTypes COM_DADOS Compartilhados ({len(compartilhados_com_dados)})\n")
    for module_type, services in compartilhados_com_dados:
        report_lines.append(f"### {module_type} ({len(services)} servicos)")
        for s in services:
            report_lines.append(f"- {s}")
        report_lines.append("")

report_path = Path(r"c:\Projetos Cursor\Digiurbanlite\CONFLITOS_MODULETYPE.md")
with open(report_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(report_lines))

print(f"\n\nRelatorio salvo em: {report_path}")
print("\nAnalise concluida!")
