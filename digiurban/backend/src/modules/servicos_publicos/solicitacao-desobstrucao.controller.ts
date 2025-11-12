import { BaseTabController } from '../core/base';
import { SolicitacaoDesobstrucaoService } from './solicitacao-desobstrucao.service';

export class SolicitacaoDesobstrucaoController extends BaseTabController {
  constructor(service: SolicitacaoDesobstrucaoService) { super(service); }
}
