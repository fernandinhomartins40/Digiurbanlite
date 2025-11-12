import { BaseTabController } from '../core/base';
import { CadastroPacienteService } from './cadastro-paciente.service';

export class CadastroPacienteController extends BaseTabController {
  constructor(service: CadastroPacienteService) { super(service); }
}
