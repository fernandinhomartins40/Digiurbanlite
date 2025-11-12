import { BaseTabController } from '../core/base';
import { TransferenciaEscolarService } from './transferencia-escolar.service';

export class TransferenciaEscolarController extends BaseTabController {
  constructor(service: TransferenciaEscolarService) { super(service); }
}
