import { BaseTabController } from '../core/base';
import { CadastroUnidadeHabitacionalService } from './cadastro-unidade-habitacional.service';

export class CadastroUnidadeHabitacionalController extends BaseTabController {
  constructor(service: CadastroUnidadeHabitacionalService) { super(service); }
}
