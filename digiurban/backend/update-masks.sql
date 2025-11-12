-- Atualizar formSchema para adicionar propriedade mask em campos específicos
UPDATE services_simplified
SET formSchema = json_set(
  formSchema,
  '$.properties.cpf.mask', 'cpf',
  '$.properties.rg.mask', 'rg',
  '$.properties.telefone.mask', 'phone',
  '$.properties.telefoneSecundario.mask', 'phone',
  '$.properties.cep.mask', 'cep',
  '$.properties.dataNascimento.mask', 'date'
)
WHERE formSchema IS NOT NULL
  AND json_extract(formSchema, '$.properties') IS NOT NULL;
