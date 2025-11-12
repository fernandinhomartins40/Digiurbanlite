import { BaseTabController } from '../core/base';
import { AgendamentoConsultaService } from './agendamento-consulta.service';

export class AgendamentoConsultaController extends BaseTabController {
  constructor(service: AgendamentoConsultaService) { super(service); }
}
