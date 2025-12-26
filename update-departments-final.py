#!/usr/bin/env python3
"""
Script para atualizar sistematicamente os arquivos de secretarias
seguindo EXATAMENTE o padrão da agricultura.
"""

import re
import os

# Mapeamento de departamentos
DEPARTMENTS = {
    'habitacao': 'habitacao',
    'meio-ambiente': 'meio-ambiente',
    'obras-publicas': 'obras-publicas',
    'planejamento-urbano': 'planejamento-urbano',
    'seguranca-publica': 'seguranca-publica',
    'servicos-publicos': 'servicos-publicos',
    'turismo': 'turismo',
}

BASE_PATH = r'c:\Projetos Cursor\Digiurbanlite\digiurban\frontend\app\admin\secretarias'

# SEÇÃO 1: Template para Módulos COM_DADOS
SECTION_1_TEMPLATE = '''      {/* SEÇÃO 1: MÓDULOS DE GESTÃO DE DADOS (COM_DADOS) */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <FileBarChart className="h-7 w-7 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold">Módulos de Gestão de Dados</h2>
            <p className="text-sm text-muted-foreground">
              Serviços COM_DADOS com formulários dinâmicos e gestão completa de protocolos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departmentLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : modules.length > 0 ? (
            modules.map((module: any, index: number) => {
              const colors = moduleColors[index % moduleColors.length];
              return (
                <Card
                  key={module.id}
                  className={`$${colors.border} $${colors.bg} hover:shadow-lg transition-all cursor-pointer group`}
                  onClick={() => router.push(`/admin/secretarias/DEPARTMENT_CODE/$${module.moduleType}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-blue-600 text-white">
                          Módulo COM_DADOS
                        </Badge>
                        <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                          <FileText className={`h-5 w-5 $${colors.icon}`} />
                          {module.name}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {module.description || 'Módulo de gestão com formulário dinâmico'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold text-lg">{module.stats?.total || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <span className="text-muted-foreground">Pendentes:</span>
                        <span className="font-semibold text-yellow-700">{module.stats?.pending || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-muted-foreground">Aprovados:</span>
                        <span className="font-semibold text-green-700">{module.stats?.approved || 0}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 group-hover:bg-blue-600 transition-colors" variant="outline">
                      Abrir Painel Completo →
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full border-dashed border-2 border-blue-200 bg-blue-50/30">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-16 w-16 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum módulo COM_DADOS cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie serviços COM_DADOS com moduleType para que apareçam automaticamente aqui
                </p>
                <Button
                  onClick={() => router.push('/admin/servicos/novo?departmentCode=DEPARTMENT_CODE&serviceType=COM_DADOS')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Serviço COM_DADOS
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>'''

# SEÇÃO 2: Template para Serviços Gerais
SECTION_2_TEMPLATE = '''      {/* SEÇÃO 2: SERVIÇOS GERAIS (SEM_DADOS) - PAINEL ÚNICO */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <FileBarChart className="h-7 w-7 text-green-600" />
          <div>
            <h2 className="text-2xl font-semibold">Serviços Gerais - Painel Consolidado</h2>
            <p className="text-sm text-muted-foreground">
              Todos os serviços SEM_DADOS gerenciados em um único painel agregado
            </p>
          </div>
        </div>

        {servicesLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card
            className="hover:shadow-xl transition-all cursor-pointer border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 group"
            onClick={() => router.push('/admin/secretarias/DEPARTMENT_CODE/servicos-gerais')}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-3 bg-green-600 text-white">
                    Painel Agregado SEM_DADOS
                  </Badge>
                  <CardTitle className="text-2xl flex items-center gap-3 group-hover:text-green-700 transition-colors">
                    <FileBarChart className="h-7 w-7 text-green-600" />
                    Gerenciar Todos os Serviços Gerais
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Visão consolidada de {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length} serviços em um único painel com filtros, busca e estatísticas
                  </CardDescription>
                </div>
                <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <FileText className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {services
                    .filter((s: any) => s.serviceType === 'SEM_DADOS')
                    .slice(0, 6)
                    .map((service: any) => (
                      <Badge key={service.id} variant="outline" className="bg-white text-green-700 border-green-300">
                        {service.name}
                      </Badge>
                    ))}
                  {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length > 6 && (
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">
                      +{services.filter((s: any) => s.serviceType === 'SEM_DADOS').length - 6} mais
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {services.filter((s: any) => s.serviceType === 'SEM_DADOS').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Serviços</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">•••</div>
                    <div className="text-xs text-muted-foreground">Protocolos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-700">•••</div>
                    <div className="text-xs text-muted-foreground">Pendentes</div>
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:shadow-lg transition-all" size="lg">
                  <FileBarChart className="h-5 w-5 mr-2" />
                  Abrir Painel Consolidado →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!servicesLoading && services.filter((s: any) => s.serviceType === 'SEM_DADOS').length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço SEM_DADOS cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Execute o seed do banco de dados para carregar os serviços gerais
              </p>
              <Button
                onClick={() => router.push('/admin/servicos/novo?departmentCode=DEPARTMENT_CODE&serviceType=SEM_DADOS')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Serviço Personalizado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/*
        ============================================================
        SEÇÕES REMOVIDAS (Consolidadas acima):
        ============================================================
        - "Serviços de Certidões, Declarações e Documentos"
          → Agora: SEÇÃO 2 - Painel Agregado SEM_DADOS

        - "Serviços COM_DADOS - Com formulários e dados estruturados"
          → Agora: Incluído na SEÇÃO 1 - Módulos de Gestão de Dados

        - "Serviços Disponíveis" (listagem geral)
          → Agora: Distribuído entre SEÇÃO 1 (COM_DADOS) e SEÇÃO 2 (SEM_DADOS)
        ============================================================
      */}'''

def update_department(dept_code):
    """Atualiza um arquivo de departamento."""
    file_path = os.path.join(BASE_PATH, dept_code, 'page.tsx')

    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # SEÇÃO 1: Substituir "Módulos Padrões"
    # Encontrar o comentário e substituir até o final do </div>
    pattern1 = r'{/\* 🔥 Módulos Padrões.*?</div>\s+</div>'
    section1 = SECTION_1_TEMPLATE.replace('DEPARTMENT_CODE', dept_code).replace('$$', '{').replace('$', '')
    content = re.sub(pattern1, section1.strip(), content, flags=re.DOTALL)

    # SEÇÃO 2: Substituir desde "Certidões, Declarações e Documentos" até antes de "Sugestões Inteligentes"
    # Localizar o início da seção de certidões
    pattern2_start = r'{/\* Certidões, Declarações e Documentos'
    # Localizar o final (antes de Sugestões Inteligentes)
    pattern2_end = r'{/\* Sugestões Inteligentes'

    # Encontrar as posições
    match_start = re.search(pattern2_start, content)
    match_end = re.search(pattern2_end, content)

    if match_start and match_end:
        # Substituir tudo entre o início e o final
        before = content[:match_start.start()]
        after = content[match_end.start():]
        section2 = SECTION_2_TEMPLATE.replace('DEPARTMENT_CODE', dept_code)
        content = before + section2.strip() + '\n\n      ' + after

    # Salvar arquivo
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ {dept_code}/page.tsx atualizado com sucesso!")
    return True

def main():
    """Função principal."""
    print("=" * 60)
    print("ATUALIZAÇÃO SISTEMÁTICA DE SECRETARIAS")
    print("Seguindo padrão da agricultura")
    print("=" * 60)
    print()

    success_count = 0
    for dept_code in DEPARTMENTS.keys():
        print(f"Processando {dept_code}...")
        if update_department(dept_code):
            success_count += 1
        print()

    print("=" * 60)
    print(f"CONCLUÍDO: {success_count}/{len(DEPARTMENTS)} secretarias atualizadas")
    print("=" * 60)

if __name__ == '__main__':
    main()
