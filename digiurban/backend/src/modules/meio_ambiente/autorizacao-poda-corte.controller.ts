import { BaseTabController } from '../core/base';
import { AutorizacaoPodaCorteService } from './autorizacao-poda-corte.service';

export class AutorizacaoPodaCorteController extends BaseTabController {
  constructor(service: AutorizacaoPodaCorteService) { super(service); }
}
