import { BaseTabController } from '../core/base';
import { GestaoVigilanciaService } from './gestao-vigilancia.service';

export class GestaoVigilanciaController extends BaseTabController {
  constructor(service: GestaoVigilanciaService) { super(service); }
}
