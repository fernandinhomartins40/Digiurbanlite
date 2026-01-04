import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import dns from 'dns/promises';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = Router();

// Criar resolver DNS confiável usando Google DNS
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '8.8.4.4']);

// Middleware já aplicado no email-server parent router

/**
 * GET /api/super-admin/email-server/domains
 * Lista todos os domínios configurados
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!emailServer) {
      return res.json({ domains: [] });
    }

    const domains = await prisma.emailDomain.findMany({
      where: { emailServerId: emailServer.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

/**
 * POST /api/super-admin/email-server/domains
 * Adiciona um novo domínio
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { domainName } = req.body;

    if (!domainName) {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    const emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!emailServer) {
      return res.status(404).json({ error: 'Email server not configured' });
    }

    // Verificar se o domínio já existe
    const existingDomain = await prisma.emailDomain.findFirst({
      where: {
        emailServerId: emailServer.id,
        domainName: domainName.toLowerCase()
      }
    });

    if (existingDomain) {
      return res.status(400).json({ error: 'Domain already exists' });
    }

    const domain = await prisma.emailDomain.create({
      data: {
        emailServerId: emailServer.id,
        domainName: domainName.toLowerCase(),
        isVerified: false,
        verificationToken: crypto.randomBytes(32).toString('hex'),
        dkimEnabled: true,
        dkimSelector: 'default',
        spfEnabled: true,
        spfRecord: 'v=spf1 mx ~all',
        dmarcEnabled: false
      }
    });

    res.json({ domain });
  } catch (error) {
    console.error('Error adding domain:', error);
    res.status(500).json({ error: 'Failed to add domain' });
  }
});

/**
 * GET /api/super-admin/email-server/domains/:id
 * Obtém detalhes de um domínio específico
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({ domain });
  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({ error: 'Failed to fetch domain' });
  }
});

/**
 * PUT /api/super-admin/email-server/domains/:id
 * Atualiza um domínio
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { spfEnabled, spfRecord, dmarcEnabled, dmarcPolicy } = req.body;

    const domain = await prisma.emailDomain.update({
      where: { id },
      data: {
        spfEnabled,
        spfRecord,
        dmarcEnabled,
        dmarcPolicy
      }
    });

    res.json({ domain });
  } catch (error) {
    console.error('Error updating domain:', error);
    res.status(500).json({ error: 'Failed to update domain' });
  }
});

/**
 * DELETE /api/super-admin/email-server/domains/:id
 * Remove um domínio
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.emailDomain.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

/**
 * POST /api/super-admin/email-server/domains/:id/dkim/generate
 * Gera chaves DKIM para um domínio
 */
router.post('/:id/dkim/generate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Gerar par de chaves RSA
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Extrair chave pública para DNS (remover headers e espaços)
    const publicKeyData = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s/g, '');

    // Atualizar domínio com as chaves
    await prisma.emailDomain.update({
      where: { id },
      data: {
        dkimPrivateKey: privateKey,
        dkimPublicKey: publicKeyData,
        dkimEnabled: true
      }
    });

    const dnsRecord = `v=DKIM1; k=rsa; p=${publicKeyData}`;

    res.json({
      keyPair: {
        selector: domain.dkimSelector,
        privateKey,
        publicKey: publicKeyData,
        dnsRecord
      }
    });
  } catch (error) {
    console.error('Error generating DKIM keys:', error);
    res.status(500).json({ error: 'Failed to generate DKIM keys' });
  }
});

/**
 * GET /api/super-admin/email-server/domains/:id/dkim
 * Obtém informações da chave DKIM de um domínio
 */
router.get('/:id/dkim', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id },
      select: {
        dkimEnabled: true,
        dkimSelector: true,
        dkimPublicKey: true
      }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({ dkim: domain });
  } catch (error) {
    console.error('Error fetching DKIM:', error);
    res.status(500).json({ error: 'Failed to fetch DKIM' });
  }
});

/**
 * POST /api/super-admin/email-server/domains/:id/verify-mx
 * Verifica o registro MX do domínio
 */
router.post('/:id/verify-mx', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id },
      include: { emailServer: true }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    try {
      const mxRecords = await dnsResolver.resolveMx(domain.domainName);
      // Cada domínio usa mail.{domainName}
      const expectedMx = `mail.${domain.domainName}`;

      const found = mxRecords.some(record =>
        record.exchange.toLowerCase() === expectedMx.toLowerCase()
      );

      res.json({
        recordType: 'MX',
        verified: found,
        found: true,
        expected: expectedMx,
        actual: mxRecords.map(r => r.exchange).join(', ')
      });
    } catch (error: any) {
      res.json({
        recordType: 'MX',
        verified: false,
        found: false,
        expected: `mail.${domain.domainName}`,
        errorMessage: error.code === 'ENOTFOUND' ? 'No MX records found' : error.message
      });
    }
  } catch (error) {
    console.error('Error verifying MX:', error);
    res.status(500).json({ error: 'Failed to verify MX' });
  }
});

/**
 * POST /api/super-admin/email-server/domains/:id/verify-spf
 * Verifica o registro SPF do domínio
 */
router.post('/:id/verify-spf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    try {
      const txtRecords = await dnsResolver.resolveTxt(domain.domainName);
      const spfRecord = txtRecords
        .flat()
        .find(record => record.startsWith('v=spf1'));

      const verified = !!spfRecord && spfRecord.includes('mx');

      res.json({
        recordType: 'SPF',
        verified,
        found: !!spfRecord,
        expected: domain.spfRecord || 'v=spf1 mx ~all',
        actual: spfRecord || undefined,
        errorMessage: !spfRecord ? 'No SPF record found' : undefined
      });
    } catch (error: any) {
      res.json({
        recordType: 'SPF',
        verified: false,
        found: false,
        expected: domain.spfRecord || 'v=spf1 mx ~all',
        errorMessage: error.code === 'ENOTFOUND' ? 'No TXT records found' : error.message
      });
    }
  } catch (error) {
    console.error('Error verifying SPF:', error);
    res.status(500).json({ error: 'Failed to verify SPF' });
  }
});

/**
 * POST /api/super-admin/email-server/domains/:id/verify-dkim
 * Verifica o registro DKIM do domínio
 */
router.post('/:id/verify-dkim', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (!domain.dkimPublicKey) {
      return res.json({
        recordType: 'DKIM',
        verified: false,
        found: false,
        expected: 'DKIM keys not generated yet',
        errorMessage: 'DKIM keys not configured'
      });
    }

    try {
      const dkimDomain = `${domain.dkimSelector}._domainkey.${domain.domainName}`;
      const txtRecords = await dnsResolver.resolveTxt(dkimDomain);
      const dkimRecord = txtRecords
        .flat()
        .join('') // TXT records podem vir em múltiplas strings, juntar todas
        .replace(/["'\s]/g, ''); // Remover aspas e espaços

      // Extrair apenas a chave pública do registro (parte após p=)
      const dkimKeyMatch = dkimRecord.match(/p=([A-Za-z0-9+/=]+)/);
      const dkimKeyFromDNS = dkimKeyMatch ? dkimKeyMatch[1] : '';

      // Limpar a chave do banco também
      const dkimKeyFromDB = domain.dkimPublicKey.replace(/\s/g, '');

      // Verificar se as chaves são iguais (comparação exata da parte p=)
      const verified = dkimKeyFromDNS === dkimKeyFromDB;

      res.json({
        recordType: 'DKIM',
        verified,
        found: !!dkimRecord && dkimRecord.startsWith('v=DKIM1'),
        expected: `v=DKIM1; k=rsa; p=${domain.dkimPublicKey}`,
        actual: txtRecords.flat().join('') || undefined,
        errorMessage: !dkimRecord ? 'No DKIM record found' : (!verified ? 'DKIM key mismatch' : undefined)
      });
    } catch (error: any) {
      res.json({
        recordType: 'DKIM',
        verified: false,
        found: false,
        expected: `v=DKIM1; k=rsa; p=${domain.dkimPublicKey}`,
        errorMessage: error.code === 'ENOTFOUND' ? 'No DKIM record found' : error.message
      });
    }
  } catch (error) {
    console.error('Error verifying DKIM:', error);
    res.status(500).json({ error: 'Failed to verify DKIM' });
  }
});

/**
 * POST /api/super-admin/email-server/domains/:id/verify-dmarc
 * Verifica o registro DMARC do domínio
 */
router.post('/:id/verify-dmarc', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    try {
      const dmarcDomain = `_dmarc.${domain.domainName}`;
      const txtRecords = await dnsResolver.resolveTxt(dmarcDomain);
      const dmarcRecord = txtRecords
        .flat()
        .join('') // TXT records podem vir em múltiplas strings
        .replace(/["'\s]/g, ''); // Remover aspas e espaços

      const verified = dmarcRecord.startsWith('v=DMARC1');

      res.json({
        recordType: 'DMARC',
        verified,
        found: !!dmarcRecord,
        expected: domain.dmarcPolicy || 'v=DMARC1; p=none',
        actual: txtRecords.flat().join('') || undefined,
        errorMessage: !dmarcRecord ? 'No DMARC record found' : undefined
      });
    } catch (error: any) {
      res.json({
        recordType: 'DMARC',
        verified: false,
        found: false,
        expected: domain.dmarcPolicy || 'v=DMARC1; p=none',
        errorMessage: error.code === 'ENOTFOUND' ? 'No DMARC record found' : error.message
      });
    }
  } catch (error) {
    console.error('Error verifying DMARC:', error);
    res.status(500).json({ error: 'Failed to verify DMARC' });
  }
});

/**
 * POST /api/super-admin/email-server/domains/:id/verify
 * Verifica todos os registros DNS do domínio
 */
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id },
      include: { emailServer: true }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const results = [];

    // Verificar MX
    try {
      const mxRecords = await dnsResolver.resolveMx(domain.domainName);
      const expectedMx = `mail.${domain.domainName}`;
      const found = mxRecords.some(record =>
        record.exchange.toLowerCase() === expectedMx.toLowerCase()
      );

      results.push({
        recordType: 'MX',
        verified: found,
        found: true,
        expected: expectedMx,
        actual: mxRecords.map(r => r.exchange).join(', ')
      });
    } catch (error: any) {
      results.push({
        recordType: 'MX',
        verified: false,
        found: false,
        expected: `mail.${domain.domainName}`,
        errorMessage: error.code === 'ENOTFOUND' ? 'No MX records found' : error.message
      });
    }

    // Verificar SPF
    try {
      const txtRecords = await dnsResolver.resolveTxt(domain.domainName);
      const spfRecord = txtRecords.flat().find(record => record.startsWith('v=spf1'));
      const verified = !!spfRecord && spfRecord.includes('mx');

      results.push({
        recordType: 'SPF',
        verified,
        found: !!spfRecord,
        expected: domain.spfRecord || 'v=spf1 mx ~all',
        actual: spfRecord || undefined
      });
    } catch (error: any) {
      results.push({
        recordType: 'SPF',
        verified: false,
        found: false,
        expected: domain.spfRecord || 'v=spf1 mx ~all',
        errorMessage: error.code === 'ENOTFOUND' ? 'No TXT records found' : error.message
      });
    }

    // Verificar DKIM
    if (domain.dkimPublicKey) {
      try {
        const dkimDomain = `${domain.dkimSelector}._domainkey.${domain.domainName}`;
        const txtRecords = await dnsResolver.resolveTxt(dkimDomain);
        const dkimRecord = txtRecords
          .flat()
          .join('') // TXT records podem vir em múltiplas strings
          .replace(/["'\s]/g, ''); // Remover aspas e espaços

        // Extrair apenas a chave pública do registro (parte após p=)
        const dkimKeyMatch = dkimRecord.match(/p=([A-Za-z0-9+/=]+)/);
        const dkimKeyFromDNS = dkimKeyMatch ? dkimKeyMatch[1] : '';
        const dkimKeyFromDB = domain.dkimPublicKey.replace(/\s/g, '');

        const verified = dkimKeyFromDNS === dkimKeyFromDB;

        results.push({
          recordType: 'DKIM',
          verified,
          found: !!dkimRecord && dkimRecord.startsWith('v=DKIM1'),
          expected: `v=DKIM1; k=rsa; p=${domain.dkimPublicKey}`,
          actual: txtRecords.flat().join('') || undefined
        });
      } catch (error: any) {
        results.push({
          recordType: 'DKIM',
          verified: false,
          found: false,
          expected: `v=DKIM1; k=rsa; p=${domain.dkimPublicKey}`,
          errorMessage: error.code === 'ENOTFOUND' ? 'No DKIM record found' : error.message
        });
      }
    }

    // Verificar DMARC (sempre verificar, independente de dmarcEnabled)
    try {
      const dmarcDomain = `_dmarc.${domain.domainName}`;
      const txtRecords = await dnsResolver.resolveTxt(dmarcDomain);
      const dmarcRecord = txtRecords
        .flat()
        .join('') // TXT records podem vir em múltiplas strings
        .replace(/["'\s]/g, ''); // Remover aspas e espaços

      const verified = dmarcRecord.startsWith('v=DMARC1');

      results.push({
        recordType: 'DMARC',
        verified,
        found: !!dmarcRecord,
        expected: domain.dmarcPolicy || 'v=DMARC1; p=none',
        actual: txtRecords.flat().join('') || undefined
      });
    } catch (error: any) {
      results.push({
        recordType: 'DMARC',
        verified: false,
        found: false,
        expected: domain.dmarcPolicy || 'v=DMARC1; p=none',
        errorMessage: error.code === 'ENOTFOUND' ? 'No DMARC record found' : error.message
      });
    }

    // Atualizar status do domínio se todos estão verificados
    const allVerified = results.every(r => r.verified);
    if (allVerified && !domain.isVerified) {
      await prisma.emailDomain.update({
        where: { id },
        data: { isVerified: true }
      });
    }

    res.json({ results });
  } catch (error) {
    console.error('Error verifying domain:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

/**
 * GET /api/super-admin/email-server/domains/:id/stats
 * Retorna estatísticas do domínio
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const domain = await prisma.emailDomain.findUnique({
      where: { id }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const [totalSent, totalDelivered, totalFailed, emailsWithOpens, emailsWithClicks] = await Promise.all([
      prisma.email.count({ where: { domainId: id } }),
      prisma.email.count({ where: { domainId: id, status: 'DELIVERED' } }),
      prisma.email.count({ where: { domainId: id, status: 'FAILED' } }),
      prisma.email.aggregate({
        where: { domainId: id },
        _sum: { opens: true }
      }),
      prisma.email.aggregate({
        where: { domainId: id },
        _sum: { clicks: true }
      })
    ]);

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const opensCount = emailsWithOpens._sum.opens || 0;
    const clicksCount = emailsWithClicks._sum.clicks || 0;
    const openRate = totalDelivered > 0 ? (opensCount / totalDelivered) * 100 : 0;
    const clickRate = opensCount > 0 ? (clicksCount / opensCount) * 100 : 0;

    res.json({
      stats: {
        domainName: domain.domainName,
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate,
        opensCount,
        clicksCount,
        openRate,
        clickRate
      }
    });
  } catch (error) {
    console.error('Error fetching domain stats:', error);
    res.status(500).json({ error: 'Failed to fetch domain stats' });
  }
});

/**
 * POST /api/super-admin/email-server/domains/:id/send-test-email
 * Envia um email de teste
 */
router.post('/:id/send-test-email', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { to, subject, body } = req.body;

    const domain = await prisma.emailDomain.findUnique({
      where: { id },
      include: { emailServer: true }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const messageId = `test-${Date.now()}@${domain.domainName}`;
    const email = await prisma.email.create({
      data: {
        emailServerId: domain.emailServerId,
        domainId: domain.id,
        messageId,
        fromEmail: `noreply@${domain.domainName}`,
        toEmail: to,
        subject,
        textContent: body,
        status: 'PROCESSING',
        priority: 1
      }
    });

    try {
      const delivery = await deliverTestEmail(domain.domainName, to, subject, body, messageId);

      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: 'DELIVERED',
          sentAt: new Date(),
          deliveredAt: new Date()
        }
      });

      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          type: 'DELIVERED',
          data: { response: delivery.response },
          timestamp: new Date()
        }
      });

      res.json({ success: true, email: { ...email, status: 'DELIVERED' } });
    } catch (sendError) {
      const errorMessage = sendError instanceof Error ? sendError.message : 'Delivery failed';

      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage
        }
      });

      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          type: 'FAILED',
          data: { error: errorMessage },
          timestamp: new Date()
        }
      });

      res.status(500).json({ success: false, error: errorMessage });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

/**
 * Detecta o PTR (reverse DNS) do servidor para usar no HELO
 */
async function getServerPTR(): Promise<string | null> {
  try {
    // Obter IP público do servidor
    const os = await import('os');
    const networkInterfaces = os.networkInterfaces();

    // Tentar obter IP de uma interface pública
    let publicIP: string | null = null;
    for (const [name, addresses] of Object.entries(networkInterfaces)) {
      if (!addresses) continue;
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          publicIP = addr.address;
          break;
        }
      }
      if (publicIP) break;
    }

    if (!publicIP) {
      return null;
    }

    // Fazer reverse DNS lookup
    const ptrRecords = await dnsResolver.reverse(publicIP);
    if (ptrRecords && ptrRecords.length > 0) {
      return ptrRecords[0].replace(/\.$/, ''); // Remove trailing dot
    }

    return null;
  } catch (error) {
    console.error('Failed to get PTR record:', error);
    return null;
  }
}

async function deliverTestEmail(
  fromDomain: string,
  to: string,
  subject: string,
  body: string,
  messageId: string
) {
  const toDomain = to.split('@')[1];
  if (!toDomain) {
    throw new Error('Invalid recipient');
  }

  // Buscar domínio com DKIM
  const emailDomain = await prisma.emailDomain.findFirst({
    where: { domainName: fromDomain }
  });

  if (!emailDomain) {
    throw new Error(`Domain ${fromDomain} not configured`);
  }

  // Detectar PTR dinâmico ou usar mail.{fromDomain}
  const ptrRecord = await getServerPTR();
  const heloName = ptrRecord || `mail.${fromDomain}`;

  const mxRecords = await dnsResolver.resolveMx(toDomain);
  if (!mxRecords || mxRecords.length === 0) {
    throw new Error(`No MX records found for domain: ${toDomain}`);
  }

  mxRecords.sort((a, b) => a.priority - b.priority);

  let lastError: Error | null = null;
  for (const mx of mxRecords) {
    try {
      const transportOptions: any = {
        host: mx.exchange,
        port: 25,
        secure: false,
        tls: { rejectUnauthorized: false },
        name: heloName // HELO/EHLO name dinâmico
      };

      // Configurar DKIM se habilitado
      if (emailDomain.dkimEnabled && emailDomain.dkimPrivateKey) {
        transportOptions.dkim = {
          domainName: fromDomain,
          keySelector: emailDomain.dkimSelector || 'default',
          privateKey: emailDomain.dkimPrivateKey
        };
      }

      const transporter = nodemailer.createTransport(transportOptions);

      const result = await transporter.sendMail({
        from: `noreply@${fromDomain}`,
        to,
        subject,
        text: body,
        messageId: `<${messageId}>`,
        headers: {
          'X-Mailer': 'DigiUrban Mail Server',
          'X-Originating-IP': await getServerPTR() || 'unknown'
        }
      });

      return { response: result.response };
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All MX servers failed');
}

export default router;
