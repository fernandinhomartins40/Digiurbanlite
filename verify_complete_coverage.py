#!/usr/bin/env python3
"""
Verificação Completa de Cobertura de Workflows
Identifica exatamente quais serviços NÃO têm workflow
"""

import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(r"c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds")
SERVICES_DIR = BASE_DIR / "services"
WORKFLOWS_FILE = BASE_DIR / "service-workflows.seed.ts"
GENERATED_FILE = Path(r"c:\Projetos Cursor\Digiurbanlite\WORKFLOWS_GERADOS.ts")

print("\n" + "="*80)
print("VERIFICACAO COMPLETA DE COBERTURA")
print("="*80)

# 1. Ler workflows existentes no arquivo original
print("\n1. Lendo workflows EXISTENTES...")
with open(WORKFLOWS_FILE, 'r', encoding='utf-8') as f:
    existing_content = f.read()

existing_workflows = set(re.findall(r"moduleType:\s*['\"]([A-Z_]+)['\"]", existing_content))
print(f"   Workflows no arquivo original: {len(existing_workflows)}")

# 2. Ler workflows gerados
print("\n2. Lendo workflows GERADOS...")
with open(GENERATED_FILE, 'r', encoding='utf-8') as f:
    generated_content = f.read()

generated_workflows = set(re.findall(r"moduleType:\s*['\"]([A-Z_]+)['\"]", generated_content))
print(f"   Workflows gerados: {len(generated_workflows)}")

# 3. Total de workflows disponíveis
total_workflows = existing_workflows | generated_workflows
print(f"\n3. Total de workflows (existentes + gerados): {len(total_workflows)}")

# 4. Ler TODOS os serviços COM_DADOS
print("\n4. Lendo TODOS os servicos COM_DADOS...")

secretarias = [
    'health.seed.ts', 'education.seed.ts', 'social.seed.ts', 'agriculture.seed.ts',
    'culture.seed.ts', 'sports.seed.ts', 'housing.seed.ts', 'environment.seed.ts',
    'public-works.seed.ts', 'urban-planning.seed.ts', 'public-safety.seed.ts',
    'public-services.seed.ts', 'tourism.seed.ts', 'finance.seed.ts',
    'administration.seed.ts', 'civil-defense.seed.ts', 'women-policies.seed.ts',
    'technology-innovation.seed.ts', 'transport-transit.seed.ts',
    'economic-development.seed.ts', 'urban-mobility.seed.ts'
]

all_services = []
moduletypes_com_dados = {}

for filename in secretarias:
    file_path = SERVICES_DIR / filename
    if not file_path.exists():
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Padrão mais robusto para capturar serviços
    lines = content.split('\n')
    in_service = False
    current_service = {}
    brace_count = 0

    for i, line in enumerate(lines):
        # Detectar início de objeto de serviço
        if 'name:' in line and ('{' in line or (i > 0 and '{' in lines[i-1])):
            in_service = True
            current_service = {'secretaria': filename}
            brace_count = line.count('{') - line.count('}')

            # Extrair name
            name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", line)
            if name_match:
                current_service['name'] = name_match.group(1)

        if in_service:
            brace_count += line.count('{') - line.count('}')

            # Extrair campos
            if 'serviceType:' in line:
                type_match = re.search(r"serviceType:\s*['\"]([^'\"]+)['\"]", line)
                if type_match:
                    current_service['serviceType'] = type_match.group(1)

            if 'moduleType:' in line:
                module_match = re.search(r"moduleType:\s*['\"]([A-Z_]+)['\"]", line)
                if module_match:
                    current_service['moduleType'] = module_match.group(1)

            # Fim do objeto
            if brace_count <= 0 and '}' in line:
                if 'serviceType' in current_service and 'COM_DADOS' in current_service.get('serviceType', ''):
                    if 'moduleType' in current_service:
                        all_services.append(current_service)
                        moduletypes_com_dados[current_service['moduleType']] = current_service['name']
                in_service = False
                current_service = {}

print(f"   Total de servicos COM_DADOS: {len(all_services)}")
print(f"   ModuleTypes unicos COM_DADOS: {len(moduletypes_com_dados)}")

# 5. Identificar serviços SEM workflow
print("\n" + "="*80)
print("ANALISE DE COBERTURA")
print("="*80)

services_without_workflow = []
for service in all_services:
    module_type = service.get('moduleType')
    if module_type and module_type not in total_workflows:
        services_without_workflow.append(service)

moduletypes_without_workflow = set([s['moduleType'] for s in services_without_workflow])

print(f"\nServicos COM_DADOS sem workflow: {len(services_without_workflow)}")
print(f"ModuleTypes unicos sem workflow: {len(moduletypes_without_workflow)}")

# 6. Calcular cobertura
services_with_workflow = len(all_services) - len(services_without_workflow)
coverage = (services_with_workflow / len(all_services) * 100) if len(all_services) > 0 else 0

print(f"\nCobertura atual:")
print(f"  - Servicos COM workflow: {services_with_workflow} ({coverage:.1f}%)")
print(f"  - Servicos SEM workflow: {len(services_without_workflow)} ({100-coverage:.1f}%)")

# 7. Listar serviços sem workflow
if services_without_workflow:
    print("\n" + "="*80)
    print(f"SERVICOS SEM WORKFLOW ({len(services_without_workflow)})")
    print("="*80)

    # Agrupar por moduleType
    by_module = defaultdict(list)
    for service in services_without_workflow:
        by_module[service['moduleType']].append(service['name'])

    print(f"\nModuleTypes sem workflow: {len(by_module)}")
    for i, (module_type, service_names) in enumerate(sorted(by_module.items()), 1):
        print(f"\n{i}. {module_type}")
        for name in service_names:
            print(f"   - {name}")

# 8. Verificar workflows órfãos (existem mas não são usados)
print("\n" + "="*80)
print("WORKFLOWS ORFAOS")
print("="*80)

all_moduletypes_used = set(moduletypes_com_dados.keys())
orphan_workflows = total_workflows - all_moduletypes_used

print(f"\nWorkflows que existem mas nao sao usados: {len(orphan_workflows)}")
if orphan_workflows:
    for i, wf in enumerate(sorted(orphan_workflows), 1):
        print(f"{i}. {wf}")

# 9. Estatísticas finais
print("\n" + "="*80)
print("ESTATISTICAS FINAIS")
print("="*80)

print(f"\nSERVICOS:")
print(f"  Total de servicos COM_DADOS: {len(all_services)}")
print(f"  ModuleTypes unicos: {len(moduletypes_com_dados)}")

print(f"\nWORKFLOWS:")
print(f"  Workflows existentes (arquivo original): {len(existing_workflows)}")
print(f"  Workflows gerados: {len(generated_workflows)}")
print(f"  Total de workflows disponiveis: {len(total_workflows)}")
print(f"  Workflows orfaos (nao usados): {len(orphan_workflows)}")

print(f"\nCOBERTURA:")
print(f"  Servicos cobertos: {services_with_workflow} ({coverage:.1f}%)")
print(f"  Servicos descobertos: {len(services_without_workflow)} ({100-coverage:.1f}%)")

deficit = len(moduletypes_com_dados) - len(total_workflows) + len(orphan_workflows)
print(f"\nDEFICIT DE WORKFLOWS: {deficit}")

# 10. Salvar relatório
report_lines = []
report_lines.append("# Verificacao Completa de Cobertura de Workflows\n")
report_lines.append(f"**Total de Servicos COM_DADOS:** {len(all_services)}")
report_lines.append(f"**ModuleTypes Unicos:** {len(moduletypes_com_dados)}")
report_lines.append(f"\n**Workflows Existentes:** {len(existing_workflows)}")
report_lines.append(f"**Workflows Gerados:** {len(generated_workflows)}")
report_lines.append(f"**Total Workflows Disponiveis:** {len(total_workflows)}")
report_lines.append(f"**Workflows Orfaos:** {len(orphan_workflows)}")
report_lines.append(f"\n**Cobertura:** {coverage:.1f}%")
report_lines.append(f"**Deficit de Workflows:** {deficit}")

if services_without_workflow:
    report_lines.append(f"\n---\n## Servicos SEM Workflow ({len(services_without_workflow)})\n")
    for module_type, service_names in sorted(by_module.items()):
        report_lines.append(f"### {module_type}")
        for name in service_names:
            report_lines.append(f"- {name}")
        report_lines.append("")

if orphan_workflows:
    report_lines.append(f"\n---\n## Workflows Orfaos ({len(orphan_workflows)})\n")
    for wf in sorted(orphan_workflows):
        report_lines.append(f"- {wf}")

report_path = Path(r"c:\Projetos Cursor\Digiurbanlite\VERIFICACAO_COBERTURA_COMPLETA.md")
with open(report_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(report_lines))

print(f"\n\nRelatorio salvo em: {report_path}")
print("\nAnalise concluida!")
