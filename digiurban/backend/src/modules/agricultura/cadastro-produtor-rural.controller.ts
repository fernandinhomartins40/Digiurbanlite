import { BaseTabController } from '../core/base';
import { CadastroProdutorRuralService } from './cadastro-produtor-rural.service';

export class CadastroProdutorRuralController extends BaseTabController {
  constructor(service: CadastroProdutorRuralService) { super(service); }
}
