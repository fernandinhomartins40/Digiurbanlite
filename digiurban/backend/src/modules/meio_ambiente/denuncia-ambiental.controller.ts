import { BaseTabController } from '../core/base';
import { DenunciaAmbientalService } from './denuncia-ambiental.service';

export class DenunciaAmbientalController extends BaseTabController {
  constructor(service: DenunciaAmbientalService) { super(service); }
}
