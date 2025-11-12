import { BaseTabController } from '../core/base';
import { PlanoDiretorService } from './plano-diretor.service';

export class PlanoDiretorController extends BaseTabController {
  constructor(service: PlanoDiretorService) { super(service); }
}
