#!/usr/bin/env python3
import os
import re

# Diretório base das rotas API
api_dir = r'digiurban\frontend\app\api'

# Procurar todos os arquivos route.ts
for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file == 'route.ts':
            filepath = os.path.join(root, file)

            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Verificar se usa cookies e não tem dynamic export
            if 'request.cookies' in content and 'export const dynamic' not in content:
                print(f'Corrigindo: {filepath}')

                # Encontrar onde termina a última linha de import
                lines = content.split('\n')
                insert_index = 0

                for i, line in enumerate(lines):
                    if line.startswith('import '):
                        insert_index = i + 1
                    elif insert_index > 0 and line.strip() == '':
                        # Encontrou linha em branco após imports
                        break

                # Inserir após os imports
                lines.insert(insert_index + 1, '')
                lines.insert(insert_index + 2, '// Marcar como rota dinâmica (usa cookies)')
                lines.insert(insert_index + 3, "export const dynamic = 'force-dynamic';")

                # Escrever de volta
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(lines))

                print(f'  ✅ Adicionado export dynamic')
            elif 'export const dynamic' in content:
                print(f'Já tem dynamic: {filepath}')

print('\n✅ Processamento concluído!')
