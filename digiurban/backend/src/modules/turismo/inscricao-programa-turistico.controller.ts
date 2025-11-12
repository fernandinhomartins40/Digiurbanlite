import { BaseTabController } from '../core/base';
import { InscricaoProgramaTuristicoService } from './inscricao-programa-turistico.service';

export class InscricaoProgramaTuristicoController extends BaseTabController {
  constructor(service: InscricaoProgramaTuristicoService) { super(service); }
}
