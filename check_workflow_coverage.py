#!/usr/bin/env python3
"""
Script para verificar cobertura de workflows customizados
"""

import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(r"c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds")
SERVICES_DIR = BASE_DIR / "services"
WORKFLOWS_FILE = BASE_DIR / "service-workflows.seed.ts"

print("\n" + "="*80)
print("ANALISE DE COBERTURA DE WORKFLOWS CUSTOMIZADOS")
print("="*80)

# 1. Extrair todos os moduleTypes dos workflows customizados
print("\n1. Lendo workflows customizados...")
with open(WORKFLOWS_FILE, 'r', encoding='utf-8') as f:
    workflow_content = f.read()

workflow_module_types = set(re.findall(r"moduleType:\s*['\"]([A-Z_]+)['\"]", workflow_content))
print(f"   Encontrados: {len(workflow_module_types)} moduleTypes com workflow customizado")

# 2. Extrair todos os moduleTypes dos serviços COM_DADOS
print("\n2. Lendo servicos COM_DADOS...")
service_module_types = defaultdict(list)  # moduleType -> [lista de serviços]

secretarias = [
    'health.seed.ts', 'education.seed.ts', 'social.seed.ts', 'agriculture.seed.ts',
    'culture.seed.ts', 'sports.seed.ts', 'housing.seed.ts', 'environment.seed.ts',
    'public-works.seed.ts', 'urban-planning.seed.ts', 'public-safety.seed.ts',
    'public-services.seed.ts', 'tourism.seed.ts', 'finance.seed.ts',
    'administration.seed.ts', 'civil-defense.seed.ts', 'women-policies.seed.ts',
    'technology-innovation.seed.ts', 'transport-transit.seed.ts',
    'economic-development.seed.ts', 'urban-mobility.seed.ts'
]

total_com_dados = 0

for filename in secretarias:
    file_path = SERVICES_DIR / filename
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extrair serviços COM_DADOS com seus moduleTypes
        # Procurar por padrão: serviceType: 'COM_DADOS' e pegar o moduleType próximo
        services = re.findall(
            r"name:\s*['\"]([^'\"]+)['\"][\s\S]{0,500}?serviceType:\s*['\"]COM_DADOS[^'\"]*['\"][\s\S]{0,300}?moduleType:\s*['\"]([A-Z_]+)['\"]",
            content
        )

        for service_name, module_type in services:
            service_module_types[module_type].append(service_name)
            total_com_dados += 1

print(f"   Total de servicos COM_DADOS: {total_com_dados}")
print(f"   Total de moduleTypes unicos: {len(service_module_types)}")

# 3. Análise de cobertura
print("\n" + "="*80)
print("ANALISE DE COBERTURA")
print("="*80)

# ModuleTypes COM workflow customizado
with_workflow = []
for mt, services in service_module_types.items():
    if mt in workflow_module_types:
        with_workflow.append((mt, services))

# ModuleTypes SEM workflow customizado
without_workflow = []
for mt, services in service_module_types.items():
    if mt not in workflow_module_types:
        without_workflow.append((mt, services))

print(f"\n1. ModuleTypes COM workflow customizado: {len(with_workflow)}")
print(f"   Servicos cobertos: {sum(len(services) for _, services in with_workflow)}")

print(f"\n2. ModuleTypes SEM workflow customizado: {len(without_workflow)}")
print(f"   Servicos descobertos: {sum(len(services) for _, services in without_workflow)}")

# Estatísticas
servicos_com_workflow = sum(len(services) for _, services in with_workflow)
servicos_sem_workflow = sum(len(services) for _, services in without_workflow)
cobertura_pct = (servicos_com_workflow / total_com_dados * 100) if total_com_dados > 0 else 0

print(f"\n" + "="*80)
print("ESTATISTICAS")
print("="*80)
print(f"Total de servicos COM_DADOS: {total_com_dados}")
print(f"Servicos COM workflow customizado: {servicos_com_workflow} ({cobertura_pct:.1f}%)")
print(f"Servicos SEM workflow customizado: {servicos_sem_workflow} ({100-cobertura_pct:.1f}%)")
print(f"\nModuleTypes unicos COM_DADOS: {len(service_module_types)}")
print(f"ModuleTypes com workflow: {len(with_workflow)}")
print(f"ModuleTypes sem workflow: {len(without_workflow)}")

# 4. Listar os moduleTypes SEM workflow
print(f"\n" + "="*80)
print("MODULETYPES SEM WORKFLOW CUSTOMIZADO ({})".format(len(without_workflow)))
print("="*80)

# Ordenar por quantidade de serviços (maior para menor)
without_workflow_sorted = sorted(without_workflow, key=lambda x: len(x[1]), reverse=True)

for i, (module_type, services) in enumerate(without_workflow_sorted, 1):
    print(f"\n{i}. {module_type} ({len(services)} servico{'s' if len(services) > 1 else ''})")
    for service in services[:3]:  # Mostrar apenas os 3 primeiros
        print(f"   - {service}")
    if len(services) > 3:
        print(f"   ... e mais {len(services) - 3}")

# 5. Verificar workflows órfãos (existem mas não são usados)
print(f"\n" + "="*80)
print("WORKFLOWS ORFAOS (existem mas nao sao usados)")
print("="*80)

used_module_types = set(service_module_types.keys())
orphan_workflows = workflow_module_types - used_module_types

if orphan_workflows:
    print(f"\nEncontrados {len(orphan_workflows)} workflows orfaos:")
    for i, mt in enumerate(sorted(orphan_workflows), 1):
        print(f"{i}. {mt}")
else:
    print("\nNenhum workflow orfao encontrado!")

# 6. Salvar relatório
report_lines = []
report_lines.append("# Relatorio de Cobertura de Workflows Customizados\n")
report_lines.append(f"**Total de Servicos COM_DADOS:** {total_com_dados}")
report_lines.append(f"**Servicos com Workflow Customizado:** {servicos_com_workflow} ({cobertura_pct:.1f}%)")
report_lines.append(f"**Servicos sem Workflow Customizado:** {servicos_sem_workflow} ({100-cobertura_pct:.1f}%)")
report_lines.append(f"\n**ModuleTypes Unicos:** {len(service_module_types)}")
report_lines.append(f"**ModuleTypes com Workflow:** {len(with_workflow)}")
report_lines.append(f"**ModuleTypes sem Workflow:** {len(without_workflow)}")
report_lines.append("\n---\n")
report_lines.append(f"## ModuleTypes SEM Workflow Customizado ({len(without_workflow)})\n")

for module_type, services in without_workflow_sorted:
    report_lines.append(f"### {module_type} ({len(services)} servicos)")
    for service in services:
        report_lines.append(f"- {service}")
    report_lines.append("")

if orphan_workflows:
    report_lines.append("\n---\n")
    report_lines.append(f"## Workflows Orfaos ({len(orphan_workflows)})\n")
    for mt in sorted(orphan_workflows):
        report_lines.append(f"- {mt}")

report_path = Path(r"c:\Projetos Cursor\Digiurbanlite\COBERTURA_WORKFLOWS.md")
with open(report_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(report_lines))

print(f"\n\nRelatorio salvo em: {report_path}")
print("\nAnalise concluida!")
