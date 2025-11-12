import { BaseTabController } from '../core/base';
import { CadastroPropriedadeRuralService } from './cadastro-propriedade-rural.service';

export class CadastroPropriedadeRuralController extends BaseTabController {
  constructor(service: CadastroPropriedadeRuralService) { super(service); }
}
