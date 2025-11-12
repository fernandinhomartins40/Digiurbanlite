import { BaseTabController } from '../core/base';
import { InscricaoProgramaRuralService } from './inscricao-programa-rural.service';

export class InscricaoProgramaRuralController extends BaseTabController {
  constructor(service: InscricaoProgramaRuralService) { super(service); }
}
