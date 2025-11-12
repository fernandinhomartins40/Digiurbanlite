import { BaseTabController } from '../core/base';
import { ConsultaFrequenciaService } from './consulta-frequencia.service';

export class ConsultaFrequenciaController extends BaseTabController {
  constructor(service: ConsultaFrequenciaService) { super(service); }
}
