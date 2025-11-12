import { BaseTabController } from '../core/base';
import { InscricaoGrupoOficinaService } from './inscricao-grupo-oficina.service';

export class InscricaoGrupoOficinaController extends BaseTabController {
  constructor(service: InscricaoGrupoOficinaService) { super(service); }
}
