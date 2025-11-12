import { BaseTabController } from '../core/base';
import { CadastroEstabelecimentoTuristicoService } from './cadastro-estabelecimento-turistico.service';

export class CadastroEstabelecimentoTuristicoController extends BaseTabController {
  constructor(service: CadastroEstabelecimentoTuristicoService) { super(service); }
}
