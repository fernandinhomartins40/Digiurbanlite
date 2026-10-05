/**
 * Regras de decisão da biometria (puras, sem banco — testadas em decisions.test.ts).
 *
 * O motor (ultrazend-face-engine) só MEDE; quem decide é este serviço, com os
 * limites do painel. Antes a "prova de vida" era uma nota calculada no navegador
 * do próprio cidadão e o servidor acreditava nela.
 */

export type ChallengeDirection = 'left' | 'right';

export interface EngineFace {
  bbox: number[];
  detectionScore: number;
  faceSizeRatio: number;
  yaw: number | null;
  pitch: number | null;
  noseOffset: number;
  spoof: { isReal: boolean; confidence: number };
  quality: number | null;
  embedding: number[];
}

export interface EngineFrame {
  facesDetected: number;
  faces: EngineFace[];
}

export interface DecisionSettings {
  matchThreshold: number;
  reviewThreshold: number;
  minQuality: number;
  minLiveness: number;
  challengeYawDegrees: number;
}

export const DEFAULT_SETTINGS: DecisionSettings = {
  matchThreshold: 0.5,
  reviewThreshold: 0.4,
  minQuality: 0.55,
  minLiveness: 0.6,
  challengeYawDegrees: 12,
};

/** Tolerância para considerar "de frente" */
const FRONTAL_MAX_YAW = 15;
/** Mesma pessoa entre as fotos do desafio (rosto virado parece menos consigo mesmo) */
const SAME_PERSON_TURNED = 0.3;
const SAME_PERSON_FRONTAL = 0.45;
/** Dois cadastros quase igualmente parecidos: decide um humano */
const AMBIGUITY_MARGIN = 0.05;

export function dot(a: number[], b: number[]) {
  const size = Math.min(a.length, b.length);
  let sum = 0;
  for (let index = 0; index < size; index += 1) sum += a[index] * b[index];
  return sum;
}

export function normalize(vector: number[]) {
  const norm = Math.sqrt(dot(vector, vector));
  return norm ? vector.map((value) => value / norm) : vector;
}

export interface LivenessResult {
  passed: boolean;
  score: number;
  reasons: string[];
  quality: number | null;
  embedding: number[] | null;
  realFraction: number;
  challengeOk: boolean;
}

/**
 * Prova de vida com desafio: 3 fotos — de frente, virado para o lado SORTEADO
 * pelo servidor, de frente de novo. Uma foto parada ou um vídeo qualquer não
 * acerta o lado sorteado; o anti-fraude passivo (MiniFASNet) é sinal extra.
 *
 * Direção é a da PRÓPRIA pessoa: virar para a própria esquerda deixa o nariz à
 * direita dos olhos na imagem (noseOffset > 0) e a pose negativa (yaw < 0).
 */
export function evaluateChallenge(
  frames: EngineFrame[],
  direction: ChallengeDirection,
  settings: DecisionSettings = DEFAULT_SETTINGS
): LivenessResult {
  const reasons: string[] = [];
  const fail = (reason: string): LivenessResult => ({
    passed: false,
    score: 0,
    reasons: [reason],
    quality: null,
    embedding: null,
    realFraction: 0,
    challengeOk: false,
  });

  if (frames.length !== 3) return fail('A validação precisa de 3 fotos (de frente, virando o rosto e de frente).');
  if (frames.some((frame) => frame.facesDetected === 0)) return fail('Não encontramos um rosto em uma das fotos.');
  if (frames.some((frame) => frame.facesDetected > 1)) return fail('Apareceu mais de um rosto na câmera. Fique sozinho(a) no enquadramento.');

  const [front, turned, back] = frames.map((frame) => frame.faces[0]);

  const frontalOk = [front, back].every((face) => face.yaw !== null && Math.abs(face.yaw) <= FRONTAL_MAX_YAW);
  if (!frontalOk) reasons.push('Olhe de frente para a câmera no início e no fim.');

  const wantNegativeYaw = direction === 'left';
  const yaw = turned.yaw ?? 0;
  const turnedOk =
    Math.abs(yaw) >= settings.challengeYawDegrees &&
    (wantNegativeYaw ? yaw < 0 && turned.noseOffset > 0.05 : yaw > 0 && turned.noseOffset < -0.05);
  if (!turnedOk) reasons.push(`Vire o rosto para a sua ${direction === 'left' ? 'esquerda' : 'direita'} quando pedirmos.`);

  const samePerson =
    dot(front.embedding, turned.embedding) >= SAME_PERSON_TURNED &&
    dot(front.embedding, back.embedding) >= SAME_PERSON_FRONTAL;
  if (!samePerson) reasons.push('As fotos não parecem ser da mesma pessoa.');

  const realFraction = frames.filter((frame) => frame.faces[0].spoof.isReal).length / frames.length;
  const passiveOk = realFraction >= settings.minLiveness;
  if (!passiveOk) reasons.push('A imagem parece vir de uma foto ou de uma tela. Use a câmera ao vivo, com boa luz.');

  const challengeOk = frontalOk && turnedOk && samePerson;
  const passed = challengeOk && passiveOk;

  return {
    passed,
    score: Math.round(((challengeOk ? 0.5 : 0) + 0.5 * realFraction) * 1000) / 1000,
    reasons,
    quality: front.quality,
    embedding: front.embedding,
    realFraction,
    challengeOk,
  };
}

export type MatchStatus = 'MATCHED' | 'REVIEW_REQUIRED' | 'UNMATCHED';

export interface GalleryEntry {
  identityId: string;
  citizenId: string | null;
  vector: number[];
}

export interface MatchResult {
  identityId: string | null;
  citizenId: string | null;
  score: number;
  secondScore: number;
  status: MatchStatus;
  reviewReason: string | null;
}

/** Busca o cadastro mais parecido (vetores já normalizados) e aplica os limites */
export function findBestMatch(
  probe: number[],
  gallery: GalleryEntry[],
  settings: DecisionSettings = DEFAULT_SETTINGS
): MatchResult {
  const bestByIdentity = new Map<string, { entry: GalleryEntry; score: number }>();
  for (const entry of gallery) {
    const score = dot(probe, entry.vector);
    const current = bestByIdentity.get(entry.identityId);
    if (!current || score > current.score) bestByIdentity.set(entry.identityId, { entry, score });
  }

  const ranked = Array.from(bestByIdentity.values()).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  const score = best ? best.score : 0;
  const secondScore = second ? second.score : 0;

  if (!best || score < settings.reviewThreshold) {
    return {
      identityId: null,
      citizenId: null,
      score,
      secondScore,
      status: 'UNMATCHED',
      reviewReason: 'Nenhum cadastro parecido o suficiente',
    };
  }

  let status: MatchStatus = score >= settings.matchThreshold ? 'MATCHED' : 'REVIEW_REQUIRED';
  let reviewReason: string | null = status === 'MATCHED' ? null : 'Semelhança intermediária: confirme manualmente';

  if (second && secondScore >= settings.reviewThreshold && score - secondScore < AMBIGUITY_MARGIN) {
    status = 'REVIEW_REQUIRED';
    reviewReason = 'Dois cadastros muito parecidos com este rosto: confirme manualmente';
  }

  return {
    identityId: best.entry.identityId,
    citizenId: best.entry.citizenId,
    score,
    secondScore,
    status,
    reviewReason,
  };
}

/** Metadados vindos de fora nunca guardam vetor de rosto nem imagens */
export function sanitizeMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const blocked = /embedding|vector|descriptor|image|frame|base64|liveRead|liveSession/i;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (blocked.test(key)) continue;
    if (typeof value === 'string' && value.length > 500) continue;
    if (value && typeof value === 'object') continue; // só valores simples
    output[key] = value;
  }
  return output;
}
