import { BaseTabController } from '../core/base';
import { ConsultaZoneamentoService } from './consulta-zoneamento.service';

export class ConsultaZoneamentoController extends BaseTabController {
  constructor(service: ConsultaZoneamentoService) { super(service); }
}
