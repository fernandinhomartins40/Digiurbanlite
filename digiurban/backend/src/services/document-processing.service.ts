/**
 * ============================================================================
 * DOCUMENT PROCESSING SERVICE
 * ============================================================================
 * Serviço inteligente de processamento de documentos com OCR e análise
 */

import * as path from 'path';
import * as fs from 'fs';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
}

export interface DocumentInfo {
  type?: string;
  number?: string;
  name?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  issueDate?: string;
  expiryDate?: string;
  additionalInfo?: Record<string, string>;
}

export interface ProcessedDocument {
  ocrResult: OCRResult;
  extractedInfo: DocumentInfo;
  imageQuality: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  removeNoise?: boolean;
  enhanceContrast?: boolean;
  sharpen?: boolean;
}

// ============================================================================
// DOCUMENT PROCESSING SERVICE
// ============================================================================

export class DocumentProcessingService {
  private worker: any = null;
  private workerReady = false;

  /**
   * Inicializa o worker do Tesseract
   */
  async initializeOCR() {
    if (this.workerReady) return;

    try {
      this.worker = await createWorker('por', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      this.workerReady = true;
      console.log('✅ OCR Worker inicializado');
    } catch (error) {
      console.error('Erro ao inicializar OCR:', error);
      throw new Error('Falha ao inicializar OCR');
    }
  }

  /**
   * Finaliza o worker do Tesseract
   */
  async terminateOCR() {
    if (this.worker && this.workerReady) {
      await this.worker.terminate();
      this.workerReady = false;
      console.log('OCR Worker terminado');
    }
  }

  /**
   * Processa imagem com OCR
   */
  async performOCR(imagePath: string): Promise<OCRResult> {
    if (!this.workerReady) {
      await this.initializeOCR();
    }

    const startTime = Date.now();

    try {
      const { data } = await this.worker.recognize(imagePath);

      return {
        text: data.text,
        confidence: data.confidence,
        language: 'por',
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Erro no OCR:', error);
      throw new Error('Falha no processamento OCR');
    }
  }

  /**
   * Extrai informações estruturadas do texto OCR
   */
  extractDocumentInfo(ocrText: string, documentType?: string): DocumentInfo {
    const info: DocumentInfo = {};

    // Detectar tipo de documento se não fornecido
    if (!documentType) {
      if (ocrText.includes('REPÚBLICA FEDERATIVA DO BRASIL')) {
        documentType = ocrText.includes('CARTEIRA DE IDENTIDADE') ? 'RG' : 'CPF';
      } else if (ocrText.includes('CARTEIRA NACIONAL DE HABILITAÇÃO') || ocrText.includes('CNH')) {
        documentType = 'CNH';
      }
    }

    info.type = documentType;

    // Extrair CPF (padrão: XXX.XXX.XXX-XX ou XXXXXXXXXXX)
    const cpfMatch = ocrText.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/);
    if (cpfMatch) {
      info.cpf = cpfMatch[1].replace(/[^\d]/g, '');
    }

    // Extrair RG (vários formatos possíveis)
    const rgMatch = ocrText.match(/RG[:\s]*([0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-?[0-9X])/i);
    if (rgMatch) {
      info.rg = rgMatch[1];
    }

    // Extrair nome (geralmente após "NOME:" ou em linhas específicas)
    const nameMatch = ocrText.match(/NOME[:\s]*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+)/i);
    if (nameMatch) {
      info.name = nameMatch[1].trim();
    }

    // Extrair data de nascimento (formatos: DD/MM/AAAA, DD.MM.AAAA, DD-MM-AAAA)
    const birthDateMatch = ocrText.match(/NASCIMENTO[:\s]*(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i);
    if (birthDateMatch) {
      info.birthDate = birthDateMatch[1];
    }

    // Extrair data de emissão
    const issueDateMatch = ocrText.match(/EMISS[ÃA]O[:\s]*(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i);
    if (issueDateMatch) {
      info.issueDate = issueDateMatch[1];
    }

    // Extrair data de validade
    const expiryMatch = ocrText.match(/VALIDADE[:\s]*(\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4})/i);
    if (expiryMatch) {
      info.expiryDate = expiryMatch[1];
    }

    return info;
  }

  /**
   * Otimiza imagem para melhor OCR
   */
  async optimizeImageForOCR(
    inputPath: string,
    outputPath?: string,
    options: ImageOptimizationOptions = {}
  ): Promise<string> {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 90,
      format = 'jpeg',
      removeNoise = true,
      enhanceContrast = true,
      sharpen = true
    } = options;

    const output = outputPath || inputPath.replace(/\.[^.]+$/, `_optimized.${format}`);

    try {
      let pipeline = sharp(inputPath);

      // Redimensionar se necessário
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Converter para escala de cinza (melhor para OCR)
      pipeline = pipeline.grayscale();

      // Aumentar contraste
      if (enhanceContrast) {
        pipeline = pipeline.normalize();
      }

      // Aplicar nitidez
      if (sharpen) {
        pipeline = pipeline.sharpen();
      }

      // Remover ruído (blur leve)
      if (removeNoise) {
        pipeline = pipeline.median(3);
      }

      // Salvar imagem otimizada
      if (format === 'jpeg') {
        await pipeline.jpeg({ quality }).toFile(output);
      } else if (format === 'png') {
        await pipeline.png({ quality }).toFile(output);
      } else if (format === 'webp') {
        await pipeline.webp({ quality }).toFile(output);
      }

      return output;
    } catch (error) {
      console.error('Erro ao otimizar imagem:', error);
      throw new Error('Falha na otimização da imagem');
    }
  }

  /**
   * Analisa qualidade da imagem
   */
  async analyzeImageQuality(imagePath: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await sharp(imagePath).stats();

      // Verificar resolução
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const megapixels = (width * height) / 1000000;

      if (megapixels < 1) {
        issues.push('Resolução muito baixa');
        recommendations.push('Use uma imagem com pelo menos 1 megapixel');
        score -= 20;
      } else if (megapixels < 2) {
        issues.push('Resolução abaixo do ideal');
        recommendations.push('Recomendado usar imagem com 2+ megapixels');
        score -= 10;
      }

      // Verificar brilho
      const avgBrightness = stats.channels.reduce(
        (sum, channel) => sum + channel.mean,
        0
      ) / stats.channels.length;

      if (avgBrightness < 60) {
        issues.push('Imagem muito escura');
        recommendations.push('Aumente a iluminação ou brilho');
        score -= 15;
      } else if (avgBrightness > 200) {
        issues.push('Imagem muito clara');
        recommendations.push('Reduza a iluminação ou exposição');
        score -= 15;
      }

      // Verificar contraste
      const stdDev = stats.channels.reduce(
        (sum, channel) => sum + channel.stdev,
        0
      ) / stats.channels.length;

      if (stdDev < 30) {
        issues.push('Contraste baixo');
        recommendations.push('Aumente o contraste da imagem');
        score -= 10;
      }

      // Verificar tamanho do arquivo
      const fileStats = fs.statSync(imagePath);
      const fileSizeMB = fileStats.size / (1024 * 1024);

      if (fileSizeMB > 10) {
        issues.push('Arquivo muito grande');
        recommendations.push('Comprima a imagem para melhor desempenho');
        score -= 5;
      }

      // Garantir score mínimo de 0
      score = Math.max(0, score);

      return {
        score,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Erro ao analisar qualidade:', error);
      return {
        score: 0,
        issues: ['Erro ao analisar imagem'],
        recommendations: ['Verifique se o arquivo é uma imagem válida']
      };
    }
  }

  /**
   * Processa documento completo (otimização + OCR + extração)
   */
  async processDocument(
    imagePath: string,
    documentType?: string
  ): Promise<ProcessedDocument> {
    try {
      // 1. Analisar qualidade
      const imageQuality = await this.analyzeImageQuality(imagePath);

      // 2. Otimizar imagem se qualidade não for boa
      let processPath = imagePath;
      if (imageQuality.score < 70) {
        console.log('Otimizando imagem para melhor OCR...');
        processPath = await this.optimizeImageForOCR(imagePath);
      }

      // 3. Executar OCR
      const ocrResult = await this.performOCR(processPath);

      // 4. Extrair informações estruturadas
      const extractedInfo = this.extractDocumentInfo(ocrResult.text, documentType);

      // 5. Limpar arquivo otimizado se foi criado
      if (processPath !== imagePath && fs.existsSync(processPath)) {
        fs.unlinkSync(processPath);
      }

      return {
        ocrResult,
        extractedInfo,
        imageQuality
      };
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      throw error;
    }
  }

  /**
   * Valida CPF extraído
   */
  validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  /**
   * Compara informações extraídas com dados fornecidos
   */
  compareDocumentInfo(
    extracted: DocumentInfo,
    provided: Partial<DocumentInfo>
  ): {
    match: boolean;
    mismatches: string[];
    confidence: number;
  } {
    const mismatches: string[] = [];
    let matches = 0;
    let comparisons = 0;

    // Comparar CPF
    if (extracted.cpf && provided.cpf) {
      comparisons++;
      const extractedCPF = extracted.cpf.replace(/[^\d]/g, '');
      const providedCPF = provided.cpf.replace(/[^\d]/g, '');
      if (extractedCPF === providedCPF) {
        matches++;
      } else {
        mismatches.push(`CPF não coincide: ${extractedCPF} vs ${providedCPF}`);
      }
    }

    // Comparar nome (similaridade)
    if (extracted.name && provided.name) {
      comparisons++;
      const extractedName = extracted.name.toUpperCase().replace(/\s+/g, ' ').trim();
      const providedName = provided.name.toUpperCase().replace(/\s+/g, ' ').trim();

      if (extractedName.includes(providedName) || providedName.includes(extractedName)) {
        matches++;
      } else {
        mismatches.push(`Nome não coincide: "${extractedName}" vs "${providedName}"`);
      }
    }

    // Calcular confiança
    const confidence = comparisons > 0 ? (matches / comparisons) * 100 : 0;

    return {
      match: mismatches.length === 0 && comparisons > 0,
      mismatches,
      confidence
    };
  }

  /**
   * Converte imagem HEIC/HEIF para JPEG (iOS)
   */
  async convertHEICtoJPEG(inputPath: string, outputPath?: string): Promise<string> {
    const output = outputPath || inputPath.replace(/\.heic$/i, '.jpg');

    try {
      await sharp(inputPath)
        .jpeg({ quality: 90 })
        .toFile(output);

      return output;
    } catch (error) {
      console.error('Erro ao converter HEIC:', error);
      throw new Error('Falha na conversão HEIC para JPEG');
    }
  }

  /**
   * Detecta orientação e rotaciona imagem se necessário
   */
  async autoRotateImage(imagePath: string): Promise<string> {
    try {
      await sharp(imagePath)
        .rotate() // Auto-rotação baseada em EXIF
        .toFile(imagePath.replace(/(\.[^.]+)$/, '_rotated$1'));

      return imagePath.replace(/(\.[^.]+)$/, '_rotated$1');
    } catch (error) {
      console.error('Erro ao rotacionar imagem:', error);
      return imagePath;
    }
  }
}

// Exportar instância singleton
export const documentProcessingService = new DocumentProcessingService();
