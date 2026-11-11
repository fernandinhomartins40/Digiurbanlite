/**
 * GET /api/admin/workbench — "Minha mesa": o que espera pelo servidor logado.
 * Montagem pretendida (index.ts): loadRoute('/api/admin/workbench', './routes/workbench.routes')
 *
 * Resposta 200:
 * {
 *   success: true,
 *   data: {
 *     total: number,                 // soma de `contagem` (totais reais, não só os 20 listados)
 *     itens: Array<{
 *       id: string,
 *       tipo: 'pedido'                  // pedido do servidor (fila "mine")
 *           | 'pedido_sem_responsavel'  // pedido sem responsável no escopo (fila "unassigned")
 *           | 'processo_interno'        // chegou para a pessoa/unidade ou prazo em até 5 dias úteis
 *           | 'assinatura'              // documento esperando a assinatura dela
 *           | 'cidadao'                 // cadastro aguardando conferência (só com citizens:verify)
 *           | 'conversa'                // conversa com mensagem não lida
 *           | 'atendimento'             // cidadão esperando atendente (ninguém assumiu)
 *           | 'compromisso',            // compromisso de hoje na agenda
 *       titulo: string,
 *       subtitulo: string | null,
 *       prazo: string | null,          // ISO; para compromisso = hora de início
 *       atrasado: boolean,
 *       urgencia: 'atrasado' | 'hoje' | 'com_prazo' | 'sem_prazo',
 *       link: string                   // rota do frontend que abre o item:
 *                                      // /admin/protocolos/{id} | /admin/processos-internos/{id}
 *                                      // | /admin/processos-internos/{id}/documentos/{docId}
 *                                      // | /admin/assinaturas-digitais | /admin/cidadaos/pendentes
 *                                      // | /admin/mensagens | /admin/agenda
 *     }>,                              // já ordenados: atrasado → hoje → com prazo → sem prazo
 *     contagem: Record<tipo, number>,  // todos os tipos presentes (0 quando vazio)
 *     apps: Array<{ app: string, quantidade: number, link: string }>, // filas dos apps com pedidos (só > 0)
 *     geradoEm: string                 // ISO
 *   }
 * }
 * Máximo de 20 itens por fonte. Fonte que falha volta vazia (a resposta segue).
 * Erro geral: 500 { error: string }.
 */

import { Router, Request, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { getWorkbench } from '../services/workbench/workbench.service';

const router = Router();
router.use(adminAuthMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.json({ success: true, data: await getWorkbench(user, (req as any).tenant) });
  } catch (error) {
    console.error('[minha mesa]', error);
    res.status(500).json({ error: 'Não foi possível carregar a sua mesa agora.' });
  }
});

export default router;
