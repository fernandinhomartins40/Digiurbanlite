import { BaseTabController } from '../core/base';
import { GestaoAcsService } from './gestao-acs.service';

export class GestaoAcsController extends BaseTabController {
  constructor(service: GestaoAcsService) { super(service); }
}
