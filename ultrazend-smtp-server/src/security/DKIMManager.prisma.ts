/**
 * @ultrazend/smtp-server - DKIM Manager (Prisma Version)
 * Gerenciamento de assinatura DKIM para autenticação de emails
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';
import { DKIMConfig, EmailData } from '../types';
import { prisma } from '../lib/prisma';

export class DKIMManager {
  private dkimConfigs: Map<string, DKIMConfig> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o gerenciador DKIM
   */
  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing DKIM Manager...');
      await this.loadDKIMConfigs();
      this.isInitialized = true;
      logger.info('DKIM Manager initialized successfully', {
        domains: this.dkimConfigs.size
      });
    } catch (error) {
      logger.error('Failed to initialize DKIM Manager', { error });
    }
  }

  /**
   * Carrega configurações DKIM do banco
   */
  private async loadDKIMConfigs(): Promise<void> {
    try {
      const dkimKeys = await prisma.dkimKey.findMany({
        where: { isActive: true },
        include: {
          domain: {
            select: { domainName: true }
          }
        }
      });

      dkimKeys.forEach(key => {
        const dkimConfig: DKIMConfig = {
          domain: key.domain.domainName,
          selector: key.selector,
          privateKey: key.privateKey,
          publicKey: key.publicKey,
          algorithm: key.algorithm as any,
          canonicalization: key.canonicalization as any,
          keySize: key.keySize as any
        };

        this.dkimConfigs.set(key.domain.domainName, dkimConfig);
      });

      logger.info('DKIM configurations loaded', {
        domains: Array.from(this.dkimConfigs.keys())
      });
    } catch (error) {
      logger.error('Failed to load DKIM configurations', { error });
    }
  }

  /**
   * Assina email com DKIM
   */
  async signEmail(emailData: EmailData): Promise<EmailData> {
    if (!this.isInitialized) {
      logger.warn('DKIM Manager not initialized, skipping signature');
      return emailData;
    }

    try {
      const domain = this.extractDomainFromEmail(emailData.from);
      const config = this.dkimConfigs.get(domain);

      if (!config) {
        logger.debug('No DKIM configuration found for domain', { domain });
        return emailData;
      }

      // Gerar assinatura DKIM
      const dkimSignature = this.generateDKIMSignature(emailData, config);

      const signedEmail: EmailData = {
        ...emailData,
        headers: {
          ...emailData.headers,
          'DKIM-Signature': dkimSignature
        },
        dkimSignature
      };

      logger.debug('Email signed with DKIM', {
        domain,
        selector: config.selector,
        algorithm: config.algorithm
      });

      return signedEmail;

    } catch (error) {
      logger.error('Failed to sign email with DKIM', { error });
      return emailData; // Retorna sem assinatura em caso de erro
    }
  }

  /**
   * Gera assinatura DKIM
   */
  private generateDKIMSignature(emailData: EmailData, config: DKIMConfig): string {
    // Calcular hash do corpo
    const bodyHash = this.calculateBodyHash(emailData);

    // Construir cabeçalho DKIM base
    const dkimHeader = [
      `v=1`,
      `a=${config.algorithm}`,
      `c=${config.canonicalization}`,
      `d=${config.domain}`,
      `s=${config.selector}`,
      `h=from:to:subject:date:message-id`,
      `bh=${bodyHash}`,
      `b=`
    ].join('; ');

    // Canonicalizar cabeçalhos para assinatura
    const headersToSign = this.canonicalizeHeaders(emailData);
    const signatureString = headersToSign + '\n' + dkimHeader;

    // Gerar assinatura
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureString, 'utf8');
    const signature = sign.sign(config.privateKey, 'base64');

    // Retornar cabeçalho DKIM completo
    return dkimHeader.replace('b=', `b=${signature}`);
  }

  /**
   * Calcula hash do corpo do email
   */
  private calculateBodyHash(emailData: EmailData): string {
    let body = emailData.html || emailData.text || '';

    // Canonicalizar corpo (relaxed)
    body = this.canonicalizeBodyRelaxed(body);

    // Calcular hash SHA-256
    return crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  }

  /**
   * Canonicalização relaxed do corpo
   */
  private canonicalizeBodyRelaxed(body: string): string {
    return body
      .replace(/\r\n/g, '\n') // Normalizar line endings
      .replace(/[ \t]+/g, ' ') // Reduzir espaços múltiplos
      .replace(/[ \t]+\n/g, '\n') // Remover espaços no final das linhas
      .replace(/\n+$/, '') // Remover linhas vazias no final
      + (body.length > 0 ? '\n' : '');
  }

  /**
   * Canonicaliza cabeçalhos para assinatura
   */
  private canonicalizeHeaders(emailData: EmailData): string {
    const headers = [];

    // Cabeçalhos obrigatórios para assinatura
    if (emailData.from) headers.push(`from:${emailData.from.toLowerCase()}`);
    if (emailData.to) headers.push(`to:${emailData.to.toLowerCase()}`);
    if (emailData.subject) headers.push(`subject:${emailData.subject}`);

    // Adicionar cabeçalhos de data e message-id se existirem
    const currentDate = new Date().toUTCString();
    headers.push(`date:${currentDate}`);

    if (emailData.messageId) {
      headers.push(`message-id:${emailData.messageId}`);
    }

    return headers.join('\n');
  }

  /**
   * Gera chaves DKIM para um domínio
   */
  async generateDKIMKeys(
    domain: string,
    selector: string = 'default',
    keySize: 1024 | 2048 | 4096 = 2048
  ): Promise<{ privateKey: string; publicKey: string; dnsRecord: string }> {
    try {
      logger.info('Generating DKIM keys', { domain, selector, keySize });

      // Gerar par de chaves RSA
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Extrair chave pública para DNS
      const publicKeyData = this.extractPublicKeyData(publicKey);
      const dnsRecord = `v=DKIM1; k=rsa; p=${publicKeyData}`;

      // Buscar ou criar domínio
      let domainRecord = await prisma.domain.findUnique({
        where: { domainName: domain }
      });

      if (!domainRecord) {
        // Criar usuário padrão se não existir
        let user = await prisma.user.findFirst();
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: 'admin@localhost',
              passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
              name: 'Admin',
              isVerified: true,
              isActive: true,
              isAdmin: true
            }
          });
        }

        // Criar domínio
        domainRecord = await prisma.domain.create({
          data: {
            userId: user.id,
            domainName: domain,
            isVerified: false,
            verificationToken: crypto.randomBytes(32).toString('hex'),
            dkimEnabled: true,
            spfEnabled: true
          }
        });
      }

      // Desativar chaves existentes
      await prisma.dkimKey.updateMany({
        where: { domainId: domainRecord.id },
        data: { isActive: false }
      });

      // Salvar nova chave
      await prisma.dkimKey.create({
        data: {
          domainId: domainRecord.id,
          selector,
          privateKey,
          publicKey: publicKeyData,
          algorithm: 'rsa-sha256',
          canonicalization: 'relaxed/relaxed',
          keySize,
          isActive: true
        }
      });

      // Atualizar cache
      const config: DKIMConfig = {
        domain,
        selector,
        privateKey,
        publicKey: publicKeyData,
        algorithm: 'rsa-sha256',
        canonicalization: 'relaxed/relaxed',
        keySize
      };

      this.dkimConfigs.set(domain, config);

      logger.info('DKIM keys generated successfully', { domain, selector });

      return {
        privateKey,
        publicKey: publicKeyData,
        dnsRecord
      };

    } catch (error) {
      logger.error('Failed to generate DKIM keys', { error, domain, selector });
      throw error;
    }
  }

  /**
   * Extrai dados da chave pública
   */
  private extractPublicKeyData(publicKeyPem: string): string {
    return publicKeyPem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');
  }

  /**
   * Extrai domínio do email
   */
  private extractDomainFromEmail(email: string): string {
    const match = email.match(/@([^>]+)/);
    return match ? match[1].trim() : '';
  }

  /**
   * Lista domínios com DKIM configurado
   */
  getDKIMDomains(): string[] {
    return Array.from(this.dkimConfigs.keys());
  }

  /**
   * Obtém configuração DKIM de um domínio
   */
  getDKIMConfig(domain: string): DKIMConfig | null {
    return this.dkimConfigs.get(domain) || null;
  }

  /**
   * Recarrega configurações do banco
   */
  async reloadConfigs(): Promise<void> {
    this.dkimConfigs.clear();
    await this.loadDKIMConfigs();
  }
}
