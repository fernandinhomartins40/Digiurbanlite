/**
 * ============================================================================
 * EDUCAÇÃO - Handlers Core (FASE 2)
 * ============================================================================
 *
 * Total de serviços: 10 módulos COM_DADOS
 * Sistema: Registry automático
 */

import { registerHandler } from '../../../modules/handlers/registry';
import { StudentEnrollmentHandler } from './enrollment-handler';
import { SchoolTransportHandler } from './transport-handler';
import { SchoolMealHandler } from './meal-handler';
import { SchoolMaterialHandler } from './material-handler';
import { StudentTransferHandler } from './transfer-handler';
import { EducationAttendanceHandler } from './attendance-handler';
import { DisciplinaryRecordHandler } from './disciplinary-handler';
import { SchoolDocumentHandler } from './document-handler';
import { AttendanceRecordHandler } from './attendance-record-handler';
import { GradeRecordHandler } from './grade-handler';
import { SchoolManagementHandler } from './school-management-handler';

/**
 * Registra todos os handlers de educação
 */
export function registerEducationHandlers() {
  console.log('📦 Registering Education handlers...');

  // 1. ATENDIMENTOS_EDUCACAO
  registerHandler(
    'ATENDIMENTOS_EDUCACAO',
    new EducationAttendanceHandler()
  );

  // 2. MATRICULA_ALUNO
  registerHandler(
    'MATRICULA_ALUNO',
    new StudentEnrollmentHandler()
  );

  // 3. TRANSPORTE_ESCOLAR
  registerHandler(
    'TRANSPORTE_ESCOLAR',
    new SchoolTransportHandler()
  );

  // 4. REGISTRO_OCORRENCIA_ESCOLAR
  registerHandler(
    'REGISTRO_OCORRENCIA_ESCOLAR',
    new DisciplinaryRecordHandler()
  );

  // 5. SOLICITACAO_DOCUMENTO_ESCOLAR
  registerHandler(
    'SOLICITACAO_DOCUMENTO_ESCOLAR',
    new SchoolDocumentHandler()
  );

  // 6. TRANSFERENCIA_ESCOLAR
  registerHandler(
    'TRANSFERENCIA_ESCOLAR',
    new StudentTransferHandler()
  );

  // 7. CONSULTA_FREQUENCIA
  registerHandler(
    'CONSULTA_FREQUENCIA',
    new AttendanceRecordHandler()
  );

  // 8. CONSULTA_NOTAS
  registerHandler(
    'CONSULTA_NOTAS',
    new GradeRecordHandler()
  );

  // 9. GESTAO_ESCOLAR
  registerHandler(
    'GESTAO_ESCOLAR',
    new SchoolManagementHandler()
  );

  // 10. GESTAO_MERENDA
  registerHandler(
    'GESTAO_MERENDA',
    new SchoolMealHandler()
  );

  // Handler de Material Escolar
  registerHandler(
    'MATERIAL_ESCOLAR',
    new SchoolMaterialHandler()
  );

  console.log('✅ Education handlers registered (11 handlers)');
}

// Exportar handlers para uso direto
export { StudentEnrollmentHandler };
export { SchoolTransportHandler };
export { SchoolMealHandler };
export { SchoolMaterialHandler };
export { StudentTransferHandler };
