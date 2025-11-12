import { BaseTabController } from '../core/base';
import { CadastroModalidadeEsportivaService } from './cadastro-modalidade-esportiva.service';

export class CadastroModalidadeEsportivaController extends BaseTabController {
  constructor(service: CadastroModalidadeEsportivaService) { super(service); }
}
