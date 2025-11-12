import { BaseTabController } from '../core/base';
import { AtendimentosAssistenciaSocialService } from './atendimentos-assistencia-social.service';

export class AtendimentosAssistenciaSocialController extends BaseTabController {
  constructor(service: AtendimentosAssistenciaSocialService) { super(service); }
}
