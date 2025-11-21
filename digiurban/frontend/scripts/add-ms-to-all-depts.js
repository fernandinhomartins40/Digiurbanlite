const fs = require('fs');
const path = require('path');

const departments = [
  { slug: 'educacao', color1: 'blue', color2: 'indigo' },
  { slug: 'assistencia-social', color1: 'purple', color2: 'pink' },
  { slug: 'agricultura', color1: 'green', color2: 'emerald' },
  { slug: 'cultura', color1: 'pink', color2: 'rose' },
  { slug: 'esportes', color1: 'orange', color2: 'amber' },
  { slug: 'habitacao', color1: 'cyan', color2: 'sky' },
  { slug: 'meio-ambiente', color1: 'emerald', color2: 'teal' },
  { slug: 'obras-publicas', color1: 'yellow', color2: 'orange' },
  { slug: 'planejamento-urbano', color1: 'slate', color2: 'gray' },
  { slug: 'seguranca-publica', color1: 'red', color2: 'orange' },
  { slug: 'servicos-publicos', color1: 'violet', color2: 'purple' },
  { slug: 'turismo', color1: 'teal', color2: 'cyan' }
];

const createMSSection = (dept) => {
  const { slug, color1, color2 } = dept;

  return `
      {/* 🚀 SEÇÃO DE MICRO SISTEMAS */}
      {(() => {
        const { allMSConfigs } = require('@/lib/ms-configs');
        const microSystems = Object.values(allMSConfigs).filter(
          (ms: any) => ms.departmentSlug === '${slug}'
        );

        if (microSystems.length === 0) return null;

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 pb-4 border-${color1}-500">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-${color1}-500 to-${color2}-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-${color1}-600 to-${color2}-600 bg-clip-text text-transparent">
                  Micro Sistemas
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Aplicações completas e independentes com gestão avançada, workflows e relatórios
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-${color1}-500 to-${color2}-600 text-white px-4 py-2 text-base shadow-lg">
                {microSystems.length} MS Disponíveis
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {microSystems.map((msConfig: any) => (
                <Card
                  key={msConfig.id}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border-2 border-${color1}-200 bg-gradient-to-br from-${color1}-50 via-${color2}-50 to-${color1}-50 dark:from-${color1}-950 dark:via-${color2}-950 dark:to-${color1}-950 relative overflow-hidden group"
                  onClick={() => router.push(\`/admin/ms/\${msConfig.id}\`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-${color1}-500 to-${color2}-600 flex items-center justify-center shadow-lg text-white">
                        {msConfig.icon}
                      </div>
                      <Badge variant="secondary" className="bg-gradient-to-r from-${color1}-500 to-${color2}-600 text-white border-0 shadow-md">
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
                      <div className="bg-${color1}-50 dark:bg-${color1}-950/50 rounded-lg p-3 border border-${color1}-200 dark:border-${color1}-800">
                        <p className="text-xs text-center text-${color1}-700 dark:text-${color1}-300 font-medium">
                          ✨ Sistema completo pronto para uso
                        </p>
                      </div>

                      <div className="flex gap-2 flex-wrap justify-center">
                        <Badge variant="outline" className="text-xs bg-white/70 dark:bg-black/30 border-${color1}-300">
                          Dashboard
                        </Badge>
                        {msConfig.hasWorkflow && (
                          <Badge variant="outline" className="text-xs bg-white/70 dark:bg-black/30 border-${color2}-300">
                            Workflow
                          </Badge>
                        )}
                        {msConfig.hasReports && (
                          <Badge variant="outline" className="text-xs bg-white/70 dark:bg-black/30 border-${color1}-300">
                            Relatórios
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}
`;
};

departments.forEach(dept => {
  const filePath = path.join(__dirname, '..', 'app', 'admin', 'secretarias', dept.slug, 'page.tsx');

  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${dept.slug}: arquivo não encontrado`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes('SEÇÃO DE MICRO SISTEMAS')) {
    console.log(`⏭️  ${dept.slug}: já tem seção MS`);
    return;
  }

  // Procura por "Ações Rápidas" e adiciona a seção logo após o </Card>
  const marker = '      </Card>\n\n      {/* Módulos Padrões';
  const markerIndex = content.indexOf(marker);

  if (markerIndex === -1) {
    console.log(`❌ ${dept.slug}: não encontrei o marcador`);
    return;
  }

  const msSection = createMSSection(dept);
  const beforeMarker = content.substring(0, markerIndex + 14); // até </Card>
  const afterMarker = content.substring(markerIndex + 14);

  const newContent = beforeMarker + msSection + '\n' + afterMarker;

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ ${dept.slug}: seção MS adicionada!`);
});

console.log('\n🎉 Concluído!');
