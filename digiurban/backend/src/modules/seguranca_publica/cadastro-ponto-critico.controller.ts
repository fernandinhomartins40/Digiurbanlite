import { BaseTabController } from '../core/base';
import { CadastroPontoCriticoService } from './cadastro-ponto-critico.service';

export class CadastroPontoCriticoController extends BaseTabController {
  constructor(service: CadastroPontoCriticoService) { super(service); }
}
