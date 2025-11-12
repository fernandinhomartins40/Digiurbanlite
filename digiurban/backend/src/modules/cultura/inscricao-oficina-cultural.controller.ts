import { BaseTabController } from '../core/base';
import { InscricaoOficinaCulturalService } from './inscricao-oficina-cultural.service';

export class InscricaoOficinaCulturalController extends BaseTabController {
  constructor(service: InscricaoOficinaCulturalService) { super(service); }
}
