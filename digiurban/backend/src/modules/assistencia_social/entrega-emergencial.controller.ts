import { BaseTabController } from '../core/base';
import { EntregaEmergencialService } from './entrega-emergencial.service';

export class EntregaEmergencialController extends BaseTabController {
  constructor(service: EntregaEmergencialService) { super(service); }
}
