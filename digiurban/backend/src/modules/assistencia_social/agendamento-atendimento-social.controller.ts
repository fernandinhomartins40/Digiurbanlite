import { BaseTabController } from '../core/base';
import { AgendamentoAtendimentoSocialService } from './agendamento-atendimento-social.service';

export class AgendamentoAtendimentoSocialController extends BaseTabController {
  constructor(service: AgendamentoAtendimentoSocialService) { super(service); }
}
