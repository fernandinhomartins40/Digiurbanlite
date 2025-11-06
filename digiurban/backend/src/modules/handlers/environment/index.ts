// ============================================================
// ENVIRONMENT HANDLERS - Index
// ============================================================

import { moduleHandlerRegistry } from '../../../core/module-handler';
import { EnvironmentalLicenseHandler } from './environmental-license-handler';
import { TreeAuthorizationHandler } from './tree-authorization-handler';
import { EnvironmentalComplaintHandler } from './environmental-complaint-handler';
import { OrganicCertificationHandler } from './organic-certification-handler';

export function registerEnvironmentHandlers() {
  // Licenças Ambientais
  moduleHandlerRegistry.register(
    'environment:EnvironmentalLicense',
    new EnvironmentalLicenseHandler()
  );

  // Autorização de Poda/Supressão
  moduleHandlerRegistry.register(
    'environment:TreeAuthorization',
    new TreeAuthorizationHandler()
  );

  // Denúncias Ambientais
  moduleHandlerRegistry.register(
    'environment:EnvironmentalComplaint',
    new EnvironmentalComplaintHandler()
  );

  // Certificação Orgânica
  moduleHandlerRegistry.register(
    'environment:OrganicCertification',
    new OrganicCertificationHandler()
  );

  console.log('✅ Environment handlers registered');
}

export {
  EnvironmentalLicenseHandler,
  TreeAuthorizationHandler,
  EnvironmentalComplaintHandler,
  OrganicCertificationHandler
};
