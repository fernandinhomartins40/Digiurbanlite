import { BaseTabController } from '../core/base';
import { SolicitacaoAuxilioAluguelService } from './solicitacao-auxilio-aluguel.service';

export class SolicitacaoAuxilioAluguelController extends BaseTabController {
  constructor(service: SolicitacaoAuxilioAluguelService) { super(service); }
}
