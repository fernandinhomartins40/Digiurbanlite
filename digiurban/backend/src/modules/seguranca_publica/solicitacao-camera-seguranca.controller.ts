import { BaseTabController } from '../core/base';
import { SolicitacaoCameraSegurancaService } from './solicitacao-camera-seguranca.service';

export class SolicitacaoCameraSegurancaController extends BaseTabController {
  constructor(service: SolicitacaoCameraSegurancaService) { super(service); }
}
