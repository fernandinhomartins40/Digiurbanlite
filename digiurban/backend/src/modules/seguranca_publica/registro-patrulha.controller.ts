import { BaseTabController } from '../core/base';
import { RegistroPatrulhaService } from './registro-patrulha.service';

export class RegistroPatrulhaController extends BaseTabController {
  constructor(service: RegistroPatrulhaService) { super(service); }
}
