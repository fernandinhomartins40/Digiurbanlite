import { BaseTabController } from '../core/base';
import { DenunciaAnonimaService } from './denuncia-anonima.service';

export class DenunciaAnonimaController extends BaseTabController {
  constructor(service: DenunciaAnonimaService) { super(service); }
}
