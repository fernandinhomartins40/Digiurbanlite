/**
 * Todo e-mail do sistema tem o seu modelo, e o modelo sai completo:
 * sem "{{campo}}" sobrando e com o texto da pessoa escapado.
 */

import {
  buildDefaultTemplates,
  EMAIL_TEMPLATE_INFO,
  NOTIFICATION_TEMPLATE_BY_TYPE,
} from '../../src/lib/email/default-templates';
import { fillTemplate } from '../../src/services/mail/template-fill';

const templates = buildDefaultTemplates();
const byName = new Map(templates.map((template) => [template.name, template]));

describe('modelos de e-mail', () => {
  it('cada modelo descrito existe e cada modelo tem descrição', () => {
    for (const name of Object.keys(EMAIL_TEMPLATE_INFO)) {
      expect(byName.has(name)).toBe(true);
    }
    for (const template of templates) {
      expect(EMAIL_TEMPLATE_INFO[template.name]).toBeDefined();
    }
  });

  it('cada tipo de aviso aponta para um modelo que existe', () => {
    for (const name of Object.values(NOTIFICATION_TEMPLATE_BY_TYPE)) {
      expect(byName.has(name)).toBe(true);
    }
    expect(byName.has('notification')).toBe(true);
  });

  it('com as variáveis declaradas, não sobra nenhum {{campo}}', () => {
    for (const template of templates) {
      const variables = Object.fromEntries(template.variables.map((name) => [name, `valor-${name}`]));
      variables.portalUrl = 'https://exemplo.digiurban.com.br';
      variables.actionUrl = variables.actionUrl || 'https://exemplo.digiurban.com.br/x';
      variables.trackingUrl = variables.trackingUrl || 'https://exemplo.digiurban.com.br/y';
      for (const [part, html] of [
        [template.subject, false],
        [template.htmlContent, true],
        [template.textContent, false],
      ] as const) {
        const filled = fillTemplate(part, variables, html);
        expect({ template: template.name, leftover: filled.match(/{{\s*[\w.]+\s*}}/g) }).toEqual({
          template: template.name,
          leftover: null,
        });
      }
    }
  });

  it('texto digitado pela pessoa entra escapado no HTML', () => {
    const html = fillTemplate('<p>{{message}}</p>', { message: '<script>x</script>\nlinha 2' }, true);
    expect(html).toBe('<p>&lt;script&gt;x&lt;/script&gt;<br>linha 2</p>');
    expect(fillTemplate('{{message}}', { message: '<b>' }, false)).toBe('<b>');
  });
});
