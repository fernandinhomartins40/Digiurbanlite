#!/usr/bin/env python3
import os
import re

# Diretório base
frontend_dir = "digiurban/frontend"

# Padrões a serem substituídos
patterns = [
    (r"process\.env\.NEXT_PUBLIC_BACKEND_URL", "process.env.NEXT_PUBLIC_API_URL"),
    (r"'http://localhost:3001'(?!\s*/api)", "'http://localhost:3001/api'"),
]

# Arquivos para corrigir
files_to_fix = [
    "app/api/super-admin/auth/me/route.ts",
    "app/api/super-admin/email-server/config/route.ts",
    "app/api/super-admin/email-server/dkim/generate/route.ts",
    "app/api/super-admin/email-server/dkim/route.ts",
    "app/api/super-admin/email-server/domains/route.ts",
    "app/api/super-admin/email-server/domains/[id]/route.ts",
    "app/api/super-admin/email-server/domains/[id]/verify/route.ts",
    "app/api/super-admin/login/route.ts",
    "app/api/super-admin/logout/route.ts",
    "app/api/super-admin/municipio/activate/route.ts",
    "app/api/super-admin/municipio/route.ts",
    "app/api/super-admin/municipio/suspend/route.ts",
    "app/api/super-admin/stats/route.ts",
    "app/api/super-admin/system/backups/route.ts",
    "app/api/super-admin/system/health/route.ts",
    "app/api/super-admin/users/admins/route.ts",
    "app/api/super-admin/users/admins/[id]/route.ts",
]

total_changes = 0

for file_path in files_to_fix:
    full_path = os.path.join(frontend_dir, file_path)

    if not os.path.exists(full_path):
        print(f"⚠️  Arquivo não encontrado: {full_path}")
        continue

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)

    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        total_changes += 1
        print(f"✅ Corrigido: {file_path}")

print(f"\n🎯 Total de arquivos corrigidos: {total_changes}/{len(files_to_fix)}")
