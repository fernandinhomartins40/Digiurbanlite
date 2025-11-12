import { BaseTabController } from '../core/base';
import { CadastroEventoCulturalService } from './cadastro-evento-cultural.service';

export class CadastroEventoCulturalController extends BaseTabController {
  constructor(service: CadastroEventoCulturalService) { super(service); }
}
