import { BaseTabController } from '../core/base';
import { SubmissaoProjetoCulturalService } from './submissao-projeto-cultural.service';

export class SubmissaoProjetoCulturalController extends BaseTabController {
  constructor(service: SubmissaoProjetoCulturalService) { super(service); }
}
