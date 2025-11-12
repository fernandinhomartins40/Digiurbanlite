import { BaseTabController } from '../core/base';
import { AlvaraFuncionamentoService } from './alvara-funcionamento.service';

export class AlvaraFuncionamentoController extends BaseTabController {
  constructor(service: AlvaraFuncionamentoService) { super(service); }
}
