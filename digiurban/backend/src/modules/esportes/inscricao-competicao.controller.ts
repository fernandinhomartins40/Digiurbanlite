import { BaseTabController } from '../core/base';
import { InscricaoCompeticaoService } from './inscricao-competicao.service';

export class InscricaoCompeticaoController extends BaseTabController {
  constructor(service: InscricaoCompeticaoService) { super(service); }
}
