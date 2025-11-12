import { BaseTabController } from '../core/base';
import { MapaCriminalidadeService } from './mapa-criminalidade.service';

export class MapaCriminalidadeController extends BaseTabController {
  constructor(service: MapaCriminalidadeService) { super(service); }
}
