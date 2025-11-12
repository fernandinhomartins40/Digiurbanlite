import { BaseTabController } from '../core/base';
import { AtendimentosAgriculturaService } from './atendimentos-agricultura.service';

export class AtendimentosAgriculturaController extends BaseTabController {
  constructor(service: AtendimentosAgriculturaService) { super(service); }
}
