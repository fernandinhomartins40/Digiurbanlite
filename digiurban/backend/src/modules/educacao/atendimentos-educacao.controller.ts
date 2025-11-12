import { BaseTabController } from '../core/base';
import { AtendimentosEducacaoService } from './atendimentos-educacao.service';

export class AtendimentosEducacaoController extends BaseTabController {
  constructor(service: AtendimentosEducacaoService) { super(service); }
}
