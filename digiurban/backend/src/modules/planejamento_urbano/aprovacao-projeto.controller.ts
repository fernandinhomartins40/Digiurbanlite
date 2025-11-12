import { BaseTabController } from '../core/base';
import { AprovacaoProjetoService } from './aprovacao-projeto.service';

export class AprovacaoProjetoController extends BaseTabController {
  constructor(service: AprovacaoProjetoService) { super(service); }
}
