import { BaseTabController } from '../core/base';
import { CalendarioEsportivoService } from './calendario-esportivo.service';

export class CalendarioEsportivoController extends BaseTabController {
  constructor(service: CalendarioEsportivoService) { super(service); }
}
