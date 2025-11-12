import { BaseTabController } from '../core/base';
import { RegistroOcorrenciaEscolarService } from './registro-ocorrencia-escolar.service';

export class RegistroOcorrenciaEscolarController extends BaseTabController {
  constructor(service: RegistroOcorrenciaEscolarService) { super(service); }
}
