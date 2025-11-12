import { BaseTabController } from '../core/base';
import { LicencaAmbientalService } from './licenca-ambiental.service';

export class LicencaAmbientalController extends BaseTabController {
  constructor(service: LicencaAmbientalService) { super(service); }
}
