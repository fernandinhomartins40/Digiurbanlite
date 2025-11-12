import { BaseTabController } from '../core/base';
import { CadastroRoteiroTuristicoService } from './cadastro-roteiro-turistico.service';

export class CadastroRoteiroTuristicoController extends BaseTabController {
  constructor(service: CadastroRoteiroTuristicoService) { super(service); }
}
