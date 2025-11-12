import { BaseTabController } from '../core/base';
import { VisitasDomiciliaresService } from './visitas-domiciliares.service';

export class VisitasDomiciliaresController extends BaseTabController {
  constructor(service: VisitasDomiciliaresService) { super(service); }
}
