import { BaseTabController } from '../core/base';
import { VistoriaAmbientalService } from './vistoria-ambiental.service';

export class VistoriaAmbientalController extends BaseTabController {
  constructor(service: VistoriaAmbientalService) { super(service); }
}
