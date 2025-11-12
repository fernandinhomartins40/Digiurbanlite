import { BaseTabController } from '../core/base';
import { AtendimentosEsportesService } from './atendimentos-esportes.service';

export class AtendimentosEsportesController extends BaseTabController {
  constructor(service: AtendimentosEsportesService) { super(service); }
}
