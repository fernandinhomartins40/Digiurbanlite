#!/usr/bin/env python3
"""
Script mais robusto para extrair e mesclar serviços
"""

import re
import os
import json

# Mapeamento de seções
SECTION_MAP = {
    'HEALTH_SERVICES': {
        'file': 'health.seed.ts',
        'export': 'healthServices',
        'name': 'Saude'
    },
    'AGRICULTURE_SERVICES': {
        'file': 'agriculture.seed.ts',
        'export': 'agricultureServices',
        'name': 'Agricultura'
    },
    'EDUCATION_SERVICES': {
        'file': 'education.seed.ts',
        'export': 'educationServices',
        'name': 'Educacao'
    },
    'SOCIAL_SERVICES': {
        'file': 'social.seed.ts',
        'export': 'socialServices',
        'name': 'Assistencia Social'
    },
    'CULTURE_SERVICES': {
        'file': 'culture.seed.ts',
        'export': 'cultureServices',
        'name': 'Cultura'
    },
    'SPORTS_SERVICES': {
        'file': 'sports.seed.ts',
        'export': 'sportsServices',
        'name': 'Esportes'
    },
    'HOUSING_SERVICES': {
        'file': 'housing.seed.ts',
        'export': 'housingServices',
        'name': 'Habitacao'
    },
    'ENVIRONMENT_SERVICES': {
        'file': 'environment.seed.ts',
        'export': 'environmentServices',
        'name': 'Meio Ambiente'
    },
    'PUBLIC_WORKS_SERVICES': {
        'file': 'public-works.seed.ts',
        'export': 'publicWorksServices',
        'name': 'Obras Publicas'
    },
    'URBAN_PLANNING_SERVICES': {
        'file': 'urban-planning.seed.ts',
        'export': 'urbanPlanningServices',
        'name': 'Planejamento Urbano'
    },
    'SECURITY_SERVICES': {
        'file': 'public-safety.seed.ts',
        'export': 'publicSafetyServices',
        'name': 'Seguranca Publica'
    },
    'PUBLIC_SERVICES': {
        'file': 'public-services.seed.ts',
        'export': 'publicServices',
        'name': 'Servicos Publicos'
    },
    'TOURISM_SERVICES': {
        'file': 'tourism.seed.ts',
        'export': 'tourismServices',
        'name': 'Turismo'
    },
}

def extract_section_raw(content, section_name):
    """Extrai a seção completa como texto"""
    # Encontra o início da seção
    pattern = f'const {section_name}: ServiceDefinition\\[\\] = \\['
    start_idx = content.find(pattern)

    if start_idx == -1:
        return None

    # Encontra o fim da seção (próximo ];)
    # Conta colchetes para encontrar o fechamento correto
    bracket_count = 0
    in_array = False
    end_idx = start_idx

    for i in range(start_idx, len(content)):
        if content[i] == '[':
            bracket_count += 1
            in_array = True
        elif content[i] == ']':
            bracket_count -= 1
            if in_array and bracket_count == 0:
                # Procura o ; após o ]
                for j in range(i, min(i + 10, len(content))):
                    if content[j] == ';':
                        end_idx = j + 1
                        break
                break

    return content[start_idx:end_idx]

def extract_services_from_section(section_content):
    """Extrai serviços individuais de uma seção"""
    services = []

    # Encontra cada objeto { ... },
    i = 0
    while i < len(section_content):
        # Procura próximo {
        start = section_content.find('{', i)
        if start == -1:
            break

        # Conta chaves para encontrar o fechamento
        brace_count = 0
        end = start

        for j in range(start, len(section_content)):
            if section_content[j] == '{':
                brace_count += 1
            elif section_content[j] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end = j + 1
                    break

        if end > start:
            service_code = section_content[start:end]

            # Extrai o nome do serviço
            name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", service_code)
            if name_match:
                services.append({
                    'name': name_match.group(1),
                    'code': service_code
                })

        i = end

    return services

def read_existing_services(filepath):
    """Lê nomes dos serviços existentes em um arquivo seed"""
    if not os.path.exists(filepath):
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrai nomes
    names = re.findall(r"name:\s*['\"]([^'\"]+)['\"]", content)
    return names

def add_services_to_seed(filepath, new_services, export_name):
    """Adiciona novos serviços a um arquivo seed existente"""
    if not os.path.exists(filepath):
        print(f"ERRO: Arquivo nao existe: {filepath}")
        return 0

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Encontra o último ]; do array de serviços
    # Procura por "export const XXXX: ServiceDefinition[] = ["
    export_pattern = f'export const {export_name}: ServiceDefinition\\[\\] = \\['
    array_start = content.find(export_pattern)

    if array_start == -1:
        print(f"ERRO: Nao encontrado array de servicos em {filepath}")
        return 0

    # Encontra o ]; que fecha o array
    bracket_count = 0
    in_array = False
    close_bracket_pos = array_start

    for i in range(array_start, len(content)):
        if content[i] == '[':
            bracket_count += 1
            in_array = True
        elif content[i] == ']':
            bracket_count -= 1
            if in_array and bracket_count == 0:
                close_bracket_pos = i
                break

    # Insere os novos serviços antes do ]
    before_close = content[:close_bracket_pos].rstrip()

    # Adiciona vírgula se necessário
    if not before_close.endswith('['):
        before_close += ','

    # Adiciona os novos serviços
    new_services_str = ''
    for i, service in enumerate(new_services):
        # Indenta o código
        lines = service['code'].split('\n')
        indented_lines = []
        for line in lines:
            if line.strip():
                indented_lines.append('  ' + line)
            else:
                indented_lines.append(line)

        service_indented = '\n'.join(indented_lines)

        if i < len(new_services) - 1:
            new_services_str += '\n' + service_indented + ','
        else:
            new_services_str += '\n' + service_indented

    # Monta o conteúdo final
    after_close = content[close_bracket_pos:]
    final_content = before_close + new_services_str + '\n' + after_close

    # Salva
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)

    return len(new_services)

def main():
    source_file = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services-simplified-complete.ts'
    output_dir = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services'

    # Lê arquivo fonte
    print("Lendo arquivo fonte...")
    with open(source_file, 'r', encoding='utf-8') as f:
        source_content = f.read()

    print("Processando secoes...\n")

    total_added = 0

    for section_key, info in SECTION_MAP.items():
        print(f"{info['name']:25}", end=" ")

        # Extrai seção da fonte
        section_content = extract_section_raw(source_content, section_key)

        if not section_content:
            print(f"  AVISO: Secao {section_key} nao encontrada")
            continue

        # Extrai serviços da seção
        source_services = extract_services_from_section(section_content)

        # Lê serviços existentes
        filepath = os.path.join(output_dir, info['file'])
        existing_names = read_existing_services(filepath)

        # Identifica faltantes
        missing = [s for s in source_services if s['name'] not in existing_names]

        if missing:
            # Adiciona ao arquivo
            added = add_services_to_seed(filepath, missing, info['export'])
            total_added += added
            print(f": {added:2} servicos adicionados ({len(existing_names):2} -> {len(existing_names) + added:2})")
        else:
            print(f": OK - Completo ({len(source_services)} servicos)")

    print(f"\n{'='*60}")
    print(f"TOTAL: {total_added} servicos adicionados")

if __name__ == '__main__':
    main()
