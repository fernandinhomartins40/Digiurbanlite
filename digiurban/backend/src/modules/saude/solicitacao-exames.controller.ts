import { BaseTabController } from '../core/base';
import { SolicitacaoExamesService } from './solicitacao-exames.service';

export class SolicitacaoExamesController extends BaseTabController {
  constructor(service: SolicitacaoExamesService) { super(service); }
}
