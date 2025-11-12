import { BaseTabController } from '../core/base';
import { ReservaEspacoEsportivoService } from './reserva-espaco-esportivo.service';

export class ReservaEspacoEsportivoController extends BaseTabController {
  constructor(service: ReservaEspacoEsportivoService) { super(service); }
}
