#!/usr/bin/env python3
"""
Script para remover models legados do schema.prisma
"""

import re

# Ler o schema
with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Models legados a remover
legacy_models = [
    'ServiceGeneration',
    'ProtocolLocation',
    'ServiceLocation',
    'ServiceForm',
    'ServiceFormSubmission',
    'ServiceScheduling',
    'ServiceCustomField',
    'ProtocolCustomFieldValue',
    'ServiceDocument'
]

removed_count = 0

for model_name in legacy_models:
    # Padrão: model ModelName { ... @@map("...") }
    pattern = rf'model {model_name} \{{[^}}]*\n\n  @@map\("[^"]*"\)\n\}}\n\n'

    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, '', content, flags=re.DOTALL)
        removed_count += 1
        print(f'✅ Removido: model {model_name}')
    else:
        print(f'⚠️  Não encontrado: model {model_name}')

# Salvar o schema atualizado
with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\n✅ Total de models removidos: {removed_count}')
print(f'📝 Schema atualizado: prisma/schema.prisma')
