import { BaseTabController } from '../core/base';
import { AtendimentosObrasService } from './atendimentos-obras.service';

export class AtendimentosObrasController extends BaseTabController {
  constructor(service: AtendimentosObrasService) { super(service); }
}
