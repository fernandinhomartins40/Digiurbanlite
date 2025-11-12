import { BaseTabController } from '../core/base';
import { CalendarioEscolarService } from './calendario-escolar.service';

export class CalendarioEscolarController extends BaseTabController {
  constructor(service: CalendarioEscolarService) { super(service); }
}
