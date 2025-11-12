const fs = require('fs');

const filesToFix = [
  'components/admin/NewProtocolModal.tsx',
  'components/alerts/AlertCard.tsx',
  'components/alerts/AlertDashboard.tsx',
  'components/alerts/AlertList.tsx',
  'components/analytics/dashboards/CitizenDashboard.tsx',
  'components/analytics/dashboards/CoordinatorDashboard.tsx',
  'components/analytics/dashboards/EmployeeDashboard.tsx',
  'components/analytics/dashboards/ExecutiveDashboard.tsx',
  'components/analytics/dashboards/ManagerDashboard.tsx',
  'components/analytics/dashboards/SuperAdminDashboard.tsx',
  'components/reports/ReportBuilder.tsx',
  'components/reports/ReportList.tsx',
  'components/reports/ReportPreview.tsx'
];

filesToFix.forEach(filepath => {
  try {
    let content = fs.readFileSync(filepath, 'utf-8');
    let modified = false;

    // Comentar imports que começam com @/hooks/api
    const importRegex = /^(\s*)(import .* from ['"]@\/hooks\/api[^'"]*['"];?)$/gm;

    content = content.replace(importRegex, (match, indent, importStatement) => {
      modified = true;
      return `${indent}// LEGADO: ${importStatement}`;
    });

    if (modified) {
      fs.writeFileSync(filepath, content, 'utf-8');
      console.log(`✅ ${filepath}`);
    } else {
      console.log(`⏭️  ${filepath} (sem mudanças)`);
    }

  } catch (error) {
    console.log(`❌ ${filepath}: ${error.message}`);
  }
});

console.log('\n✅ Processamento concluído!');
