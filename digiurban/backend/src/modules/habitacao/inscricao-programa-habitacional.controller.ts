import { BaseTabController } from '../core/base';
import { InscricaoProgramaHabitacionalService } from './inscricao-programa-habitacional.service';

export class InscricaoProgramaHabitacionalController extends BaseTabController {
  constructor(service: InscricaoProgramaHabitacionalService) { super(service); }
}
