import { BaseTabController } from '../core/base';
import { AlvaraConstrucaoService } from './alvara-construcao.service';

export class AlvaraConstrucaoController extends BaseTabController {
  constructor(service: AlvaraConstrucaoService) { super(service); }
}
