import { BaseTabController } from '../core/base';
import { InscricaoCursoRuralService } from './inscricao-curso-rural.service';

export class InscricaoCursoRuralController extends BaseTabController {
  constructor(service: InscricaoCursoRuralService) { super(service); }
}
