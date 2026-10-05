import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateChallenge, findBestMatch, normalize, sanitizeMetadata, type EngineFrame } from './decisions';

const person = normalize([1, 0.2, 0.1, 0]);
const sameTurned = normalize([0.85, 0.45, 0.1, 0.2]);
const stranger = normalize([0, 0.1, 1, 0.3]);

function frame(yaw: number, noseOffset: number, embedding: number[], isReal = true, faces = 1): EngineFrame {
  return {
    facesDetected: faces,
    faces: [{
      bbox: [0, 0, 10, 10], detectionScore: 1, faceSizeRatio: 0.3, yaw, pitch: 0, noseOffset,
      spoof: { isReal, confidence: 0.99 }, quality: 0.8, embedding,
    }],
  };
}

describe('prova de vida com desafio', () => {
  it('aceita quem vira para o lado pedido', () => {
    const left = evaluateChallenge([frame(-1, 0.02, person), frame(-20, 0.2, sameTurned), frame(2, 0, person)], 'left');
    assert.equal(left.passed, true, left.reasons.join(' | '));
    const right = evaluateChallenge([frame(1, 0, person), frame(18, -0.15, sameTurned), frame(0, 0, person)], 'right');
    assert.equal(right.passed, true, right.reasons.join(' | '));
  });

  it('recusa quem vira para o lado errado (foto/vídeo não acerta o lado sorteado)', () => {
    const result = evaluateChallenge([frame(0, 0, person), frame(20, -0.2, sameTurned), frame(0, 0, person)], 'left');
    assert.equal(result.passed, false);
  });

  it('recusa foto parada (não vira o rosto)', () => {
    const result = evaluateChallenge([frame(0, 0, person), frame(1, 0, person), frame(0, 0, person)], 'right');
    assert.equal(result.passed, false);
  });

  it('recusa troca de pessoa no meio', () => {
    const result = evaluateChallenge([frame(0, 0, person), frame(-20, 0.2, stranger), frame(0, 0, person)], 'left');
    assert.equal(result.passed, false);
  });

  it('recusa quando o anti-fraude vê tela/papel na maioria das fotos', () => {
    const result = evaluateChallenge(
      [frame(0, 0, person, false), frame(-20, 0.2, sameTurned, false), frame(0, 0, person, true)],
      'left'
    );
    assert.equal(result.passed, false);
    assert.equal(result.challengeOk, true);
  });

  it('recusa mais de um rosto', () => {
    const result = evaluateChallenge([frame(0, 0, person, true, 2), frame(-20, 0.2, sameTurned), frame(0, 0, person)], 'left');
    assert.equal(result.passed, false);
  });
});

describe('reconhecimento', () => {
  const gallery = [
    { identityId: 'a', citizenId: 'ca', vector: person },
    { identityId: 'b', citizenId: 'cb', vector: stranger },
  ];

  it('reconhece acima do limite', () => {
    const result = findBestMatch(person, gallery);
    assert.equal(result.status, 'MATCHED');
    assert.equal(result.citizenId, 'ca');
  });

  it('não reconhece estranho', () => {
    const result = findBestMatch(normalize([0, 1, 0, 0]), gallery);
    assert.equal(result.status, 'UNMATCHED');
    assert.equal(result.identityId, null);
  });

  it('dois cadastros quase iguais vão para revisão', () => {
    const twin = normalize([0.99, 0.21, 0.1, 0.01]);
    const result = findBestMatch(person, [...gallery, { identityId: 'c', citizenId: 'cc', vector: twin }]);
    assert.equal(result.status, 'REVIEW_REQUIRED');
  });
});

describe('metadados', () => {
  it('nunca guarda vetor nem imagem', () => {
    const clean = sanitizeMetadata({ embedding: [1, 2], recognitionEmbedding: [1], imageBase64: 'x', note: 'ok', liveRead: {} });
    assert.deepEqual(clean, { note: 'ok' });
  });
});
