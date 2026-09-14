/**
 * ============================================================================
 * EMAIL DOMAIN UTILITIES
 * ============================================================================
 * Utilitários para buscar dinamicamente o domínio de email configurado
 * no banco de dados, evitando valores hardcoded.
 */

// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

interface EmailDomainConfig {
  domainName: string;
  dkimEnabled: boolean;
  spfEnabled: boolean;
  isVerified: boolean;
}

let cachedDomain: EmailDomainConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca o domínio de email principal configurado no sistema
 * Usa cache para evitar múltiplas consultas ao banco
 */
export async function getPrimaryEmailDomain(): Promise<string> {
  try {
    const now = Date.now();

    // Usar cache se ainda válido
    if (cachedDomain && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedDomain.domainName;
    }

    // Buscar domínio verificado e com DKIM ativo
    const domain = await prisma.emailDomain.findFirst({
      where: {
        isVerified: true,
        dkimEnabled: true
      },
      orderBy: {
        createdAt: 'asc' // Pegar o mais antigo (principal)
      },
      select: {
        domainName: true,
        dkimEnabled: true,
        spfEnabled: true,
        isVerified: true
      }
    });

    if (domain) {
      cachedDomain = domain;
      cacheTimestamp = now;
      return domain.domainName;
    }

    // Fallback: buscar qualquer domínio verificado
    const anyVerifiedDomain = await prisma.emailDomain.findFirst({
      where: { isVerified: true },
      select: { domainName: true, dkimEnabled: true, spfEnabled: true, isVerified: true }
    });

    if (anyVerifiedDomain) {
      cachedDomain = anyVerifiedDomain;
      cacheTimestamp = now;
      console.warn(`⚠️ Usando domínio ${anyVerifiedDomain.domainName} sem DKIM ativo`);
      return anyVerifiedDomain.domainName;
    }

    // Último fallback
    console.error('❌ Nenhum domínio de email configurado no sistema!');
    return 'digiurban.com.br'; // Fallback hardcoded apenas como último recurso
  } catch (error) {
    console.error('Erro ao buscar domínio de email:', error);
    return 'digiurban.com.br'; // Fallback em caso de erro
  }
}

/**
 * Gera endereço de email completo usando o domínio configurado
 */
export async function getSystemEmail(localPart: string = 'noreply'): Promise<string> {
  const domain = await getPrimaryEmailDomain();
  return `${localPart}@${domain}`;
}

/**
 * Limpa o cache do domínio (útil após atualizar configurações)
 */
export function clearEmailDomainCache(): void {
  cachedDomain = null;
  cacheTimestamp = 0;
}

/**
 * Retorna informações completas do domínio (com cache)
 */
export async function getEmailDomainConfig(): Promise<EmailDomainConfig | null> {
  try {
    const now = Date.now();

    if (cachedDomain && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedDomain;
    }

    const domain = await prisma.emailDomain.findFirst({
      where: {
        isVerified: true,
        dkimEnabled: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        domainName: true,
        dkimEnabled: true,
        spfEnabled: true,
        isVerified: true
      }
    });

    if (domain) {
      cachedDomain = domain;
      cacheTimestamp = now;
    }

    return domain;
  } catch (error) {
    console.error('Erro ao buscar configuração do domínio:', error);
    return null;
  }
}
