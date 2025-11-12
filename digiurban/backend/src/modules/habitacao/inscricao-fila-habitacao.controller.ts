import { BaseTabController } from '../core/base';
import { InscricaoFilaHabitacaoService } from './inscricao-fila-habitacao.service';

export class InscricaoFilaHabitacaoController extends BaseTabController {
  constructor(service: InscricaoFilaHabitacaoService) { super(service); }
}
