import { Router } from 'express';
import { issueServerCertificate, revokeCertificate } from '../services/certificate-authority.service';
import { signDocument, verifySignature } from '../services/document-signing.service';

const router = Router();

router.post('/issue', async (req, res) => {
  try {
    const result = await issueServerCertificate({
      userId: req.body.userId,
      commonName: req.body.commonName,
      email: req.body.email,
      department: req.body.department,
      certificateType: req.body.certificateType || 'SERVER',
      validityYears: req.body.validityYears || 2,
    });

    res.json({ success: true, certificate: result.certificate, privateKey: result.privateKey });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/revoke', async (req, res) => {
  try {
    await revokeCertificate(req.body.serialNumber, req.body.reason, req.body.revokedBy);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sign', async (req, res) => {
  try {
    const signature = await signDocument({
      documentId: req.body.documentId,
      certificateId: req.body.certificateId,
      privateKey: req.body.privateKey,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    res.json({ success: true, signature });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/verify/:signatureId', async (req, res) => {
  try {
    const result = await verifySignature(req.params.signatureId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
