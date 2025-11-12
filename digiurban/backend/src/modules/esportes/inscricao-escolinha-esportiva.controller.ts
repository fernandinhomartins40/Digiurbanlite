import { BaseTabController } from '../core/base';
import { InscricaoEscolinhaEsportivaService } from './inscricao-escolinha-esportiva.service';

export class InscricaoEscolinhaEsportivaController extends BaseTabController {
  constructor(service: InscricaoEscolinhaEsportivaService) { super(service); }
}
