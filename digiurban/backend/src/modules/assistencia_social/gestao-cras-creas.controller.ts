import { BaseTabController } from '../core/base';
import { GestaoCrasCreasService } from './gestao-cras-creas.service';

export class GestaoCrasCreasController extends BaseTabController {
  constructor(service: GestaoCrasCreasService) { super(service); }
}
