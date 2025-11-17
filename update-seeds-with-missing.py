#!/usr/bin/env python3
"""
Script para extrair serviços faltantes de services-simplified-complete.ts
e adicionar aos seeds modulares existentes
"""

import re
import os

# Mapeamento de seções
SECTIONS = {
    'HEALTH_SERVICES': {
        'file': 'health.seed.ts',
        'name': 'Saúde',
        'export': 'healthServices',
        'dept_code': 'SAUDE'
    },
    'EDUCATION_SERVICES': {
        'file': 'education.seed.ts',
        'name': 'Educação',
        'export': 'educationServices',
        'dept_code': 'EDUCACAO'
    },
    'SOCIAL_SERVICES': {
        'file': 'social.seed.ts',
        'name': 'Assistência Social',
        'export': 'socialServices',
        'dept_code': 'ASSISTENCIA_SOCIAL'
    },
    'AGRICULTURE_SERVICES': {
        'file': 'agriculture.seed.ts',
        'name': 'Agricultura',
        'export': 'agricultureServices',
        'dept_code': 'AGRICULTURA'
    },
    'CULTURE_SERVICES': {
        'file': 'culture.seed.ts',
        'name': 'Cultura',
        'export': 'cultureServices',
        'dept_code': 'CULTURA'
    },
    'SPORTS_SERVICES': {
        'file': 'sports.seed.ts',
        'name': 'Esportes',
        'export': 'sportsServices',
        'dept_code': 'ESPORTES'
    },
    'HOUSING_SERVICES': {
        'file': 'housing.seed.ts',
        'name': 'Habitação',
        'export': 'housingServices',
        'dept_code': 'HABITACAO'
    },
    'ENVIRONMENT_SERVICES': {
        'file': 'environment.seed.ts',
        'name': 'Meio Ambiente',
        'export': 'environmentServices',
        'dept_code': 'MEIO_AMBIENTE'
    },
    'PUBLIC_WORKS_SERVICES': {
        'file': 'public-works.seed.ts',
        'name': 'Obras Públicas',
        'export': 'publicWorksServices',
        'dept_code': 'OBRAS_PUBLICAS'
    },
    'PUBLIC_SAFETY_SERVICES': {
        'file': 'public-safety.seed.ts',
        'name': 'Segurança Pública',
        'export': 'publicSafetyServices',
        'dept_code': 'SEGURANCA_PUBLICA'
    },
    'PUBLIC_SERVICES': {
        'file': 'public-services.seed.ts',
        'name': 'Serviços Públicos',
        'export': 'publicServices',
        'dept_code': 'SERVICOS_PUBLICOS'
    },
    'TOURISM_SERVICES': {
        'file': 'tourism.seed.ts',
        'name': 'Turismo',
        'export': 'tourismServices',
        'dept_code': 'TURISMO'
    },
    'URBAN_PLANNING_SERVICES': {
        'file': 'urban-planning.seed.ts',
        'name': 'Planejamento Urbano',
        'export': 'urbanPlanningServices',
        'dept_code': 'PLANEJAMENTO_URBANO'
    },
}

def extract_service_names_from_array(content, section_name):
    """Extrai apenas os nomes dos serviços de uma seção"""
    pattern = f'const {section_name}: ServiceDefinition\\[\\] = \\['
    start_pos = content.find(pattern)

    if start_pos == -1:
        return []

    # Encontra o fim da seção
    bracket_count = 0
    found_opening = False
    end_pos = len(content)

    for i in range(start_pos, len(content)):
        if content[i] == '[':
            bracket_count += 1
            found_opening = True
        elif content[i] == ']':
            bracket_count -= 1
            if found_opening and bracket_count == 0:
                end_pos = i + 1
                break

    section_content = content[start_pos:end_pos]

    # Extrai os nomes dos serviços
    name_pattern = r"name:\s*['\"]([^'\"]+)['\"]"
    names = re.findall(name_pattern, section_content)

    return names

def extract_individual_services(content, section_name):
    """Extrai cada serviço individual como objeto completo"""
    pattern = f'const {section_name}: ServiceDefinition\\[\\] = \\['
    start_pos = content.find(pattern)

    if start_pos == -1:
        return []

    # Encontra o fim da seção
    bracket_count = 0
    found_opening = False
    end_pos = len(content)

    for i in range(start_pos, len(content)):
        if content[i] == '[':
            bracket_count += 1
            found_opening = True
        elif content[i] == ']':
            bracket_count -= 1
            if found_opening and bracket_count == 0:
                end_pos = i + 1
                break

    section_content = content[start_pos:end_pos]

    # Extrai cada serviço individual (objetos entre { e },)
    services = []
    current_pos = 0

    while True:
        # Procura próximo serviço começando com {
        start_brace = section_content.find('{', current_pos)
        if start_brace == -1:
            break

        # Conta chaves para encontrar o fim do objeto
        brace_count = 0
        end_brace = start_brace

        for i in range(start_brace, len(section_content)):
            if section_content[i] == '{':
                brace_count += 1
            elif section_content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_brace = i + 1
                    break

        service_obj = section_content[start_brace:end_brace]

        # Extrai o nome do serviço
        name_match = re.search(r"name:\s*['\"]([^'\"]+)['\"]", service_obj)
        if name_match:
            services.append({
                'name': name_match.group(1),
                'code': service_obj
            })

        current_pos = end_brace

    return services

def read_existing_seed(filepath):
    """Lê um arquivo de seed existente e retorna os nomes dos serviços"""
    if not os.path.exists(filepath):
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrai os nomes dos serviços existentes
    name_pattern = r"name:\s*['\"]([^'\"]+)['\"]"
    names = re.findall(name_pattern, content)

    return names

def update_seed_file(output_dir, file_info, new_services):
    """Adiciona novos serviços a um arquivo de seed existente"""
    filepath = os.path.join(output_dir, file_info['file'])

    if not os.path.exists(filepath):
        print(f"ERRO: Arquivo nao encontrado: {file_info['file']}")
        return 0

    # Lê o arquivo existente
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Encontra a posição antes do ]; final
    # Procura pelo último ];
    last_bracket = content.rfind('];')

    if last_bracket == -1:
        print(f"ERRO: Nao encontrado ]; no arquivo {file_info['file']}")
        return 0

    # Insere os novos serviços antes do ];
    # Remove o ]; temporariamente
    content_before = content[:last_bracket].rstrip()

    # Adiciona vírgula se necessário (se já existem serviços)
    if not content_before.endswith('['):
        content_before += ','

    # Adiciona os novos serviços
    new_services_code = []
    for service in new_services:
        # Indenta o código do serviço
        service_lines = service['code'].split('\n')
        indented = '\n'.join(['  ' + line if line.strip() else line for line in service_lines])
        new_services_code.append(indented)

    # Junta tudo
    updated_content = content_before + '\n' + ',\n'.join(new_services_code) + '\n];\n'

    # Salva o arquivo atualizado
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(updated_content)

    return len(new_services)

def main():
    source_file = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services-simplified-complete.ts'
    output_dir = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services'

    # Lê o arquivo fonte
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()

    print("Analisando servicos faltantes e atualizando seeds...\n")

    total_added = 0

    # Para cada seção
    for section_name, file_info in SECTIONS.items():
        filepath = os.path.join(output_dir, file_info['file'])

        # Extrai serviços da fonte
        source_services = extract_individual_services(content, section_name)

        # Lê serviços existentes
        existing_names = read_existing_seed(filepath)

        # Identifica serviços faltantes
        missing_services = [s for s in source_services if s['name'] not in existing_names]

        if missing_services:
            added = update_seed_file(output_dir, file_info, missing_services)
            total_added += added
            print(f"OK {file_info['name']}: {added} servicos adicionados (total agora: {len(existing_names) + added})")
        else:
            print(f"OK {file_info['name']}: Nenhum servico faltante (total: {len(existing_names)})")

    print(f"\nOK Atualizacao concluida: {total_added} servicos adicionados no total")

if __name__ == '__main__':
    main()
