import { BaseTabController } from '../core/base';
import { SolicitacaoCapinaService } from './solicitacao-capina.service';

export class SolicitacaoCapinaController extends BaseTabController {
  constructor(service: SolicitacaoCapinaService) { super(service); }
}
