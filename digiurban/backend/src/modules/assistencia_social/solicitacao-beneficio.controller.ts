import { BaseTabController } from '../core/base';
import { SolicitacaoBeneficioService } from './solicitacao-beneficio.service';

export class SolicitacaoBeneficioController extends BaseTabController {
  constructor(service: SolicitacaoBeneficioService) { super(service); }
}
