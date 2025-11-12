import { BaseTabController } from '../core/base';
import { AtendimentosMeioAmbienteService } from './atendimentos-meio-ambiente.service';

export class AtendimentosMeioAmbienteController extends BaseTabController {
  constructor(service: AtendimentosMeioAmbienteService) { super(service); }
}
