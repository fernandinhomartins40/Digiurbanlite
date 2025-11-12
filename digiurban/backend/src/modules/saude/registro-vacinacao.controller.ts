import { BaseTabController } from '../core/base';
import { RegistroVacinacaoService } from './registro-vacinacao.service';

export class RegistroVacinacaoController extends BaseTabController {
  constructor(service: RegistroVacinacaoService) { super(service); }
}
