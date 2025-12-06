import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import dns from 'dns/promises';
import crypto from 'crypto';

const router = Router();

// Middleware já aplicado no email-server parent router

/**
 * GET /api/super-admin/email-server/domains
 * Lista todos os domínios configurados
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({
      where: { isActive: true }
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
      where: { isActive: true }
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
      const mxRecords = await dns.resolveMx(domain.domainName);
      const expectedMx = domain.emailServer.hostname;

      const found = mxRecords.some(record =>
        record.exchange.toLowerCase().includes(expectedMx.toLowerCase())
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
        expected: domain.emailServer.hostname,
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
      const txtRecords = await dns.resolveTxt(domain.domainName);
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
      const txtRecords = await dns.resolveTxt(dkimDomain);
      const dkimRecord = txtRecords
        .flat()
        .find(record => record.startsWith('v=DKIM1'));

      const verified = !!dkimRecord && dkimRecord.includes(domain.dkimPublicKey.substring(0, 50));

      res.json({
        recordType: 'DKIM',
        verified,
        found: !!dkimRecord,
        expected: `v=DKIM1; k=rsa; p=${domain.dkimPublicKey}`,
        actual: dkimRecord || undefined,
        errorMessage: !dkimRecord ? 'No DKIM record found' : undefined
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
      const txtRecords = await dns.resolveTxt(dmarcDomain);
      const dmarcRecord = txtRecords
        .flat()
        .find(record => record.startsWith('v=DMARC1'));

      const verified = !!dmarcRecord;

      res.json({
        recordType: 'DMARC',
        verified,
        found: !!dmarcRecord,
        expected: domain.dmarcPolicy || 'v=DMARC1; p=none',
        actual: dmarcRecord || undefined,
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
      const mxRecords = await dns.resolveMx(domain.domainName);
      const expectedMx = domain.emailServer.hostname;
      const found = mxRecords.some(record =>
        record.exchange.toLowerCase().includes(expectedMx.toLowerCase())
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
        expected: domain.emailServer.hostname,
        errorMessage: error.code === 'ENOTFOUND' ? 'No MX records found' : error.message
      });
    }

    // Verificar SPF
    try {
      const txtRecords = await dns.resolveTxt(domain.domainName);
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
        const txtRecords = await dns.resolveTxt(dkimDomain);
        const dkimRecord = txtRecords.flat().find(record => record.startsWith('v=DKIM1'));
        const verified = !!dkimRecord && dkimRecord.includes(domain.dkimPublicKey.substring(0, 50));

        results.push({
          recordType: 'DKIM',
          verified,
          found: !!dkimRecord,
          expected: `v=DKIM1; k=rsa; p=${domain.dkimPublicKey}`,
          actual: dkimRecord || undefined
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

    // Verificar DMARC (se habilitado)
    if (domain.dmarcEnabled) {
      try {
        const dmarcDomain = `_dmarc.${domain.domainName}`;
        const txtRecords = await dns.resolveTxt(dmarcDomain);
        const dmarcRecord = txtRecords.flat().find(record => record.startsWith('v=DMARC1'));

        results.push({
          recordType: 'DMARC',
          verified: !!dmarcRecord,
          found: !!dmarcRecord,
          expected: domain.dmarcPolicy || 'v=DMARC1; p=none',
          actual: dmarcRecord || undefined
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

    // TODO: Implementar envio real de email de teste
    // Por agora, apenas criar registro no banco
    const email = await prisma.email.create({
      data: {
        emailServerId: domain.emailServerId,
        domainId: domain.id,
        messageId: `test-${Date.now()}@${domain.domainName}`,
        fromEmail: `noreply@${domain.domainName}`,
        toEmail: to,
        subject,
        textContent: body,
        status: 'QUEUED',
        priority: 1
      }
    });

    res.json({ success: true, email });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

export default router;
