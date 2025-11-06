// ============================================================
// URBAN PLANNING HANDLERS - Index
// ============================================================

import { moduleHandlerRegistry } from '../../../core/module-handler';
import { BuildingPermitHandler } from './building-permit-handler';
import { UrbanCertificateHandler } from './certificate-handler';
import { PropertyNumberingHandler } from './property-numbering-handler';
import { LotSubdivisionHandler } from './lot-subdivision-handler';

export function registerUrbanPlanningHandlers() {
  // Alvarás de Construção
  moduleHandlerRegistry.register(
    'urban_planning:BuildingPermit',
    new BuildingPermitHandler()
  );

  // Certidões Diversas
  moduleHandlerRegistry.register(
    'urban_planning:UrbanCertificate',
    new UrbanCertificateHandler()
  );

  // Numeração de Imóveis
  moduleHandlerRegistry.register(
    'urban_planning:PropertyNumbering',
    new PropertyNumberingHandler()
  );

  // Desmembramento de Lotes
  moduleHandlerRegistry.register(
    'urban_planning:LotSubdivision',
    new LotSubdivisionHandler()
  );

  console.log('✅ Urban Planning handlers registered');
}

export {
  BuildingPermitHandler,
  UrbanCertificateHandler,
  PropertyNumberingHandler,
  LotSubdivisionHandler
};
