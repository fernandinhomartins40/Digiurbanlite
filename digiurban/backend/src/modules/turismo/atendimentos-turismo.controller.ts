import { BaseTabController } from '../core/base';
import { AtendimentosTurismoService } from './atendimentos-turismo.service';

export class AtendimentosTurismoController extends BaseTabController {
  constructor(service: AtendimentosTurismoService) { super(service); }
}
