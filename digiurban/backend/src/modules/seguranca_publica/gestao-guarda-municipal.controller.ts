import { BaseTabController } from '../core/base';
import { GestaoGuardaMunicipalService } from './gestao-guarda-municipal.service';

export class GestaoGuardaMunicipalController extends BaseTabController {
  constructor(service: GestaoGuardaMunicipalService) { super(service); }
}
