import { BaseTabController } from '../core/base';
import { AtendimentosServicosPublicosService } from './atendimentos-servicos-publicos.service';

export class AtendimentosServicosPublicosController extends BaseTabController {
  constructor(service: AtendimentosServicosPublicosService) { super(service); }
}
