import { BaseTabController } from '../core/base';
import { CadastroAtletaService } from './cadastro-atleta.service';

export class CadastroAtletaController extends BaseTabController {
  constructor(service: CadastroAtletaService) { super(service); }
}
