import { BaseTabController } from '../core/base';
import { IluminacaoPublicaService } from './iluminacao-publica.service';

export class IluminacaoPublicaController extends BaseTabController {
  constructor(service: IluminacaoPublicaService) { super(service); }
}
