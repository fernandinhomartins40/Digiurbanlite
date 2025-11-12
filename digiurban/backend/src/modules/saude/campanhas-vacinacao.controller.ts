import { BaseTabController } from '../core/base';
import { CampanhasVacinacaoService } from './campanhas-vacinacao.service';

export class CampanhasVacinacaoController extends BaseTabController {
  constructor(service: CampanhasVacinacaoService) { super(service); }
}
