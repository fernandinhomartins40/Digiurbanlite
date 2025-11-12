import { BaseTabController } from '../core/base';
import { CalendarioColetaService } from './calendario-coleta.service';

export class CalendarioColetaController extends BaseTabController {
  constructor(service: CalendarioColetaService) { super(service); }
}
