import { BaseTabController } from '../core/base';
import { AtendimentosSaudeService } from './atendimentos-saude.service';

export class AtendimentosSaudeController extends BaseTabController {
  constructor(service: AtendimentosSaudeService) { super(service); }
}
