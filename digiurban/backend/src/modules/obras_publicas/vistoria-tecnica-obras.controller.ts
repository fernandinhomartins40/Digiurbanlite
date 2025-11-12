import { BaseTabController } from '../core/base';
import { VistoriaTecnicaObrasService } from './vistoria-tecnica-obras.service';

export class VistoriaTecnicaObrasController extends BaseTabController {
  constructor(service: VistoriaTecnicaObrasService) { super(service); }
}
