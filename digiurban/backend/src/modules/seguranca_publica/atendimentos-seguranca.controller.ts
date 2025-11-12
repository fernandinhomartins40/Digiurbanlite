import { BaseTabController } from '../core/base';
import { AtendimentosSegurancaService } from './atendimentos-seguranca.service';

export class AtendimentosSegurancaController extends BaseTabController {
  constructor(service: AtendimentosSegurancaService) { super(service); }
}
