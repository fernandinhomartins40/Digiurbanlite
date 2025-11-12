import { BaseTabController } from '../core/base';
import { ProjetoCulturalService } from './projeto-cultural.service';

export class ProjetoCulturalController extends BaseTabController {
  constructor(service: ProjetoCulturalService) { super(service); }
}
