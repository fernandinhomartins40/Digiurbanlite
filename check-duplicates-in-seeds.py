#!/usr/bin/env python3
"""
Analisa cada arquivo de seed modular para verificar duplicações
"""

import re
import os
from collections import Counter

SEED_FILES = [
    'health.seed.ts',
    'agriculture.seed.ts',
    'education.seed.ts',
    'social.seed.ts',
    'culture.seed.ts',
    'sports.seed.ts',
    'housing.seed.ts',
    'environment.seed.ts',
    'public-works.seed.ts',
    'urban-planning.seed.ts',
    'public-safety.seed.ts',
    'public-services.seed.ts',
    'tourism.seed.ts',
]

def extract_service_names(filepath):
    """Extrai todos os nomes de serviços de um arquivo"""
    if not os.path.exists(filepath):
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrai todos os name: 'XXX'
    pattern = r"name:\s*['\"]([^'\"]+)['\"]"
    names = re.findall(pattern, content)

    return names

def main():
    seeds_dir = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services'

    print("="*80)
    print("ANALISE DE DUPLICACOES NOS SEEDS MODULARES")
    print("="*80)
    print()

    total_services = 0
    total_duplicates = 0
    files_with_duplicates = []

    for seed_file in SEED_FILES:
        filepath = os.path.join(seeds_dir, seed_file)

        if not os.path.exists(filepath):
            print(f"AVISO: {seed_file} nao encontrado")
            continue

        # Extrai nomes
        names = extract_service_names(filepath)

        # Conta duplicatas
        name_counts = Counter(names)
        duplicates = {name: count for name, count in name_counts.items() if count > 1}

        total_services += len(names)

        if duplicates:
            total_duplicates += sum(count - 1 for count in duplicates.values())
            files_with_duplicates.append({
                'file': seed_file,
                'duplicates': duplicates,
                'total': len(names),
                'unique': len(name_counts)
            })

            print(f"[DUPLICADOS] {seed_file}")
            print(f"  Total de servicos: {len(names)}")
            print(f"  Servicos unicos: {len(name_counts)}")
            print(f"  Duplicacoes encontradas: {len(duplicates)}")
            for name, count in duplicates.items():
                print(f"    - '{name}' aparece {count}x (duplicado {count-1}x)")
            print()
        else:
            print(f"[OK] {seed_file}")
            print(f"  Total de servicos: {len(names)} (todos unicos)")
            print()

    print("="*80)
    print("RESUMO")
    print("="*80)
    print(f"Total de servicos encontrados: {total_services}")
    print(f"Total de duplicacoes: {total_duplicates}")
    print(f"Arquivos com duplicacoes: {len(files_with_duplicates)}")

    if files_with_duplicates:
        print()
        print("ACAO NECESSARIA:")
        print("  Remover as duplicacoes dos seguintes arquivos:")
        for item in files_with_duplicates:
            print(f"    - {item['file']}: {sum(c-1 for c in item['duplicates'].values())} duplicacoes")
    else:
        print()
        print("RESULTADO: Nenhuma duplicacao encontrada! Todos os seeds estao limpos.")

    print("="*80)

if __name__ == '__main__':
    main()
