#!/usr/bin/env python3
"""
Script to update all department pages to follow the agricultura pattern.
Removes duplicate sections and consolidates into 2 main sections:
1. Módulos de Gestão de Dados (COM_DADOS)
2. Serviços Gerais (SEM_DADOS) - PAINEL ÚNICO
"""

import re
import os

# Department configurations
DEPARTMENTS = [
    {
        'file': 'educacao/page.tsx',
        'slug': 'educacao',
        'icon': 'GraduationCap',
        'color': 'blue',
        'name': 'Educação',
        'hookPrefix': 'Educacao'
    },
    {
        'file': 'assistencia-social/page.tsx',
        'slug': 'assistencia-social',
        'icon': 'HandHeart',
        'color': 'pink',
        'name': 'Assistência Social',
        'hookPrefix': 'AssistenciaSocial'
    },
    {
        'file': 'cultura/page.tsx',
        'slug': 'cultura',
        'icon': 'Palette',
        'color': 'purple',
        'name': 'Cultura',
        'hookPrefix': 'Cultura'
    },
    {
        'file': 'esportes/page.tsx',
        'slug': 'esportes',
        'icon': 'Trophy',
        'color': 'orange',
        'name': 'Esportes',
        'hookPrefix': 'Esportes'
    },
    {
        'file': 'habitacao/page.tsx',
        'slug': 'habitacao',
        'icon': 'Home',
        'color': 'teal',
        'name': 'Habitação',
        'hookPrefix': 'Habitacao'
    },
    {
        'file': 'meio-ambiente/page.tsx',
        'slug': 'meio-ambiente',
        'icon': 'Leaf',
        'color': 'green',
        'name': 'Meio Ambiente',
        'hookPrefix': 'MeioAmbiente'
    },
    {
        'file': 'obras-publicas/page.tsx',
        'slug': 'obras-publicas',
        'icon': 'Construction',
        'color': 'yellow',
        'name': 'Obras Públicas',
        'hookPrefix': 'ObrasPublicas'
    },
    {
        'file': 'planejamento-urbano/page.tsx',
        'slug': 'planejamento-urbano',
        'icon': 'MapPin',
        'color': 'indigo',
        'name': 'Planejamento Urbano',
        'hookPrefix': 'PlanejamentoUrbano'
    },
    {
        'file': 'seguranca-publica/page.tsx',
        'slug': 'seguranca-publica',
        'icon': 'Shield',
        'color': 'red',
        'name': 'Segurança Pública',
        'hookPrefix': 'SegurancaPublica'
    },
    {
        'file': 'servicos-publicos/page.tsx',
        'slug': 'servicos-publicos',
        'icon': 'Wrench',
        'color': 'gray',
        'name': 'Serviços Públicos',
        'hookPrefix': 'ServicosPublicos'
    },
    {
        'file': 'turismo/page.tsx',
        'slug': 'turismo',
        'icon': 'Plane',
        'color': 'cyan',
        'name': 'Turismo',
        'hookPrefix': 'Turismo'
    },
]

BASE_PATH = r'c:\Projetos Cursor\Digiurbanlite\digiurban\frontend\app\admin\secretarias'

def find_section_boundaries(content):
    """Find where duplicate sections start and end"""

    # Find all major section markers
    patterns = {
        'modules_start': r'\/\*.*?Módulos Padrões.*?\*\/',
        'certidoes_start': r'\/\*.*?Certidões, Declarações e Documentos.*?\*\/',
        'com_dados_start': r'\/\*.*?Serviços COM_DADOS.*?\*\/',
        'disponiveis_start': r'\/\*.*?Serviços Disponíveis.*?\*\/',
        'sugestoes_start': r'\/\*.*?Sugestões Inteligentes.*?\*\/',
    }

    positions = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, content, re.DOTALL)
        if match:
            positions[key] = match.start()

    return positions

def remove_duplicate_sections(content):
    """Remove duplicate sections from the file"""

    # Pattern 1: Remove "Módulos Padrões" section (will be replaced)
    content = re.sub(
        r'\/\*.*?Módulos Padrões - .*?\*\/.*?<\/div>\s*?(?=\/\*|<\/div>|\s*$)',
        '',
        content,
        flags=re.DOTALL
    )

    # Pattern 2: Remove "Certidões, Declarações e Documentos" section
    content = re.sub(
        r'\/\*.*?Certidões, Declarações e Documentos.*?\*\/.*?<\/div>\s*?\s*?(?=\/\*|      {\/\*)',
        '',
        content,
        flags=re.DOTALL
    )

    # Pattern 3: Remove "Serviços COM_DADOS" section
    content = re.sub(
        r'\/\*.*?Serviços COM_DADOS.*?\*\/.*?<\/div>\s*?(?=\/\*|      {\/\*)',
        '',
        content,
        flags=re.DOTALL
    )

    # Pattern 4: Remove "Serviços Disponíveis" section
    content = re.sub(
        r'\/\*.*?Serviços Disponíveis.*?\*\/.*?<\/div>\s*?(?=\/\*|      {\/\*)',
        '',
        content,
        flags=re.DOTALL
    )

    return content

print("This script requires manual review and is not safe to run automatically.")
print("Please use Claude Code to make the updates file by file.")
