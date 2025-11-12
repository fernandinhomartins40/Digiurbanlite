import { BaseTabController } from '../core/base';
import { ProgramasSaudeService } from './programas-saude.service';

export class ProgramasSaudeController extends BaseTabController {
  constructor(service: ProgramasSaudeService) { super(service); }
}
