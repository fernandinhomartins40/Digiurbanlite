import { BaseTabController } from '../core/base';
import { EncaminhamentoTfdService } from './encaminhamento-tfd.service';

export class EncaminhamentoTfdController extends BaseTabController {
  constructor(service: EncaminhamentoTfdService) { super(service); }
}
