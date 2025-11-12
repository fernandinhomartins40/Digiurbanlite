import { BaseTabController } from '../core/base';
import { ColetaEspecialService } from './coleta-especial.service';

export class ColetaEspecialController extends BaseTabController {
  constructor(service: ColetaEspecialService) { super(service); }
}
