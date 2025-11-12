import { BaseTabController } from '../core/base';
import { AssistenciaTecnicaRuralService } from './assistencia-tecnica-rural.service';

export class AssistenciaTecnicaRuralController extends BaseTabController {
  constructor(service: AssistenciaTecnicaRuralService) { super(service); }
}
