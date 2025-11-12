import { BaseTabController } from '../core/base';
import { InspecaoObraService } from './inspecao-obra.service';

export class InspecaoObraController extends BaseTabController {
  constructor(service: InspecaoObraService) { super(service); }
}
