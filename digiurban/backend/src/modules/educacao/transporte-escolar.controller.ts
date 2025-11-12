import { BaseTabController } from '../core/base';
import { TransporteEscolarService } from './transporte-escolar.service';

export class TransporteEscolarController extends BaseTabController {
  constructor(service: TransporteEscolarService) { super(service); }
}
