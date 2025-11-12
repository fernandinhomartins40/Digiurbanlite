import { BaseTabController } from '../core/base';
import { AgendaCulturalService } from './agenda-cultural.service';

export class AgendaCulturalController extends BaseTabController {
  constructor(service: AgendaCulturalService) { super(service); }
}
