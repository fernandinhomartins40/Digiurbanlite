const fs = require('fs');
const path = require('path');

const departments = [
  'agricultura',
  'assistencia-social',
  'cultura',
  'educacao',
  'esportes',
  'habitacao',
  'meio-ambiente',
  'obras-publicas',
  'planejamento-urbano',
  'saude',
  'seguranca-publica',
  'servicos-publicos',
  'turismo'
];

const msSectionCode = `
      {/* 🚀 SEÇÃO DE MICRO SISTEMAS */}
      {(() => {
        const { allMSConfigs } = require('@/lib/ms-configs');
        const departmentSlug = '%%DEPARTMENT%%';
        const microSystems = Object.values(allMSConfigs).filter(
          (ms) => ms.departmentSlug === departmentSlug
        );

        if (microSystems.length === 0) return null;

        return (
          <div className="space-y-4 mt-8">
            {/* Header da seção */}
            <div className="flex items-center gap-3 border-b-2 pb-4 border-blue-500">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Micro Sistemas
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Aplicações completas e independentes com gestão avançada, workflows e relatórios
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-base shadow-lg">
                {microSystems.length} MS Disponíveis
              </Badge>
            </div>

            {/* Cards dos Micro Sistemas */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {microSystems.map((msConfig) => {
                const targetRoute = \`/admin/ms/\${msConfig.id}\`;

                return (
                  <Card
                    key={msConfig.id}
                    className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-blue-950 dark:via-purple-950 dark:to-blue-950 relative overflow-hidden group"
                    onClick={() => router.push(targetRoute)}
                  >
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
                          {msConfig.icon}
                        </div>
                        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-md">
                          SUPER APP
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold">{msConfig.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {msConfig.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {/* Info: Sistema pronto para uso */}
                        <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-center text-blue-700 dark:text-blue-300 font-medium">
                            ✨ Sistema completo pronto para uso
                          </p>
                        </div>

                        {/* Badges de Features */}
                        <div className="flex gap-2 flex-wrap justify-center">
                          <Badge variant="outline" className="text-xs bg-white/70 dark:bg-black/30 border-blue-300">
                            Dashboard
                          </Badge>
                          {msConfig.hasWorkflow && (
                            <Badge variant="outline" className="text-xs bg-white/70 dark:bg-black/30 border-purple-300">
                              Workflow
                            </Badge>
                          )}
                          {msConfig.hasReports && (
                            <Badge variant="outline" className="text-xs bg-white/70 dark:bg-black/30 border-blue-300">
                              Relatórios
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}
`;

departments.forEach(dept => {
  const filePath = path.join(__dirname, '..', 'app', 'admin', 'secretarias', dept, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${dept}/page.tsx`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Verifica se já tem a seção de MS
  if (content.includes('SEÇÃO DE MICRO SISTEMAS')) {
    console.log(`⏭️  Pulando ${dept} - já tem seção de MS`);
    return;
  }

  // Adiciona a seção antes do último </div> do componente
  const lastDivIndex = content.lastIndexOf('</div>\n  );\n}');

  if (lastDivIndex === -1) {
    console.log(`❌ Não encontrei padrão para inserir em ${dept}/page.tsx`);
    return;
  }

  const msSection = msSectionCode.replace('%%DEPARTMENT%%', dept);
  const newContent = content.slice(0, lastDivIndex) + msSection + '\n' + content.slice(lastDivIndex);

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Adicionado seção de MS em ${dept}/page.tsx`);
});

console.log('\n🎉 Concluído!');
