'use client';

/**
 * COMPONENTE DE EXEMPLO - Demonstra o uso dos Selectors de Cadastros de Saúde
 *
 * Este arquivo serve como exemplo de como usar todos os selectors juntos
 * em um formulário real. Não deve ser usado em produção, apenas como referência.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  UnidadeSaudeSelector,
  ProfissionalSaudeSelector,
  EspecialidadeSelector,
  SalaSelector,
  TurnoSelector,
  type UnidadeSaude,
  type ProfissionalSaude,
  type Especialidade,
  type Sala,
  type Turno,
} from './index';

export function ExemploUsoSelectors() {
  // Estados para cada selector
  const [unidade, setUnidade] = useState<UnidadeSaude | null>(null);
  const [profissional, setProfissional] = useState<ProfissionalSaude | null>(null);
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(null);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [sala, setSala] = useState<Sala | null>(null);
  const [turno, setTurno] = useState<Turno | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Dados do formulário:', {
      unidade,
      profissional,
      especialidade,
      especialidades,
      sala,
      turno,
    });

    alert('Dados enviados! Verifique o console para ver os valores.');
  };

  const handleReset = () => {
    setUnidade(null);
    setProfissional(null);
    setEspecialidade(null);
    setEspecialidades([]);
    setSala(null);
    setTurno(null);
  };

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Uso - Selectors de Cadastros de Saúde</CardTitle>
          <p className="text-sm text-muted-foreground">
            Este é um exemplo demonstrando todos os componentes selectors disponíveis
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1: Unidade de Saúde */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Unidade de Saúde</h3>

              <UnidadeSaudeSelector
                onSelect={setUnidade}
                selectedUnidade={unidade}
                label="Selecione a Unidade de Saúde"
                required={true}
              />

              {/* Exemplo com filtro por tipo */}
              <div className="text-sm text-gray-600">
                <strong>Dica:</strong> Você pode filtrar por tipo usando a prop <code>tipo="UBS"</code>
              </div>
            </div>

            {/* Seção 2: Profissional de Saúde */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Profissional de Saúde</h3>

              <ProfissionalSaudeSelector
                onSelect={setProfissional}
                selectedProfissional={profissional}
                label="Selecione o Profissional"
                required={true}
                // categoria="MEDICO" // Descomente para filtrar apenas médicos
              />
            </div>

            {/* Seção 3: Especialidade */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">3. Especialidade</h3>

              {/* Seleção única */}
              <EspecialidadeSelector
                onSelect={(esp) => setEspecialidade(esp as Especialidade | null)}
                selectedEspecialidade={especialidade}
                label="Especialidade (Seleção Única)"
                required={false}
                multiple={false}
              />

              {/* Seleção múltipla */}
              <EspecialidadeSelector
                onSelect={(esps) => setEspecialidades(esps as Especialidade[])}
                selectedEspecialidade={especialidades}
                label="Especialidades (Seleção Múltipla)"
                required={false}
                multiple={true}
              />
            </div>

            {/* Seção 4: Sala */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">4. Sala/Consultório</h3>

              {!unidade && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                  Selecione uma unidade de saúde primeiro para poder escolher uma sala
                </div>
              )}

              <SalaSelector
                onSelect={setSala}
                selectedSala={sala}
                label="Selecione a Sala"
                required={false}
                unidadeId={unidade?.id}
                // tipo="CONSULTORIO" // Descomente para filtrar por tipo
              />
            </div>

            {/* Seção 5: Turno */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">5. Turno</h3>

              <TurnoSelector
                onSelect={setTurno}
                selectedTurno={turno}
                label="Selecione o Turno de Trabalho"
                required={true}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" className="flex-1">
                Enviar Formulário
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
                Limpar Tudo
              </Button>
            </div>

            {/* Resumo dos dados selecionados */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Dados Selecionados:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(
                  {
                    unidade: unidade ? { id: unidade.id, nome: unidade.nome } : null,
                    profissional: profissional ? { id: profissional.id, nome: profissional.nome } : null,
                    especialidade: especialidade ? { id: especialidade.id, nome: especialidade.nome } : null,
                    especialidades: especialidades.map(e => ({ id: e.id, nome: e.nome })),
                    sala: sala ? { id: sala.id, nome: sala.nome } : null,
                    turno: turno ? { id: turno.id, nome: turno.nome } : null,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dicas de Uso */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Dicas de Implementação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="font-semibold mb-2">1. Importação</h5>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
{`import {
  UnidadeSaudeSelector,
  ProfissionalSaudeSelector,
  EspecialidadeSelector,
  SalaSelector,
  TurnoSelector,
  type UnidadeSaude,
  type ProfissionalSaude,
  type Especialidade,
  type Sala,
  type Turno,
} from '@/components/apps/saude/cadastros';`}
            </pre>
          </div>

          <div>
            <h5 className="font-semibold mb-2">2. Dependências entre Selectors</h5>
            <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
              <li>
                <strong>SalaSelector</strong> requer <code>unidadeId</code> - sempre selecione a unidade primeiro
              </li>
              <li>
                <strong>ProfissionalSaudeSelector</strong> pode ser filtrado por categoria
              </li>
              <li>
                <strong>UnidadeSaudeSelector</strong> pode ser filtrado por tipo (UBS, UPA, etc.)
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-2">3. Validação</h5>
            <p className="text-sm text-gray-700">
              Use a prop <code>required</code> para marcar campos obrigatórios.
              Valide se os valores estão preenchidos antes de submeter o formulário.
            </p>
          </div>

          <div>
            <h5 className="font-semibold mb-2">4. Customização</h5>
            <p className="text-sm text-gray-700">
              Todos os componentes aceitam <code>label</code> personalizado e
              podem ser estilizados através das classes do Tailwind.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
