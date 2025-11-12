import { BaseTabController } from '../core/base';
import { MatriculaAlunoService } from './matricula-aluno.service';

export class MatriculaAlunoController extends BaseTabController {
  constructor(service: MatriculaAlunoService) { super(service); }
}
