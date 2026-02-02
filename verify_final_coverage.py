import re
from collections import defaultdict

# Ler o arquivo de workflows
with open(r'digiurban\backend\prisma\seeds\service-workflows.seed.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extrair todos os MODULE_TYPEs do specificWorkflows
pattern = r"^\s+([A-Z_]+):\s*\{$"
workflows_in_file = []

in_specific_workflows = False
for line in content.split('\n'):
    if 'const specificWorkflows' in line:
        in_specific_workflows = True
        continue
    if in_specific_workflows and line.strip() == '};':
        break
    if in_specific_workflows:
        match = re.match(pattern, line)
        if match:
            workflows_in_file.append(match.group(1))

print("=" * 80)
print("VERIFICACAO FINAL DE COBERTURA DE WORKFLOWS")
print("=" * 80)
print(f"\n[OK] Total de workflows especificos encontrados: {len(workflows_in_file)}")

# Ler a lista de workflows que deveriam estar presentes
with open('WORKFLOWS_FALTANTES_LISTA.txt', 'r', encoding='utf-8') as f:
    expected_workflows = []
    for line in f:
        # Remove espaços e pega o nome do workflow
        workflow = line.strip()
        # Se tem seta, pega o que vem depois
        if '→' in workflow:
            workflow = workflow.split('→')[1].strip()
        if workflow and workflow[0].isupper():
            expected_workflows.append(workflow)

print(f"[OK] Total de workflows esperados da lista: {len(expected_workflows)}")

# Verificar quais estão presentes
missing = []
present = []
for wf in expected_workflows:
    if wf in workflows_in_file:
        present.append(wf)
    else:
        missing.append(wf)

print(f"\n[OK] Workflows presentes: {len(present)}/{len(expected_workflows)}")
print(f"[ATENCAO] Workflows faltantes: {len(missing)}/{len(expected_workflows)}")

if missing:
    print("\n[ATENCAO] WORKFLOWS AINDA FALTANTES:")
    for i, wf in enumerate(missing, 1):
        print(f"   {i}. {wf}")
else:
    print("\n[SUCESSO] TODOS OS WORKFLOWS DA LISTA FORAM ADICIONADOS!")

# Verificar duplicatas
duplicates = []
seen = set()
for wf in workflows_in_file:
    if wf in seen:
        duplicates.append(wf)
    seen.add(wf)

if duplicates:
    print(f"\n[ATENCAO] WORKFLOWS DUPLICADOS ENCONTRADOS: {len(duplicates)}")
    for dup in duplicates:
        print(f"   - {dup}")
else:
    print("\n[OK] Nenhum workflow duplicado encontrado")

print("\n" + "=" * 80)
print("RESUMO FINAL")
print("=" * 80)
print(f"Workflows especificos no arquivo: {len(workflows_in_file)}")
print(f"Workflows da lista implementados: {len(present)}/{len(expected_workflows)}")
if len(expected_workflows) > 0:
    print(f"Cobertura: {len(present)/len(expected_workflows)*100:.1f}%")
else:
    print("Cobertura: N/A (lista vazia)")
print("=" * 80)
