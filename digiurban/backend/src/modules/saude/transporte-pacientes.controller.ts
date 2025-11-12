import { BaseTabController } from '../core/base';
import { TransportePacientesService } from './transporte-pacientes.service';

export class TransportePacientesController extends BaseTabController {
  constructor(service: TransportePacientesService) { super(service); }
}
