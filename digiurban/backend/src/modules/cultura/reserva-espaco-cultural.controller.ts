import { BaseTabController } from '../core/base';
import { ReservaEspacoCulturalService } from './reserva-espaco-cultural.service';

export class ReservaEspacoCulturalController extends BaseTabController {
  constructor(service: ReservaEspacoCulturalService) { super(service); }
}
