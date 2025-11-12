import { BaseTabController } from '../core/base';
import { CalendarioEventosTuristicosService } from './calendario-eventos-turisticos.service';

export class CalendarioEventosTuristicosController extends BaseTabController {
  constructor(service: CalendarioEventosTuristicosService) { super(service); }
}
