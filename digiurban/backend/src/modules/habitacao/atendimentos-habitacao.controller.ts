import { BaseTabController } from '../core/base';
import { AtendimentosHabitacaoService } from './atendimentos-habitacao.service';

export class AtendimentosHabitacaoController extends BaseTabController {
  constructor(service: AtendimentosHabitacaoService) { super(service); }
}
