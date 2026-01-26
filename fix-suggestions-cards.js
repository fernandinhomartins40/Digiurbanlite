const fs = require('fs');
const path = require('path');

const departments = [
  { slug: 'administracao', color: 'blue' },
  { slug: 'defesa-civil', color: 'orange' },
  { slug: 'desenvolvimento-economico', color: 'green' },
  { slug: 'financas', color: 'emerald' },
  { slug: 'mobilidade-urbana', color: 'cyan' },
  { slug: 'politicas-mulheres', color: 'pink' },
  { slug: 'tecnologia-inovacao', color: 'purple' },
  { slug: 'transportes-transito', color: 'yellow' }
];

departments.forEach(dept => {
  const filePath = path.join('c:\\Projetos Cursor\\Digiurbanlite\\digiurban\\frontend\\app\\admin\\secretarias', dept.slug, 'page.tsx');

  // Ler o arquivo
  let content = fs.readFileSync(filePath, 'utf8');

  // Encontrar e substituir o CardContent simplificado
  const oldCardContent = `                <CardContent>
                  <Button
                    variant="default"
                    className="w-full bg-${dept.color}-600 hover:bg-${dept.color}-700"
                    onClick={() => router.push(buildServiceCreationUrl('${dept.slug}', suggestion))}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar este Serviço
                  </Button>
                </CardContent>`;

  const newCardContent = `                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {suggestion.estimatedDays} dias
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                      {suggestion.requiresDocuments && (
                        <Badge variant="secondary" className="text-xs">
                          Requer Docs
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <strong>Campos incluídos:</strong>
                      <ul className="mt-2 space-y-1">
                        {suggestion.suggestedFields.slice(0, 4).map((field, idx) => (
                          <li key={idx}>• {field.label}</li>
                        ))}
                        {suggestion.suggestedFields.length > 4 && (
                          <li className="text-${dept.color}-600">
                            + {suggestion.suggestedFields.length - 4} campos adicionais
                          </li>
                        )}
                      </ul>
                    </div>

                    <Button
                      variant="default"
                      className="w-full bg-${dept.color}-600 hover:bg-${dept.color}-700"
                      onClick={() => router.push(buildServiceCreationUrl('${dept.slug}', suggestion))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar este Serviço
                    </Button>
                  </div>
                </CardContent>`;

  // Substituir o conteúdo
  content = content.replace(oldCardContent, newCardContent);

  // Escrever o arquivo atualizado
  fs.writeFileSync(filePath, content);
  console.log(`✅ Atualizado: ${dept.slug}`);
});

console.log('\n🎉 Todas as páginas foram atualizadas!');
