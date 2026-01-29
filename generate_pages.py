#!/usr/bin/env python3
"""
Script para gerar páginas CRUD frontend para os cadastros de saúde
"""

import os

BASE_DIR = r"c:\Projetos Cursor\Digiurbanlite\digiurban\frontend\app\admin\apps\saude\cadastros"

# Template para páginas de listagem
LISTAGEM_TEMPLATE = """'use client';

import {{ useState, useEffect }} from 'react';
import {{ useRouter }} from 'next/navigation';
import {{ Card, CardContent, CardHeader, CardTitle }} from '@/components/ui/card';
import {{ Button }} from '@/components/ui/button';
import {{ Input }} from '@/components/ui/input';
import {{ Badge }} from '@/components/ui/badge';
import {{ Table, TableHeader, TableBody, TableRow, TableHead, TableCell }} from '@/components/ui/table';
import {{ Plus, Edit, Trash2, Eye, ArrowLeft, Search }} from 'lucide-react';

export default function {module_name}Listagem() {{
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {{
    loadItems();
  }}, []);

  const loadItems = async () => {{
    try {{
      setLoading(true);
      const response = await fetch('/api/apps/saude/cadastros/{api_path}?search=' + search, {{
        credentials: 'include',
      }});
      const data = await response.json();
      setItems(data);
    }} catch (error) {{
      console.error('Erro ao carregar:', error);
    }} finally {{
      setLoading(false);
    }}
  }};

  const handleDelete = async (id: string) => {{
    if (!confirm('Deseja realmente desativar este registro?')) return;

    try {{
      await fetch(`/api/apps/saude/cadastros/{api_path}/${{id}}`, {{
        method: 'DELETE',
        credentials: 'include',
      }});
      loadItems();
    }} catch (error) {{
      console.error('Erro ao deletar:', error);
    }}
  }};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={{() => router.back()}}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          <Button onClick={{() => router.push('{create_path}')}}>
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={{search}}
                  onChange={{(e) => setSearch(e.target.value)}}
                  onKeyPress={{(e) => e.key === 'Enter' && loadItems()}}
                  className="pl-10"
                />
              </div>
              <Button onClick={{loadItems}}>Buscar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {{loading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {table_headers}
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {{items.map((item: any) => (
                    <TableRow key={{item.id}}>
                      {table_cells}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={{() => router.push(`{edit_path}/${{item.id}}`)}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={{() => handleDelete(item.id)}}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}}
                </TableBody>
              </Table>
            )}}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}}
"""

# Configurações para cada módulo
modules = [
    {
        'name': 'Unidades',
        'module_name': 'Unidades',
        'api_path': 'unidades',
        'title': 'Unidades de Saúde',
        'create_path': '/admin/apps/saude/cadastros/unidades/nova',
        'edit_path': '/admin/apps/saude/cadastros/unidades',
        'table_headers': '<TableHead>Nome</TableHead>\n                    <TableHead>Tipo</TableHead>\n                    <TableHead>CNES</TableHead>\n                    <TableHead>Telefone</TableHead>\n                    <TableHead>Status</TableHead>',
        'table_cells': '<TableCell>{item.nome}</TableCell>\n                      <TableCell><Badge>{item.tipo}</Badge></TableCell>\n                      <TableCell>{item.cnes}</TableCell>\n                      <TableCell>{item.telefone}</TableCell>\n                      <TableCell><Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Ativa" : "Inativa"}</Badge></TableCell>',
    },
    {
        'name': 'Profissionais',
        'module_name': 'Profissionais',
        'api_path': 'profissionais',
        'title': 'Profissionais de Saúde',
        'create_path': '/admin/apps/saude/cadastros/profissionais/novo',
        'edit_path': '/admin/apps/saude/cadastros/profissionais',
        'table_headers': '<TableHead>Nome</TableHead>\n                    <TableHead>Categoria</TableHead>\n                    <TableHead>Registro</TableHead>\n                    <TableHead>Status</TableHead>',
        'table_cells': '<TableCell>{item.nome}</TableCell>\n                      <TableCell><Badge>{item.categoria}</Badge></TableCell>\n                      <TableCell>{item.registroProfissional}</TableCell>\n                      <TableCell><Badge>{item.status}</Badge></TableCell>',
    },
    {
        'name': 'Especialidades',
        'module_name': 'Especialidades',
        'api_path': 'especialidades',
        'title': 'Especialidades Médicas',
        'create_path': '/admin/apps/saude/cadastros/especialidades/nova',
        'edit_path': '/admin/apps/saude/cadastros/especialidades',
        'table_headers': '<TableHead>Nome</TableHead>\n                    <TableHead>Área</TableHead>\n                    <TableHead>Tempo Médio</TableHead>\n                    <TableHead>Status</TableHead>',
        'table_cells': '<TableCell>{item.nome}</TableCell>\n                      <TableCell><Badge>{item.area}</Badge></TableCell>\n                      <TableCell>{item.tempoMedioConsulta} min</TableCell>\n                      <TableCell><Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Ativa" : "Inativa"}</Badge></TableCell>',
    },
    {
        'name': 'Salas',
        'module_name': 'Salas',
        'api_path': 'salas',
        'title': 'Salas e Consultórios',
        'create_path': '/admin/apps/saude/cadastros/salas/nova',
        'edit_path': '/admin/apps/saude/cadastros/salas',
        'table_headers': '<TableHead>Nome</TableHead>\n                    <TableHead>Número</TableHead>\n                    <TableHead>Tipo</TableHead>\n                    <TableHead>Andar</TableHead>\n                    <TableHead>Status</TableHead>',
        'table_cells': '<TableCell>{item.nome}</TableCell>\n                      <TableCell>{item.numero}</TableCell>\n                      <TableCell><Badge>{item.tipo}</Badge></TableCell>\n                      <TableCell>{item.andar}</TableCell>\n                      <TableCell><Badge variant={item.ativa ? "default" : "secondary"}>{item.ativa ? "Ativa" : "Inativa"}</Badge></TableCell>',
    },
    {
        'name': 'Turnos',
        'module_name': 'Turnos',
        'api_path': 'turnos',
        'title': 'Turnos de Trabalho',
        'create_path': '/admin/apps/saude/cadastros/turnos/novo',
        'edit_path': '/admin/apps/saude/cadastros/turnos',
        'table_headers': '<TableHead>Nome</TableHead>\n                    <TableHead>Horário</TableHead>\n                    <TableHead>Status</TableHead>',
        'table_cells': '<TableCell>{item.nome}</TableCell>\n                      <TableCell>{item.horaInicio} - {item.horaFim}</TableCell>\n                      <TableCell><Badge variant={item.ativo ? "default" : "secondary"}>{item.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>',
    },
    {
        'name': 'Agendas',
        'module_name': 'Agendas',
        'api_path': 'agendas',
        'title': 'Agendas Médicas',
        'create_path': '/admin/apps/saude/cadastros/agendas/nova',
        'edit_path': '/admin/apps/saude/cadastros/agendas',
        'table_headers': '<TableHead>Profissional</TableHead>\n                    <TableHead>Dia Semana</TableHead>\n                    <TableHead>Horário</TableHead>\n                    <TableHead>Vagas</TableHead>\n                    <TableHead>Status</TableHead>',
        'table_cells': '<TableCell>{item.profissionalId}</TableCell>\n                      <TableCell>{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][item.diaSemana]}</TableCell>\n                      <TableCell>{item.horaInicio} - {item.horaFim}</TableCell>\n                      <TableCell>{item.vagasDisponiveis}</TableCell>\n                      <TableCell><Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "Ativa" : "Inativa"}</Badge></TableCell>',
    },
]

# Gerar páginas de listagem
for module in modules:
    file_path = os.path.join(BASE_DIR, module['api_path'], 'page.tsx')
    content = LISTAGEM_TEMPLATE.format(**module)

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✓ Criado: {file_path}")

print(f"\n✅ {len(modules)} páginas de listagem criadas com sucesso!")
