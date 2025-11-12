import { BaseTabController } from '../core/base';
import { CadastroObraPublicaService } from './cadastro-obra-publica.service';

export class CadastroObraPublicaController extends BaseTabController {
  constructor(service: CadastroObraPublicaService) { super(service); }
}
