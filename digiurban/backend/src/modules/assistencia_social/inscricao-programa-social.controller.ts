import { BaseTabController } from '../core/base';
import { InscricaoProgramaSocialService } from './inscricao-programa-social.service';

export class InscricaoProgramaSocialController extends BaseTabController {
  constructor(service: InscricaoProgramaSocialService) { super(service); }
}
