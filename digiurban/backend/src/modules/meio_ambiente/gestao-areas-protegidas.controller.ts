import { BaseTabController } from '../core/base';
import { GestaoAreasProtegidasService } from './gestao-areas-protegidas.service';

export class GestaoAreasProtegidasController extends BaseTabController {
  constructor(service: GestaoAreasProtegidasService) { super(service); }
}
