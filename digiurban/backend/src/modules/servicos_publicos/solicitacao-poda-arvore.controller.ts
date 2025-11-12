import { BaseTabController } from '../core/base';
import { SolicitacaoPodaArvoreService } from './solicitacao-poda-arvore.service';

export class SolicitacaoPodaArvoreController extends BaseTabController {
  constructor(service: SolicitacaoPodaArvoreService) { super(service); }
}
