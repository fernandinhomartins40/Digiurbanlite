import { BaseTabController } from '../core/base';
import { RegularizacaoFundiariaService } from './regularizacao-fundiaria.service';

export class RegularizacaoFundiariaController extends BaseTabController {
  constructor(service: RegularizacaoFundiariaService) { super(service); }
}
