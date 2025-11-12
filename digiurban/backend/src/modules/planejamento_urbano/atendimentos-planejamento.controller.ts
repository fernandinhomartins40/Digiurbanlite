import { BaseTabController } from '../core/base';
import { AtendimentosPlanejamentoService } from './atendimentos-planejamento.service';

export class AtendimentosPlanejamentoController extends BaseTabController {
  constructor(service: AtendimentosPlanejamentoService) { super(service); }
}
