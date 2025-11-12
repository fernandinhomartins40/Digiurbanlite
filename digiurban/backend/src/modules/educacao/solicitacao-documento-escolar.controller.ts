import { BaseTabController } from '../core/base';
import { SolicitacaoDocumentoEscolarService } from './solicitacao-documento-escolar.service';

export class SolicitacaoDocumentoEscolarController extends BaseTabController {
  constructor(service: SolicitacaoDocumentoEscolarService) { super(service); }
}
