import { BaseTabController } from '../core/base';
import { CadastroGuiaTuristicoService } from './cadastro-guia-turistico.service';

export class CadastroGuiaTuristicoController extends BaseTabController {
  constructor(service: CadastroGuiaTuristicoService) { super(service); }
}
