import { BaseTabController } from '../core/base';
import { CadastroGrupoArtisticoService } from './cadastro-grupo-artistico.service';

export class CadastroGrupoArtisticoController extends BaseTabController {
  constructor(service: CadastroGrupoArtisticoService) { super(service); }
}
