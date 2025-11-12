import { BaseTabController } from '../core/base';
import { RegistroOcorrenciaService } from './registro-ocorrencia.service';

export class RegistroOcorrenciaController extends BaseTabController {
  constructor(service: RegistroOcorrenciaService) { super(service); }
}
