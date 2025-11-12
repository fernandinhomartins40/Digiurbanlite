import { BaseTabController } from '../core/base';
import { DenunciaConstrucaoIrregularService } from './denuncia-construcao-irregular.service';

export class DenunciaConstrucaoIrregularController extends BaseTabController {
  constructor(service: DenunciaConstrucaoIrregularService) { super(service); }
}
