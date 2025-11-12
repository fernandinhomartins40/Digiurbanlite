import { BaseTabController } from '../core/base';
import { AtendimentosCulturaService } from './atendimentos-cultura.service';

export class AtendimentosCulturaController extends BaseTabController {
  constructor(service: AtendimentosCulturaService) { super(service); }
}
