const fs = require('fs');
const path = require('path');

const BASE_PATH = path.join(__dirname, 'digiurban', 'frontend', 'app', 'admin', 'secretarias');

const DEPARTMENTS = [
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
];

console.log('🚀 Iniciando atualização de secretarias...\n');

let successCount = 0;

for (const dept of DEPARTMENTS) {
  const filePath = path.join(BASE_PATH, dept, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${dept}: Arquivo não encontrado`);
    continue;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLength = content.length;

    // PASSO 1: Substituir seção "Módulos Padrões"
    const modulesOldPattern = /\{\/\* 🔥 Módulos Padrões.*?\*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    const modulesReplacement = `{/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1: MÓDULOS DE GESTÃO DE DADOS (COM_DADOS)                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
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
          {departmentLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-12 w-full" />
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
                  className={\`\${colors.border} \${colors.bg} hover:shadow-lg transition-all cursor-pointer group\`}
                  onClick={() => router.push(\`/admin/secretarias/${dept}/\${module.moduleType}\`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-blue-600 text-white">
                          Módulo COM_DADOS
                        </Badge>
                        <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                          <FileText className={\`h-5 w-5 \${colors.icon}\`} />
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
            <Card className="col-span-full border-blue-200 bg-blue-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-16 w-16 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum módulo COM_DADOS cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Módulos são criados automaticamente quando você configura serviços COM_DADOS com moduleType único.
                </p>
                <Button
                  onClick={() => router.push('/admin/servicos/novo?departmentCode=${dept}&serviceType=COM_DADOS')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Serviço COM_DADOS
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2: SERVIÇOS GERAIS (SEM_DADOS) - PAINEL ÚNICO            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-600" />
            Serviços Gerais (Certidões e Documentos)
          </h2>
          <p className="text-sm text-muted-foreground">
            Painel consolidado para gerenciar todos os serviços SEM_DADOS (certidões, declarações e documentos oficiais)
          </p>
        </div>

        {servicesLoading ? (
          <Card className="col-span-full">
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : services.filter((s: any) => s.serviceType === 'SEM_DADOS').length > 0 ? (
          <Card
            className="hover:shadow-xl transition-all cursor-pointer border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 group"
            onClick={() => router.push('/admin/secretarias/${dept}/servicos-gerais')}
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
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-16 w-16 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço SEM_DADOS cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Serviços SEM_DADOS são ideais para certidões, declarações e documentos que não requerem formulários complexos.
              </p>
              <Button
                onClick={() => router.push('/admin/servicos/novo?departmentCode=${dept}&serviceType=SEM_DADOS')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Serviço SEM_DADOS
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÕES DUPLICADAS REMOVIDAS - Agora temos apenas 2 seções:     */}
      {/* 1. Módulos COM_DADOS (acima) - painéis individuais             */}
      {/* 2. Serviços Gerais SEM_DADOS (acima) - painel agregado         */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Sugestões Inteligentes de Serviços com Dados */}`;

    // Aplicar substituição
    content = content.replace(modulesOldPattern, modulesReplacement);

    // PASSO 2: Remover seções duplicadas restantes
    // Remover "Certidões, Declarações e Documentos" antiga com cards individuais
    content = content.replace(/\{\/\* Certidões, Declarações e Documentos[\s\S]*?\{\/\* Serviços COM_DADOS/g, '{/* Serviços COM_DADOS');

    // Remover "Serviços COM_DADOS" e "Serviços Disponíveis"
    content = content.replace(/\{\/\* Serviços COM_DADOS[\s\S]*?\{\/\* Sugestões Inteligentes/g, '{/* Sugestões Inteligentes');

    const newLength = content.length;

    // Salvar arquivo
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`✅ ${dept}: Atualizado (${originalLength} → ${newLength} caracteres)`);
    successCount++;

  } catch (error) {
    console.log(`❌ ${dept}: Erro - ${error.message}`);
  }
}

console.log(`\n✨ Concluído! ${successCount}/${DEPARTMENTS.length} secretarias atualizadas.`);
