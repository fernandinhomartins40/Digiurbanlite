/**
 * Formulário do serviço num formato só: JSON Schema (`properties` + `required`),
 * que é o que o validador, o assistente e os dados indexados (Registry) leem.
 *
 * A tela de criar serviço mandava a lista `fields` e um "required" dentro de
 * cada campo (fora do padrão): o validador ignorava e os dados não eram
 * indexados. A lista `fields` é mantida para a tela de edição.
 */
export function normalizeFormSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  const fields: any[] = Array.isArray(schema.fields) ? schema.fields : [];
  const properties: Record<string, any> = { ...(schema.properties || {}) };

  for (const field of fields) {
    if (!field?.id) continue;
    const current = properties[field.id] || {};
    properties[field.id] = {
      ...current,
      type: current.type || (field.type === 'number' ? 'number' : field.type === 'checkbox' ? 'boolean' : 'string'),
      title: current.title || field.label || field.id,
      ...(Array.isArray(field.options) && field.options.length && !current.enum ? { enum: field.options } : {}),
    };
  }

  const required = new Set<string>(Array.isArray(schema.required) ? schema.required : []);
  for (const field of fields) if (field?.id && field.required) required.add(field.id);
  for (const [id, prop] of Object.entries(properties)) {
    if (prop && typeof prop === 'object' && prop.required === true) required.add(id);
    if (prop && typeof prop === 'object' && 'required' in prop) {
      const { required: _ignored, ...rest } = prop;
      properties[id] = rest;
    }
  }

  return {
    ...schema,
    type: 'object',
    properties,
    required: [...required].filter((id) => properties[id]),
  };
}
