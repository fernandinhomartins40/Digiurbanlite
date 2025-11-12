import { BaseTabController } from '../core/base';
import { ProgramaAmbientalService } from './programa-ambiental.service';

export class ProgramaAmbientalController extends BaseTabController {
  constructor(service: ProgramaAmbientalService) { super(service); }
}
