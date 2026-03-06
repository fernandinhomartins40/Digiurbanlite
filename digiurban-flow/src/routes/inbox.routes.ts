/**
 * Inbox routes for pending processes.
 */
import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  AuthenticatedRequest,
  toFlowAuthContext,
} from '../middleware/auth.middleware';
import * as dispatchService from '../services/dispatch.service';

const router = Router();
router.use(authMiddleware);

function resolveOrganizationalUnitId(
  req: Request,
  auth: ReturnType<typeof toFlowAuthContext>,
): string {
  const queryId =
    (req.query.organizationalUnitId as string) ||
    (req.query.currentOrganizationalUnitId as string);

  if (queryId) {
    return queryId;
  }

  if (auth.organizationalUnitIds.length === 1) {
    return auth.organizationalUnitIds[0];
  }

  throw new Error('organizationalUnitId e obrigatorio');
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const organizationalUnitId = resolveOrganizationalUnitId(req, auth);
    const userId = req.query.userId as string | undefined;

    const processes = await dispatchService.getInbox(organizationalUnitId, auth, userId);
    res.json(processes);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/count', async (req: Request, res: Response) => {
  try {
    const auth = toFlowAuthContext(req as AuthenticatedRequest);
    const organizationalUnitId = resolveOrganizationalUnitId(req, auth);
    const userId = req.query.userId as string | undefined;

    const counts = await dispatchService.getInboxCount(organizationalUnitId, auth, userId);
    res.json(counts);
  } catch (error: unknown) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
