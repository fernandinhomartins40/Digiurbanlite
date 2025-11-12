import { BaseTabController } from '../core/base';
import { ConsultaObrasService } from './consulta-obras.service';

export class ConsultaObrasController extends BaseTabController {
  constructor(service: ConsultaObrasService) { super(service); }
}
