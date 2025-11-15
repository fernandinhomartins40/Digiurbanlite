#!/usr/bin/env python3
"""
Analisa o arquivo services-simplified-complete.ts para contar serviços por seção
"""

import re

def count_services_in_section(content, section_name):
    """Conta serviços em uma seção específica"""
    pattern = f'const {section_name}: ServiceDefinition\\[\\] = \\['
    start_pos = content.find(pattern)

    if start_pos == -1:
        return 0

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

    # Conta os serviços (name: ')
    count = section_content.count("name: '")

    return count

def extract_service_names(content, section_name):
    """Extrai nomes dos serviços de uma seção"""
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

def main():
    source_file = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services-simplified-complete.ts'

    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()

    sections = {
        'HEALTH_SERVICES': 'Saude',
        'AGRICULTURE_SERVICES': 'Agricultura',
        'EDUCATION_SERVICES': 'Educacao',
        'SOCIAL_SERVICES': 'Assistencia Social',
        'CULTURE_SERVICES': 'Cultura',
        'SPORTS_SERVICES': 'Esportes',
        'HOUSING_SERVICES': 'Habitacao',
        'ENVIRONMENT_SERVICES': 'Meio Ambiente',
        'PUBLIC_WORKS_SERVICES': 'Obras Publicas',
        'URBAN_PLANNING_SERVICES': 'Planejamento Urbano',
        'SECURITY_SERVICES': 'Seguranca Publica',
        'PUBLIC_SERVICES': 'Servicos Publicos',
        'TOURISM_SERVICES': 'Turismo',
    }

    print("Analise de services-simplified-complete.ts\n")
    print("=" * 60)

    total = 0
    for section_key, section_name in sections.items():
        count = count_services_in_section(content, section_key)
        total += count
        print(f"{section_name:25} : {count:3} servicos")

    print("=" * 60)
    print(f"{'TOTAL':25} : {total:3} servicos")

    # Agora vamos comparar com os seeds modulares
    print("\n\nComparacao com seeds modulares:\n")
    print("=" * 60)

    modular_dir = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services'

    section_files = {
        'HEALTH_SERVICES': 'health.seed.ts',
        'AGRICULTURE_SERVICES': 'agriculture.seed.ts',
        'EDUCATION_SERVICES': 'education.seed.ts',
        'SOCIAL_SERVICES': 'social.seed.ts',
        'CULTURE_SERVICES': 'culture.seed.ts',
        'SPORTS_SERVICES': 'sports.seed.ts',
        'HOUSING_SERVICES': 'housing.seed.ts',
        'ENVIRONMENT_SERVICES': 'environment.seed.ts',
        'PUBLIC_WORKS_SERVICES': 'public-works.seed.ts',
        'URBAN_PLANNING_SERVICES': 'urban-planning.seed.ts',
        'SECURITY_SERVICES': 'public-safety.seed.ts',
        'PUBLIC_SERVICES': 'public-services.seed.ts',
        'TOURISM_SERVICES': 'tourism.seed.ts',
    }

    total_modular = 0
    total_missing = 0

    for section_key, filename in section_files.items():
        filepath = f"{modular_dir}\\{filename}"

        # Conta serviços no arquivo modular
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                modular_content = f.read()
            modular_count = modular_content.count("name: '")
        except:
            modular_count = 0

        # Conta serviços na fonte
        source_count = count_services_in_section(content, section_key)

        missing = source_count - modular_count
        total_modular += modular_count
        total_missing += missing

        section_name = sections[section_key]

        status = "OK" if missing == 0 else "FALTAM"
        print(f"{section_name:25} : {modular_count:3} / {source_count:3} ({status} {missing})")

    print("=" * 60)
    print(f"{'TOTAL':25} : {total_modular:3} / {total:3} (FALTAM {total_missing})")

    # Detalha serviços faltantes por seção
    print("\n\nServicos faltantes por secao:\n")
    print("=" * 80)

    for section_key, filename in section_files.items():
        filepath = f"{modular_dir}\\{filename}"
        section_name = sections[section_key]

        # Extrai nomes da fonte
        source_names = extract_service_names(content, section_key)

        # Extrai nomes do modular
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                modular_content = f.read()
            name_pattern = r"name:\s*['\"]([^'\"]+)['\"]"
            modular_names = re.findall(name_pattern, modular_content)
        except:
            modular_names = []

        # Identifica faltantes
        missing_names = [name for name in source_names if name not in modular_names]

        if missing_names:
            print(f"\n{section_name} ({len(missing_names)} faltantes):")
            for i, name in enumerate(missing_names, 1):
                print(f"  {i:2}. {name}")

if __name__ == '__main__':
    main()
