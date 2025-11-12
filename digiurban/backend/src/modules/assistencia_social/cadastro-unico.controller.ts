import { BaseTabController } from '../core/base';
import { CadastroUnicoService } from './cadastro-unico.service';

export class CadastroUnicoController extends BaseTabController {
  constructor(service: CadastroUnicoService) { super(service); }
}
