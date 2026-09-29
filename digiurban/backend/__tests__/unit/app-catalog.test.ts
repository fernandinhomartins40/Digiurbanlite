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
