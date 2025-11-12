import { BaseTabController } from '../core/base';
import { LimpezaUrbanaService } from './limpeza-urbana.service';

export class LimpezaUrbanaController extends BaseTabController {
  constructor(service: LimpezaUrbanaService) { super(service); }
}
