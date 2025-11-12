import { BaseTabController } from '../core/base';
import { GestaoEscolarService } from './gestao-escolar.service';

export class GestaoEscolarController extends BaseTabController {
  constructor(service: GestaoEscolarService) { super(service); }
}
