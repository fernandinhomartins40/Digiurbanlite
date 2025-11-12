import { BaseTabController } from '../core/base';
import { ControleMedicamentosService } from './controle-medicamentos.service';

export class ControleMedicamentosController extends BaseTabController {
  constructor(service: ControleMedicamentosService) { super(service); }
}
