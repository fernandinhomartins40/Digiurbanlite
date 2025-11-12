import { BaseTabController } from '../core/base';
import { GuiaTuristicoDigitalService } from './guia-turistico-digital.service';

export class GuiaTuristicoDigitalController extends BaseTabController {
  constructor(service: GuiaTuristicoDigitalService) { super(service); }
}
