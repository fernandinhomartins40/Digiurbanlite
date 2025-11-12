import { BaseTabController } from '../core/base';
import { CadastroEquipeEsportivaService } from './cadastro-equipe-esportiva.service';

export class CadastroEquipeEsportivaController extends BaseTabController {
  constructor(service: CadastroEquipeEsportivaService) { super(service); }
}
