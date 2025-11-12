import { BaseTabController } from '../core/base';
import { RegistroManifestacaoCulturalService } from './registro-manifestacao-cultural.service';

export class RegistroManifestacaoCulturalController extends BaseTabController {
  constructor(service: RegistroManifestacaoCulturalService) { super(service); }
}
