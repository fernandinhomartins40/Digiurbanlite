import { BaseTabController } from '../core/base';
import { SolicitacaoReparoViaService } from './solicitacao-reparo-via.service';

export class SolicitacaoReparoViaController extends BaseTabController {
  constructor(service: SolicitacaoReparoViaService) { super(service); }
}
