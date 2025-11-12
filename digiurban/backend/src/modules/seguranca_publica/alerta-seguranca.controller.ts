import { BaseTabController } from '../core/base';
import { AlertaSegurancaService } from './alerta-seguranca.service';

export class AlertaSegurancaController extends BaseTabController {
  constructor(service: AlertaSegurancaService) { super(service); }
}
