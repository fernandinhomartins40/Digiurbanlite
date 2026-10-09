import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  allAppActionCodes,
  effectiveDestination,
  findAppAction,
  resolveAppRoutingKey,
  validateServiceDestination,
} from '../../src/config/app-catalog';

describe('resolveAppRoutingKey', () => {
  it('destino FILA nunca vai para app, mesmo com moduleType de app', () => {
    expect(resolveAppRoutingKey({ destination: 'FILA', moduleType: 'CARTAO_ESTUDANTE' })).toBeNull();
  });
  it('destino APP usa a ação declarada, independente do nome/moduleType', () => {
    expect(resolveAppRoutingKey({ destination: 'APP', appAction: 'CARTAO_ESTUDANTE', moduleType: 'CARTEIRINHA_DO_ALUNO' })).toBe('CARTAO_ESTUDANTE');
  });
  it('sem destino (serviço anterior à migração) mantém o legado pelo moduleType', () => {
    expect(resolveAppRoutingKey({ moduleType: 'LICENCA_AMBIENTAL' })).toBe('LICENCA_AMBIENTAL');
    expect(resolveAppRoutingKey({})).toBeNull();
  });
});

describe('validateServiceDestination', () => {
  it('aceita FILA e APP com ação da secretaria do serviço', () => {
    expect(validateServiceDestination('FILA', null, 'SAUDE')).toBeNull();
    expect(validateServiceDestination('APP', 'ENCAMINHAMENTOS_TFD', 'SAUDE')).toBeNull();
    expect(validateServiceDestination('APP', 'ALVARA_CONSTRUCAO', 'planejamento-urbano')).toBeNull();
  });
  it('recusa destino inválido, ação inexistente e app de outra secretaria', () => {
    expect(validateServiceDestination('OUTRO', null, 'SAUDE')).toMatch(/Destino inválido/);
    expect(validateServiceDestination('APP', 'NAO_EXISTE', 'SAUDE')).toMatch(/Escolha/);
    expect(validateServiceDestination('APP', 'ENCAMINHAMENTOS_TFD', 'CULTURA')).toMatch(/não pertence/);
  });
});

describe('effectiveDestination', () => {
  it('serviço sem destino gravado é exibido pelo roteamento legado', () => {
    expect(effectiveDestination({ moduleType: 'INSCRICAO_ESCOLINHA_JUDO' })).toEqual({ destination: 'APP', appAction: 'INSCRICAO_ESCOLINHA_JUDO' });
    expect(effectiveDestination({ moduleType: 'SOLICITACAO_TFD_URGENTE' })).toEqual({ destination: 'APP', appAction: 'ENCAMINHAMENTOS_TFD' });
    expect(effectiveDestination({ moduleType: 'CERTIDAO_NEGATIVA' })).toEqual({ destination: 'FILA', appAction: null });
  });
  it('destino gravado prevalece', () => {
    expect(effectiveDestination({ destination: 'FILA', moduleType: 'CARTAO_ESTUDANTE' })).toEqual({ destination: 'FILA', appAction: null });
  });
});

describe('catálogo × conversor protocolo→app', () => {
  // Trava contra divergência: todo código tratado pelo conversor precisa estar no
  // catálogo (senão o assistente não o oferece) e vice-versa (senão o serviço
  // aponta para uma ação que nenhum conversor atende).
  const source = readFileSync(join(__dirname, '../../src/services/apps/protocol-to-app.service.ts'), 'utf8');
  const fromMaps = [...source.matchAll(/^\s+([A-Z][A-Z_]{4,}):\s/gm)].map((m) => m[1]);
  const fromSets = [...source.matchAll(/new Set\(\[([\s\S]*?)\]\)/g)].flatMap((m) => [...m[1].matchAll(/'([A-Z_]+)'/g)].map((x) => x[1]));
  const fromEquals = [...source.matchAll(/moduleType === '([A-Z_]+)'/g)].map((m) => m[1]);
  const converterCodes = new Set([...fromMaps, ...fromSets, ...fromEquals]);

  it('todo código do conversor existe no catálogo', () => {
    const missing = [...converterCodes].filter((code) => !findAppAction(code));
    expect(missing).toEqual([]);
  });

  it('toda ação do catálogo é atendida por algum conversor (TFD tem conversor próprio)', () => {
    const orphan = allAppActionCodes().filter((code) => code !== 'ENCAMINHAMENTOS_TFD' && !converterCodes.has(code));
    expect(orphan).toEqual([]);
  });
});

describe('catálogo de serviços × apps', () => {
  // Trava contra "o pedido nunca chega ao app": antes o TFD, poda, capina,
  // bueiro e licença ambiental do catálogo caíam na fila porque o código
  // técnico do serviço não era igual ao código da ação do app.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { allServices, catalogRouteOf } = require('../../src/catalog/services');
  const routed = allServices
    .map((def: any) => ({ def, route: catalogRouteOf(def) }))
    .filter((item: any) => item.route.destination === 'APP');

  it('todo serviço que vai para app aponta para uma ação que existe, de app da mesma secretaria', () => {
    const wrong = routed
      .filter(({ def, route }: any) => {
        const found = findAppAction(route.appAction);
        return !found || !found.app.departments.includes(def.departmentCode);
      })
      .map(({ def, route }: any) => `${def.departmentCode} | ${def.name} → ${route.appAction}`);
    expect(wrong).toEqual([]);
  });

  it('apps com porta de entrada recebem pelo menos um serviço do catálogo', () => {
    const reached = new Set(routed.map(({ route }: any) => findAppAction(route.appAction)?.app.code));
    const withActions = ['tfd', 'servicos-publicos', 'licenciamento', 'meio-ambiente', 'habitacao', 'defesa-civil',
      'politicas-mulheres', 'esportes', 'cultura', 'transportes-transito', 'mobilidade-urbana', 'agricultura',
      'educacao', 'assistencia-social', 'saude-atendimento', 'farmacia'];
    expect(withActions.filter((code) => !reached.has(code))).toEqual([]);
  });

  it('o TFD do catálogo pede o que o app de TFD precisa', () => {
    const tfd = routed.find(({ route }: any) => route.appAction === 'ENCAMINHAMENTOS_TFD');
    const props = Object.keys(tfd?.def.formSchema?.properties || {});
    expect(props).toEqual(expect.arrayContaining(['especialidade', 'procedimento', 'justificativa', 'cidadeDestino', 'estadoDestino']));
  });
});
