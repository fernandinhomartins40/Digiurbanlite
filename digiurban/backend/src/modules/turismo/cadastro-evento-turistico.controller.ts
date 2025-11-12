import { BaseTabController } from '../core/base';
import { CadastroEventoTuristicoService } from './cadastro-evento-turistico.service';

export class CadastroEventoTuristicoController extends BaseTabController {
  constructor(service: CadastroEventoTuristicoService) { super(service); }
}
