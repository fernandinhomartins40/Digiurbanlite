import sharp from 'sharp';

const DEFAULT_DESCRIPTOR_SIZE = 24;

function normalizeVector(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!norm) {
    return vector;
  }

  return vector.map((value) => value / norm);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const size = Math.min(a.length, b.length);

  if (!size) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < size; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class FaceDescriptorService {
  public async createDescriptorFromBase64(imageBase64: string) {
    const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const buffer = Buffer.from(base64, 'base64');

    return this.createDescriptorFromBuffer(buffer);
  }

  public async createDescriptorFromBuffer(imageBuffer: Buffer) {
    const raw = await sharp(imageBuffer)
      .rotate()
      .resize(DEFAULT_DESCRIPTOR_SIZE, DEFAULT_DESCRIPTOR_SIZE, {
        fit: 'cover',
        position: 'centre',
      })
      .grayscale()
      .raw()
      .toBuffer();

    const centered = Array.from(raw, (value) => value / 255).map((value) => value - 0.5);

    return normalizeVector(centered);
  }

  public normalizeDescriptor(vector: number[]) {
    return normalizeVector(vector);
  }
}

export default new FaceDescriptorService();
