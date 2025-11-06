/**
 * Script para substituir /api/specialized/ por /api/secretarias/ em todos arquivos
 */

const fs = require('fs');
const path = require('path');

const files = [
  'app/admin/secretarias/assistencia-social/beneficios-servicos/page.tsx',
  'app/admin/secretarias/saude/consultas-servicos/page.tsx',
  'app/admin/secretarias/educacao/transporte-servicos/page.tsx',
  'app/admin/secretarias/educacao/matriculas-servicos/page.tsx',
  'hooks/api/urban-planning/useZoning.ts',
  'hooks/api/urban-planning/useUrbanReports.ts',
  'hooks/api/urban-planning/useUrbanProjects.ts',
  'hooks/api/urban-planning/useUrbanPlanning.ts',
  'hooks/api/urban-planning/useUrbanMonitoring.ts',
  'hooks/api/urban-planning/useUrbanInfrastructure.ts',
  'hooks/api/urban-planning/useTrafficPlanning.ts',
  'hooks/api/urban-planning/useLandUse.ts',
  'hooks/api/urban-planning/useConstructionLicenses.ts',
  'hooks/api/sports/useSportsTeams.ts',
  'hooks/api/sports/useSportsSchools.ts',
  'hooks/api/sports/useSportsReports.ts',
  'hooks/api/sports/useSportsPrograms.ts',
  'hooks/api/sports/useSportsInstructors.ts',
  'hooks/api/sports/useSportsInfrastructure.ts',
  'hooks/api/sports/useSportsEvents.ts',
  'hooks/api/sports/useSportsAttendances.ts',
  'hooks/api/sports/useCompetitions.ts',
  'hooks/api/sports/useAthletes.ts',
  'hooks/api/social/useVulnerableFamilies.ts',
  'hooks/api/social/useSocialPrograms.ts',
  'hooks/api/social/useSocialAttendanceStats.ts',
  'hooks/api/social/useSocialAttendances.ts',
  'hooks/api/social/useServiceUnits.ts',
  'hooks/api/social/useProgramEnrollments.ts',
  'hooks/api/social/useFamilyVisits.ts',
  'hooks/api/social/useFamilyBenefits.ts',
  'hooks/api/social/useEmergencyDeliveries.ts',
  'hooks/api/social/useCrasCreasManagement.ts',
  'hooks/api/security/useSecurityStatistics.ts',
  'hooks/api/security/useSecurityPatrols.ts',
  'hooks/api/security/useSecurityOccurrences.ts',
  'hooks/api/security/useSecurityAttendances.ts',
  'hooks/api/security/useSecurityAlerts.ts',
  'hooks/api/security/useIntegratedSurveillance.ts',
  'hooks/api/security/useGuardSupport.ts',
  'hooks/api/security/useCriticalPoints.ts',
  'hooks/api/public-services/useTeamSchedule.ts',
  'hooks/api/public-services/useStreetLighting.ts',
  'hooks/api/public-services/useSpecialCollection.ts',
  'hooks/api/public-services/useServiceRequests.ts',
  'hooks/api/public-services/usePublicServicesAttendances.ts',
  'hooks/api/public-services/useProblemReports.ts',
  'hooks/api/public-services/useCleaningSchedule.ts',
  'hooks/api/housing/useHousingUnits.ts',
  'hooks/api/housing/useHousingReports.ts',
  'hooks/api/housing/useHousingPrograms.ts',
  'hooks/api/housing/useHousingMaintenance.ts',
  'hooks/api/housing/useHousingBeneficiaries.ts',
  'hooks/api/housing/useHousingApplications.ts',
  'hooks/api/education/useStudents.ts',
  'hooks/api/education/useSchoolTransport.ts',
  'hooks/api/education/useSchools.ts',
  'hooks/api/education/useSchoolMeals.ts',
  'hooks/api/education/useSchoolIncidents.ts',
  'hooks/api/education/useSchoolEvents.ts',
  'hooks/api/education/useEnrollments.ts',
  'hooks/api/education/useAttendance.ts',
  'app/admin/secretarias/turismo/roteiros/page.tsx',
  'app/admin/secretarias/turismo/eventos/page.tsx',
  'app/admin/secretarias/servicos-publicos/solicitacoes/page.tsx',
  'app/admin/secretarias/seguranca-publica/patrulhas/page.tsx',
  'app/admin/secretarias/saude/vacinacoes/page.tsx',
  'app/admin/secretarias/saude/profissionais/page.tsx',
  'app/admin/secretarias/saude/consultas/page.tsx',
  'app/admin/secretarias/planejamento-urbano/zoneamento/page.tsx',
  'app/admin/secretarias/obras-publicas/fiscalizacoes/page.tsx',
  'app/admin/secretarias/meio-ambiente/fiscalizacoes/page.tsx',
  'app/admin/secretarias/assistencia-social/visitas-domiciliares/page.tsx',
  'app/admin/secretarias/assistencia-social/beneficios/page.tsx',
  'app/admin/secretarias/agricultura/propriedades/page.tsx',
  'app/admin/secretarias/agricultura/produtores/page.tsx',
  'hooks/useSecretaria.ts',
  'lib/services/tourism.service.ts',
  'lib/services/public-services.service.ts',
  'lib/services/security.service.ts',
  'lib/services/health.service.ts',
  'lib/services/urban-planning.service.ts',
  'lib/services/public-works.service.ts',
  'lib/services/environment.service.ts',
  'lib/services/housing.service.ts',
  'lib/services/sports.service.ts',
  'lib/services/education.service.ts',
  'lib/services/culture.service.ts',
  'lib/services/social-assistance.service.ts',
  'lib/services/agriculture.service.ts'
];

let totalReplacements = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(/\/api\/specialized\//g, '/api/secretarias/');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      const count = (content.match(/\/api\/specialized\//g) || []).length;
      totalReplacements += count;
      filesModified++;
      console.log(`✅ ${file} - ${count} substituições`);
    } else {
      console.log(`⏭️  ${file} - nenhuma substituição necessária`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${file}:`, error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Processamento concluído!`);
console.log(`📝 ${filesModified} arquivos modificados`);
console.log(`🔄 ${totalReplacements} substituições realizadas`);
console.log('='.repeat(60));
