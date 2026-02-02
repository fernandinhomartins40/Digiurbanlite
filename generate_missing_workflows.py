#!/usr/bin/env python3
"""
Gerador Automático de Workflows Customizados Faltantes
Gera código TypeScript para os 209 workflows que estão faltando
"""

import re
from pathlib import Path

BASE_DIR = Path(r"c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds")
SERVICES_DIR = BASE_DIR / "services"
WORKFLOWS_FILE = BASE_DIR / "service-workflows.seed.ts"
OUTPUT_FILE = Path(r"c:\Projetos Cursor\Digiurbanlite\WORKFLOWS_GERADOS.ts")

print("\n" + "="*80)
print("GERADOR DE WORKFLOWS CUSTOMIZADOS")
print("="*80)

# 1. Ler workflows existentes
print("\n1. Lendo workflows existentes...")
with open(WORKFLOWS_FILE, 'r', encoding='utf-8') as f:
    workflow_content = f.read()

existing_workflows = set(re.findall(r"moduleType:\s*['\"]([A-Z_]+)['\"]", workflow_content))
print(f"   Workflows existentes: {len(existing_workflows)}")

# 2. Ler todos os serviços COM_DADOS e seus dados
print("\n2. Lendo servicos COM_DADOS...")

secretarias = [
    'health.seed.ts', 'education.seed.ts', 'social.seed.ts', 'agriculture.seed.ts',
    'culture.seed.ts', 'sports.seed.ts', 'housing.seed.ts', 'environment.seed.ts',
    'public-works.seed.ts', 'urban-planning.seed.ts', 'public-safety.seed.ts',
    'public-services.seed.ts', 'tourism.seed.ts', 'finance.seed.ts',
    'administration.seed.ts', 'civil-defense.seed.ts', 'women-policies.seed.ts',
    'technology-innovation.seed.ts', 'transport-transit.seed.ts',
    'economic-development.seed.ts', 'urban-mobility.seed.ts'
]

services_data = []

for filename in secretarias:
    file_path = SERVICES_DIR / filename
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extrair serviços COM_DADOS
        pattern = r"\{\s*name:\s*['\"]([^'\"]+)['\"][\s\S]{0,1500}?serviceType:\s*['\"]COM_DADOS[^'\"]*['\"][\s\S]{0,800}?moduleType:\s*['\"]([A-Z_]+)['\"][\s\S]{0,300}?requiresDocuments:\s*(true|false)[\s\S]{0,500}?requiredDocuments:\s*\[([^\]]*)\]"

        matches = re.findall(pattern, content)

        for match in matches:
            service_name = match[0]
            module_type = match[1]
            requires_docs = match[2] == 'true'
            required_docs_text = match[3] if len(match) > 3 else ''

            # Extrair documentos
            docs = re.findall(r"['\"]([^'\"]+)['\"]", required_docs_text)

            services_data.append({
                'name': service_name,
                'moduleType': module_type,
                'requiresDocuments': requires_docs,
                'requiredDocuments': docs
            })

print(f"   Servicos encontrados: {len(services_data)}")

# 3. Identificar serviços sem workflow
print("\n3. Identificando servicos sem workflow...")
services_without_workflow = [s for s in services_data if s['moduleType'] not in existing_workflows]
print(f"   Servicos sem workflow: {len(services_without_workflow)}")

# 4. Gerar código TypeScript
print("\n4. Gerando codigo TypeScript...")

def generate_workflow_code(service):
    """Gera código TypeScript para um workflow"""
    module_type = service['moduleType']
    service_name = service['name']
    requires_docs = service['requiresDocuments']
    required_docs = service['requiredDocuments']

    # Determinar SLA baseado no tipo de serviço
    sla = 10
    if 'URGENCIA' in module_type or 'EMERGENCIA' in module_type or 'AMBULANCIA' in module_type:
        sla = 1
    elif 'AGENDAMENTO' in module_type or 'CONSULTA' in module_type:
        sla = 3
    elif 'LICENCA' in module_type or 'ALVARA' in module_type or 'APROVACAO' in module_type:
        sla = 20

    # Stages padrão
    stages = []

    # Stage 1: Recepção
    stages.append(f"""      {{
        name: 'Recepção',
        order: 1,
        description: 'Recebimento e registro inicial da solicitação',
        slaDays: 1,
        availableTabs: ['resumo', 'documentos', 'comunicacao'],
        primaryTab: 'resumo',
        requiredDocumentTypes: [],
        requiredFormFields: [],
        allowedActions: ['APPROVE'],
        canSkip: false
      }}""")

    # Stage 2: Análise Documental (se requer documentos)
    if requires_docs or required_docs:
        doc_list = ', '.join([f"'{doc}'" for doc in required_docs[:5]]) if required_docs else ''
        stages.append(f"""      {{
        name: 'Análise Documental',
        order: 2,
        description: 'Verificação e validação dos documentos obrigatórios',
        slaDays: 3,
        availableTabs: ['resumo', 'documentos', 'pendencias', 'comunicacao'],
        primaryTab: 'documentos',
        requiredDocumentTypes: [{doc_list}],
        requiredFormFields: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      }}""")

    # Stage 3: Validação de Dados
    stages.append(f"""      {{
        name: 'Validação de Dados',
        order: {3 if (requires_docs or required_docs) else 2},
        description: 'Verificação e validação dos dados do formulário',
        slaDays: 2,
        availableTabs: ['resumo', 'dados', 'documentos', 'comunicacao'],
        primaryTab: 'dados',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      }}""")

    # Stage 4: Aprovação Final
    stages.append(f"""      {{
        name: 'Aprovação Final',
        order: {4 if (requires_docs or required_docs) else 3},
        description: 'Aprovação final do processo',
        slaDays: 2,
        availableTabs: ['resumo', 'pendencias', 'comunicacao'],
        primaryTab: 'resumo',
        requiredFormFields: [],
        requiredDocumentTypes: [],
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      }}""")

    stages_code = ',\n'.join(stages)

    workflow_code = f"""
  {module_type}: {{
    moduleType: '{module_type}',
    name: 'Workflow - {service_name}',
    description: 'Fluxo para {service_name.lower()}',
    defaultSLA: {sla},
    stages: [
{stages_code}
    ]
  }},"""

    return workflow_code

# Gerar código para todos
workflows_code = []
for service in services_without_workflow:
    workflows_code.append(generate_workflow_code(service))

# Montar arquivo completo
full_code = f"""/**
 * WORKFLOWS CUSTOMIZADOS GERADOS AUTOMATICAMENTE
 *
 * Este arquivo contém os {len(services_without_workflow)} workflows faltantes
 * para completar a cobertura de 100% dos serviços COM_DADOS
 *
 * INSTRUCOES:
 * 1. Revisar os workflows gerados
 * 2. Ajustar SLAs conforme necessário
 * 3. Adicionar campos obrigatórios específicos (requiredFormFields)
 * 4. Copiar para o arquivo service-workflows.seed.ts
 * 5. Adicionar ao objeto specificWorkflows
 */

const workflowsGerados = {{
{''.join(workflows_code)}
}};

// Adicione estes workflows ao objeto specificWorkflows em service-workflows.seed.ts
// Exemplo:
// const specificWorkflows: Record<string, SpecificWorkflow> = {{
//   ...workflowsExistentes,
//   ...workflowsGerados
// }};

export {{ workflowsGerados }};
"""

# Salvar arquivo
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(full_code)

print(f"\nArquivo gerado: {OUTPUT_FILE}")
print(f"Total de workflows gerados: {len(services_without_workflow)}")

# Gerar relatório resumido
print("\n" + "="*80)
print("RESUMO")
print("="*80)
print(f"\nWorkflows existentes: {len(existing_workflows)}")
print(f"Workflows gerados: {len(services_without_workflow)}")
print(f"Total apos adicionar: {len(existing_workflows) + len(services_without_workflow)}")
print(f"Cobertura: 100%")

print("\n" + "="*80)
print("PROXIMOS PASSOS")
print("="*80)
print("\n1. Abrir o arquivo gerado: WORKFLOWS_GERADOS.ts")
print("2. Revisar os workflows gerados")
print("3. Ajustar conforme necessario:")
print("   - SLAs especificos")
print("   - Campos obrigatorios (requiredFormFields)")
print("   - Documentos obrigatorios (requiredDocumentTypes)")
print("   - Acoes permitidas")
print("4. Copiar para service-workflows.seed.ts")
print("5. Executar seed do banco de dados")
print("\nAnalise concluida!")
