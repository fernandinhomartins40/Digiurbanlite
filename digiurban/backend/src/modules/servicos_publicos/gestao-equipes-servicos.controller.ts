import { BaseTabController } from '../core/base';
import { GestaoEquipesServicosService } from './gestao-equipes-servicos.service';

export class GestaoEquipesServicosController extends BaseTabController {
  constructor(service: GestaoEquipesServicosService) { super(service); }
}
