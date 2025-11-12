import { BaseTabController } from '../core/base';
import { CadastroLoteamentoService } from './cadastro-loteamento.service';

export class CadastroLoteamentoController extends BaseTabController {
  constructor(service: CadastroLoteamentoService) { super(service); }
}
