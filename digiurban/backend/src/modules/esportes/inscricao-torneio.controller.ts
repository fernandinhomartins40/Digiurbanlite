import { BaseTabController } from '../core/base';
import { InscricaoTorneioService } from './inscricao-torneio.service';

export class InscricaoTorneioController extends BaseTabController {
  constructor(service: InscricaoTorneioService) { super(service); }
}
