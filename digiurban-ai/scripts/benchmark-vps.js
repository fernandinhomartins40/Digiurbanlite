/* eslint-disable no-console */
const axios = require('axios');

const baseUrl =
  process.env.AI_BENCHMARK_BASE_URL ||
  'http://localhost:9004/api/v1/internal/chat/completions';
const token = process.env.AI_SERVICE_TOKEN || process.env.AI_BENCHMARK_TOKEN || '';
const tenantId = process.env.AI_BENCHMARK_TENANT_ID || 'default';
const iterations = Math.max(1, Number.parseInt(process.env.AI_BENCHMARK_ITERATIONS || '2', 10));

const scenarios = [
  {
    name: 'greeting',
    payload: {
      prompt: 'Ola',
      mode: 'free',
      think: false,
    },
  },
  {
    name: 'draft',
    payload: {
      prompt: 'Escreva um oficio curto solicitando manutencao urgente da iluminacao publica em uma avenida municipal.',
      mode: 'free',
      think: false,
    },
  },
  {
    name: 'rag',
    payload: {
      prompt: 'Quais informacoes existem na base sobre catalogo de servicos e workflows?',
      mode: 'rag',
      think: false,
    },
  },
];

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * ratio));
  return sorted[index];
}

async function runScenario(client, scenario) {
  const results = [];

  for (let index = 0; index < iterations; index += 1) {
    const startedAt = Date.now();
    const response = await client.post('', scenario.payload);
    const latencyMs = Date.now() - startedAt;
    const data = response.data?.data || {};

    results.push({
      latencyMs,
      firstTokenLatencyMs: data.firstTokenLatencyMs || 0,
      tokensPerSecond: data.tokensPerSecond || 0,
      usedFallback: Boolean(data.usedFallback),
      model: data.model || 'unknown',
      profile: data.profile || 'unknown',
    });
  }

  return {
    scenario: scenario.name,
    samples: results.length,
    avgLatencyMs: Number(average(results.map((item) => item.latencyMs)).toFixed(1)),
    p95LatencyMs: Number(percentile(results.map((item) => item.latencyMs), 0.95).toFixed(1)),
    avgFirstTokenLatencyMs: Number(
      average(results.map((item) => item.firstTokenLatencyMs)).toFixed(1),
    ),
    avgTokensPerSecond: Number(average(results.map((item) => item.tokensPerSecond)).toFixed(2)),
    fallbackRate: Number(
      ((results.filter((item) => item.usedFallback).length / results.length) * 100).toFixed(1),
    ),
    models: Array.from(new Set(results.map((item) => item.model))),
    profiles: Array.from(new Set(results.map((item) => item.profile))),
  };
}

async function main() {
  if (!token) {
    throw new Error(
      'AI_SERVICE_TOKEN ou AI_BENCHMARK_TOKEN precisa estar definido para executar o benchmark.',
    );
  }

  const client = axios.create({
    baseURL: baseUrl,
    timeout: 180000,
    headers: {
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
      'Content-Type': 'application/json',
    },
  });

  const summary = [];
  for (const scenario of scenarios) {
    console.log(`Executando scenario: ${scenario.name}`);
    const result = await runScenario(client, scenario);
    summary.push(result);
    console.log(JSON.stringify(result, null, 2));
  }

  console.log('Resumo consolidado:');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
