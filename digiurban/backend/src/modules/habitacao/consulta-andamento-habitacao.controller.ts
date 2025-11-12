import { BaseTabController } from '../core/base';
import { ConsultaAndamentoHabitacaoService } from './consulta-andamento-habitacao.service';

export class ConsultaAndamentoHabitacaoController extends BaseTabController {
  constructor(service: ConsultaAndamentoHabitacaoService) { super(service); }
}
