import { BaseTabController } from '../core/base';
import { SolicitacaoRondaService } from './solicitacao-ronda.service';

export class SolicitacaoRondaController extends BaseTabController {
  constructor(service: SolicitacaoRondaService) { super(service); }
}
