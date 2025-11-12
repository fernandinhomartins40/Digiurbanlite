import { BaseTabController } from '../core/base';
import { GestaoMerendaService } from './gestao-merenda.service';

export class GestaoMerendaController extends BaseTabController {
  constructor(service: GestaoMerendaService) { super(service); }
}
