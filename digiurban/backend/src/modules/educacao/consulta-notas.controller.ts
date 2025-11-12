import { BaseTabController } from '../core/base';
import { ConsultaNotasService } from './consulta-notas.service';

export class ConsultaNotasController extends BaseTabController {
  constructor(service: ConsultaNotasService) { super(service); }
}
