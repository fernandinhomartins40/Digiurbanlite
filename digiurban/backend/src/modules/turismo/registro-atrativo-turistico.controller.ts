import { BaseTabController } from '../core/base';
import { RegistroAtrativoTuristicoService } from './registro-atrativo-turistico.service';

export class RegistroAtrativoTuristicoController extends BaseTabController {
  constructor(service: RegistroAtrativoTuristicoService) { super(service); }
}
