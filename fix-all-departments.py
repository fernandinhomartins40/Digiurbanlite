#!/usr/bin/env python3
"""
Script para atualizar todas as páginas de secretarias para seguir o padrão da agricultura.
Remove seções duplicadas e consolida em 2 seções principais.
"""

import os
import re

BASE_PATH = r'c:\Projetos Cursor\Digiurbanlite\digiurban\frontend\app\admin\secretarias'

# Lista de arquivos para atualizar (excluindo agricultura e saude que já foram atualizados)
DEPARTMENTS_TO_UPDATE = [
    'educacao',
    'assistencia-social',
    'cultura',
    'esportes',
    'habitacao',
    'meio-ambiente',
    'obras-publicas',
    'planejamento-urbano',
    'seguranca-publica',
    'servicos-publicos',
    'turismo'
]

def update_department_file(dept_slug):
    """Atualiza um arquivo de departamento para seguir o padrão agricultura"""

    file_path = os.path.join(BASE_PATH, dept_slug, 'page.tsx')

    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        return False

    print(f"📝 Processando {dept_slug}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_length = len(content)

    # =================================================================
    # PASSO 1: Encontrar e substituir a seção "Módulos Padrões"
    # =================================================================

    # Padrão para encontrar a seção "Módulos Padrões"
    modules_pattern = r'(      {/\* 🔥 Módulos Padrões.*?\*/}\s*<div>.*?<\/div>\s*<\/div>\s*<\/div>)'

    # Substituir por seção atualizada
    modules_replacement = f'''      {{/* ═══════════════════════════════════════════════════════════════ */}}
      {{/* SEÇÃO 1: MÓDULOS DE GESTÃO DE DADOS (COM_DADOS)                */}}
      {{/* ═══════════════════════════════════════════════════════════════ */}}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-blue-600" />
            Módulos de Gestão de Dados
          </h2>
          <p className="text-sm text-muted-foreground">
            Painéis completos com checklist, timeline e dados estruturados. Cada módulo é criado automaticamente quando você configura um serviço COM_DADOS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {{departmentLoading ? (
            <>
              {{[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={{i}}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}}
            </>
          ) : modules.length > 0 ? (
            modules.map((module: any, index: number) => {{
              const colors = moduleColors[index % moduleColors.length];
              return (
                <Card
                  key={{module.id}}
                  className={{`${{colors.border}} ${{colors.bg}} hover:shadow-lg transition-all cursor-pointer group`}}
                  onClick={{() => router.push(`/admin/secretarias/{dept_slug}/${{module.moduleType}}`)}}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-blue-600 text-white">
                          Módulo COM_DADOS
                        </Badge>
                        <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                          <FileText className={{`h-5 w-5 ${{colors.icon}}`}} />
                          {{module.name}}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {{module.description || 'Módulo de gestão com formulário dinâmico'}}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold text-lg">{{module.stats?.total || 0}}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-muted-foreground">Pendentes:</span>
                        <span className="font-semibold text-yellow-700">{{module.stats?.pending || 0}}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-muted-foreground">Aprovados:</span>
                        <span className="font-semibold text-green-700">{{module.stats?.approved || 0}}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 group-hover:bg-blue-600 transition-colors" variant="outline">
                      Abrir Painel Completo →
                    </Button>
                  </CardContent>
                </Card>
              );
            }})
          ) : (
            <Card className="col-span-full border-blue-200 bg-blue-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-16 w-16 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum módulo COM_DADOS cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Módulos são criados automaticamente quando você configura serviços COM_DADOS com moduleType único.
                </p>
                <Button
                  onClick={{() => router.push('/admin/servicos/novo?departmentCode={dept_slug}&serviceType=COM_DADOS')}}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Serviço COM_DADOS
                </Button>
              </CardContent>
            </Card>
          )}}
        </div>
      </div>'''

    content = re.sub(modules_pattern, modules_replacement, content, flags=re.DOTALL)

    # =================================================================
    # PASSO 2: Remover seções duplicadas
    # =================================================================

    # Remover "Certidões, Declarações e Documentos" antiga
    content = re.sub(
        r'      {/\* Certidões, Declarações e Documentos.*?\*/}.*?(?=      {/\*|      <\/div>\s*?{/\*)',
        '',
        content,
        flags=re.DOTALL
    )

    # Remover "Serviços COM_DADOS" duplicados
    content = re.sub(
        r'      {/\* Serviços COM_DADOS.*?\*/}.*?(?=      {/\*)',
        '',
        content,
        flags=re.DOTALL
    )

    # Remover "Serviços Disponíveis" duplicados
    content = re.sub(
        r'      {/\* Serviços Disponíveis.*?\*/}.*?(?=      {/\*)',
        '',
        content,
        flags=re.DOTALL
    )

    new_length = len(content)

    # Salvar arquivo atualizado
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ {dept_slug} atualizado! ({original_length} → {new_length} caracteres)")
    return True

# Executar para todos os departamentos
if __name__ == '__main__':
    print("🚀 Iniciando atualização de departamentos...\n")

    success_count = 0
    for dept in DEPARTMENTS_TO_UPDATE:
        if update_department_file(dept):
            success_count += 1

    print(f"\n✨ Concluído! {success_count}/{len(DEPARTMENTS_TO_UPDATE)} arquivos atualizados.")
