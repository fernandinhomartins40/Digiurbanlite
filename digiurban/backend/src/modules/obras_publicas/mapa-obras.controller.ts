import { BaseTabController } from '../core/base';
import { MapaObrasService } from './mapa-obras.service';

export class MapaObrasController extends BaseTabController {
  constructor(service: MapaObrasService) { super(service); }
}
