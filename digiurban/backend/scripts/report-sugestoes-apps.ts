/**
 * Relatório: para cada secretaria, quantas sugestões de serviço vão para app e quais.
 *   npx tsx scripts/report-sugestoes-apps.ts resumo | com | sem
 */
import { SUGGESTIONS_POOL } from '../src/catalog/suggestions';
import { suggestAppActions, checkAppFields } from '../src/services/apps/app-intelligence.service';
import { appsForDepartment } from '../src/config/app-catalog';
const mode = process.argv[2] || 'resumo';
const rows: string[] = [];
for (const [slug, list] of Object.entries(SUGGESTIONS_POOL)) {
  const dept = (list[0]?.departmentCode || slug).toUpperCase().replace(/-/g, '_');
  const apps = appsForDepartment(dept).filter((a) => a.actions.length);
  let comApp = 0, incompleto = 0;
  for (const s of list) {
    const top = suggestAppActions({ name: s.name, description: s.description, departmentCode: dept })[0];
    const schema = { properties: Object.fromEntries((s.suggestedFields || []).map((f: any) => [f.name, { title: f.label, type: f.type === 'number' ? 'number' : f.type === 'checkbox' ? 'boolean' : 'string', ...(f.type === 'date' ? { format: 'date' } : {}) }])) };
    if (top?.confident) {
      comApp++;
      const c = checkAppFields(top.appAction, schema)!;
      if (c.missingRequired.length) incompleto++;
      if (mode === 'com') rows.push(`${dept} | ${s.name} → ${top.appAction}${c.missingRequired.length ? ' (falta: ' + c.missingRequired.join(', ') + ')' : ''}`);
    } else if (mode === 'sem' && apps.length) rows.push(`${dept} | ${s.name}${top ? ' (fraca: ' + top.appAction + ')' : ''}`);
  }
  if (mode === 'resumo') rows.push(`${dept.padEnd(26)} sugestões=${String(list.length).padStart(3)} apps=${apps.map((a) => a.code).join(',') || '-'} | vão p/ app=${comApp} (campos faltando=${incompleto})`);
}
console.log(rows.join('\n'));
