#!/usr/bin/env python3
"""
Script para extrair seções de serviços do arquivo services-final.ts
e criar seeds modulares por secretaria
"""

import re
import os

# Mapeamento de seções
SECTIONS = {
    'HEALTH_SERVICES': {
        'file': 'health.seed.ts',
        'name': 'Saúde',
        'export': 'healthServices'
    },
    'EDUCATION_SERVICES': {
        'file': 'education.seed.ts',
        'name': 'Educação',
        'export': 'educationServices'
    },
    'SOCIAL_SERVICES': {
        'file': 'social.seed.ts',
        'name': 'Assistência Social',
        'export': 'socialServices'
    },
    'AGRICULTURE_SERVICES': {
        'file': 'agriculture.seed.ts',
        'name': 'Agricultura',
        'export': 'agricultureServices'
    },
    'CULTURE_SERVICES': {
        'file': 'culture.seed.ts',
        'name': 'Cultura',
        'export': 'cultureServices'
    },
    'SPORTS_SERVICES': {
        'file': 'sports.seed.ts',
        'name': 'Esportes',
        'export': 'sportsServices'
    },
    'HOUSING_SERVICES': {
        'file': 'housing.seed.ts',
        'name': 'Habitação',
        'export': 'housingServices'
    },
    'ENVIRONMENT_SERVICES': {
        'file': 'environment.seed.ts',
        'name': 'Meio Ambiente',
        'export': 'environmentServices'
    },
    'PUBLIC_WORKS_SERVICES': {
        'file': 'public-works.seed.ts',
        'name': 'Obras Públicas',
        'export': 'publicWorksServices'
    },
    'PUBLIC_SAFETY_SERVICES': {
        'file': 'public-safety.seed.ts',
        'name': 'Segurança Pública',
        'export': 'publicSafetyServices'
    },
    'PUBLIC_SERVICES': {
        'file': 'public-services.seed.ts',
        'name': 'Serviços Públicos',
        'export': 'publicServices'
    },
    'TOURISM_SERVICES': {
        'file': 'tourism.seed.ts',
        'name': 'Turismo',
        'export': 'tourismServices'
    },
    'URBAN_PLANNING_SERVICES': {
        'file': 'urban-planning.seed.ts',
        'name': 'Planejamento Urbano',
        'export': 'urbanPlanningServices'
    },
}

def extract_section(content, section_name):
    """Extrai uma seção específica do arquivo"""
    # Procura o início da seção - procurar linha por linha
    pattern = f'const {section_name}: ServiceDefinition[] = ['

    start_pos = content.find(pattern)

    if start_pos == -1:
        return None

    # Encontra o próximo "const" ou fim do arquivo para delimitar o fim da seção
    # Procura pelo ]; seguido de nova linha e depois comentário ou const
    end_marker_patterns = [
        '\n];\n\n//',  # ]; seguido de comentário
        '\n];\n\nexport',  # ]; seguido de export
        '\n];\n\n// ====',  # ]; seguido de separador
    ]

    end_pos = len(content)
    for marker in end_marker_patterns:
        pos = content.find(marker, start_pos)
        if pos != -1 and pos < end_pos:
            end_pos = pos + len('\n];')
            break

    # Se não encontrou marcador, procura apenas pelo ];
    if end_pos == len(content):
        # Procura o ]; que fecha o array
        search_pos = start_pos
        bracket_count = 0
        found_opening = False

        for i in range(start_pos, len(content)):
            if content[i] == '[':
                bracket_count += 1
                found_opening = True
            elif content[i] == ']':
                bracket_count -= 1
                if found_opening and bracket_count == 0:
                    # Procura o ; após o ]
                    if i + 1 < len(content) and content[i + 1] == ';':
                        end_pos = i + 2
                    else:
                        end_pos = i + 1
                    break

    section_code = content[start_pos:end_pos]

    # Garante que termine com ];
    if not section_code.rstrip().endswith('];'):
        if section_code.rstrip().endswith(']'):
            section_code = section_code.rstrip() + ';'
        else:
            section_code += '];'

    return section_code

def create_seed_file(output_dir, file_info, section_code):
    """Cria um arquivo de seed individual"""
    filepath = os.path.join(output_dir, file_info['file'])

    # Conta número de serviços
    service_count = section_code.count("name: '")

    header = f'''/**
 * SEED DE SERVIÇOS - SECRETARIA DE {file_info['name'].upper()}
 * Total: {service_count} serviços
 */

import {{ ServiceDefinition }} from './types';

'''

    # Renomeia a const para o export name
    section_code = section_code.replace(
        f"const {list(SECTIONS.keys())[list(SECTIONS.values()).index(file_info)]}: ServiceDefinition[] = [",
        f"export const {file_info['export']}: ServiceDefinition[] = ["
    )

    content = header + section_code + '\n'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"OK Criado: {file_info['file']} ({service_count} servicos)")
    return service_count

def main():
    source_file = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services-simplified-complete.ts'
    output_dir = r'c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\seeds\services'

    # Lê o arquivo fonte
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()

    print("Extraindo seeds modulares...\n")

    total_services = 0
    created_files = []

    # Extrai cada seção
    for section_name, file_info in SECTIONS.items():
        section_code = extract_section(content, section_name)

        if section_code:
            count = create_seed_file(output_dir, file_info, section_code)
            total_services += count
            created_files.append(file_info)
        else:
            print(f"AVISO: Secao nao encontrada: {section_name}")

    print(f"\nOK Extracao concluida: {len(created_files)} arquivos criados, {total_services} servicos no total")

    # Cria o arquivo index.ts
    create_index_file(output_dir, created_files)

def create_index_file(output_dir, created_files):
    """Cria o arquivo index.ts que importa todos os seeds"""
    filepath = os.path.join(output_dir, 'index.ts')

    imports = []
    exports = []
    all_services = []

    for file_info in created_files:
        module_name = file_info['file'].replace('.seed.ts', '')
        export_name = file_info['export']

        imports.append(f"import {{ {export_name} }} from './{module_name}.seed';")
        exports.append(export_name)
        all_services.append(f"  ...{export_name},")

    content = f'''/**
 * SEED MODULAR DE SERVIÇOS
 * Importa todos os seeds individuais por secretaria
 */

import {{ PrismaClient }} from '@prisma/client';
import {{ ServiceDefinition }} from './types';

{chr(10).join(imports)}

const prisma = new PrismaClient();

/**
 * Todos os serviços consolidados
 */
export const allServices: ServiceDefinition[] = [
{chr(10).join(all_services)}
];

/**
 * Função principal de seed de serviços
 */
export async function seedServices() {{
  console.log('\\n📦 Iniciando seed de serviços simplificados...');

  // Buscar departamentos
  const departments = await prisma.department.findMany();

  const departmentMap = new Map(
    departments.map(dept => [dept.code, dept.id])
  );

  let totalCreated = 0;

  for (const serviceDef of allServices) {{
    const departmentId = departmentMap.get(serviceDef.departmentCode);

    if (!departmentId) {{
      console.warn(`   ⚠️  Departamento ${{serviceDef.departmentCode}} não encontrado, pulando serviço: ${{serviceDef.name}}`);
      continue;
    }}

    try {{
      // Verificar se serviço já existe
      const existing = await prisma.serviceSimplified.findFirst({{
        where: {{
          name: serviceDef.name,
          departmentId: departmentId
        }}
      }});

      if (existing) {{
        // Atualizar serviço existente
        await prisma.serviceSimplified.update({{
          where: {{ id: existing.id }},
          data: {{
            description: serviceDef.description,
            serviceType: serviceDef.serviceType,
            moduleType: serviceDef.moduleType,
            formSchema: serviceDef.formSchema || undefined,
            requiresDocuments: serviceDef.requiresDocuments,
            requiredDocuments: serviceDef.requiredDocuments
              ? JSON.stringify(serviceDef.requiredDocuments)
              : undefined,
            estimatedDays: serviceDef.estimatedDays,
            priority: serviceDef.priority,
            category: serviceDef.category,
            icon: serviceDef.icon,
            color: serviceDef.color,
            isActive: true,
          }}
        }});
        console.log(`   🔄 ${{serviceDef.name}} (atualizado)`);
      }} else {{
        // Criar novo serviço
        await prisma.serviceSimplified.create({{
          data: {{
            name: serviceDef.name,
            description: serviceDef.description,
            departmentId,
            serviceType: serviceDef.serviceType,
            moduleType: serviceDef.moduleType,
            formSchema: serviceDef.formSchema || undefined,
            requiresDocuments: serviceDef.requiresDocuments,
            requiredDocuments: serviceDef.requiredDocuments
              ? JSON.stringify(serviceDef.requiredDocuments)
              : undefined,
            estimatedDays: serviceDef.estimatedDays,
            priority: serviceDef.priority,
            category: serviceDef.category,
            icon: serviceDef.icon,
            color: serviceDef.color,
            isActive: true,
          }}
        }});
        totalCreated++;
        console.log(`   ✅ ${{serviceDef.name}}`);
      }}
    }} catch (error: any) {{
      console.error(`   ❌ Erro ao processar serviço ${{serviceDef.name}}:`, error.message);
    }}
  }}

  console.log(`\\n✅ Seed de serviços concluído: ${{totalCreated}} serviços criados`);
  return totalCreated;
}}

// Executar seed se chamado diretamente
if (require.main === module) {{
  seedServices()
    .then(() => {{
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    }})
    .catch((error) => {{
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    }})
    .finally(async () => {{
      await prisma.$disconnect();
    }});
}}
'''

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"OK Criado: index.ts (arquivo centralizador)")

if __name__ == '__main__':
    main()
