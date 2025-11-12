import { BaseTabController } from '../core/base';
import { SolicitacaoCertidaoService } from './solicitacao-certidao.service';

export class SolicitacaoCertidaoController extends BaseTabController {
  constructor(service: SolicitacaoCertidaoService) { super(service); }
}
