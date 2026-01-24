/**
 * @ultrazend/smtp-server (Prisma Version)
 * Servidor SMTP completo independente - Mini UltraZend
 *
 * FUNCIONALIDADES:
 * ✅ Servidor SMTP completo (MX + Submission)
 * ✅ Entrega direta via MX records (sem dependências externas!)
 * ✅ Autenticação de usuários
 * ✅ Assinatura DKIM automática
 * ✅ Banco de dados PostgreSQL com Prisma
 * ✅ Logs completos de conexões e entregas
 * ✅ Rate limiting e segurança
 * ✅ Processamento de emails entrada e saída
 */

export { UltraZendSMTPServer } from './server/SMTPServer.prisma';
export { MXDeliveryService } from './delivery/MXDeliveryService.prisma';
export { DKIMManager } from './security/DKIMManager.prisma';
export { Logger, logger } from './utils/logger';
export * from './utils/crypto';
export { prisma } from './lib/prisma';

// Exportar todos os tipos
export * from './types';

// Classe principal simplificada
import { UltraZendSMTPServer } from './server/SMTPServer.prisma';
import { SMTPServerConfig } from './types';
import { prisma } from './lib/prisma';

/**
 * Servidor SMTP completo - Plug & Play com PostgreSQL
 *
 * Exemplo de uso:
 * ```typescript
 * import { SMTPServer } from '@ultrazend/smtp-server';
 *
 * const server = new SMTPServer({
 *   hostname: 'mail.meusite.com',
 *   mxPort: 25,
 *   submissionPort: 587
 * });
 *
 * await server.start();
 * ```
 */
export class SMTPServer extends UltraZendSMTPServer {
  constructor(config: SMTPServerConfig = {}) {
    super(config);
  }

  /**
   * Método helper para criar usuário SMTP
   */
  async createUser(email: string, password: string, name: string = 'User'): Promise<string> {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    // Buscar primeiro servidor de email ativo
    const emailServer = await prisma.emailServer.findFirst({
      where: { isActive: true }
    });

    if (!emailServer) {
      throw new Error('No active email server found. Please create an EmailServer first.');
    }

    const user = await prisma.emailUser.create({
      data: {
        emailServerId: emailServer.id,
        email,
        passwordHash,
        name,
        isActive: true,
        isAdmin: false
      }
    });

    return user.id;
  }

  /**
   * Método helper para adicionar domínio
   */
  async addDomain(domain: string, emailServerId?: string): Promise<string> {
    // Se não especificou emailServerId, usar o primeiro servidor ativo
    if (!emailServerId) {
      const server = await prisma.emailServer.findFirst({
        where: { isActive: true }
      });
      if (!server) {
        throw new Error('No active email server found. Create an EmailServer first.');
      }
      emailServerId = server.id;
    }

    const domainRecord = await prisma.emailDomain.create({
      data: {
        emailServerId,
        domainName: domain,
        isVerified: false,
        dkimEnabled: true,
        spfEnabled: true
      }
    });

    return domainRecord.id;
  }

  /**
   * Método helper para gerar chaves DKIM
   */
  async setupDKIM(domain: string): Promise<string> {
    const result = await this.getDKIMManager().generateDKIMKeys(domain);

    console.log(`\n🔑 DKIM configurado para ${domain}`);
    console.log(`\n📋 Adicione este registro DNS TXT:`);
    console.log(`Nome: default._domainkey.${domain}`);
    console.log(`Valor: ${result.dnsRecord}`);
    console.log(`\n⚠️  IMPORTANTE: Adicione o registro DNS antes de enviar emails!\n`);

    return result.dnsRecord;
  }

  /**
   * Método helper para obter estatísticas
   */
  async getStats() {
    const now = new Date();
    const hour = new Date(now.getTime() - 3600000);

    const [
      totalEmails,
      recentLogs,
      authAttempts,
      activeDomains
    ] = await Promise.all([
      prisma.email.count(),
      prisma.emailLog.count({ where: { timestamp: { gte: hour } } }),
      prisma.emailAuthAttempt.count({ where: { timestamp: { gte: hour } } }),
      prisma.emailDomain.count({ where: { isVerified: true } })
    ]);

    return {
      totalEmails,
      recentConnections: recentLogs,
      authAttempts,
      activeDomains,
      uptime: process.uptime(),
      timestamp: now.toISOString()
    };
  }
}

// Exportar como default também
export default SMTPServer;
