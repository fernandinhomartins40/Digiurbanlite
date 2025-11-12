-- Remover propriedade mask de todos os campos
UPDATE services_simplified
SET formSchema = json_remove(
  formSchema,
  '$.properties.cpf.mask',
  '$.properties.rg.mask',
  '$.properties.telefone.mask',
  '$.properties.telefoneSecundario.mask',
  '$.properties.cep.mask',
  '$.properties.dataNascimento.mask'
)
WHERE formSchema IS NOT NULL
  AND json_extract(formSchema, '$.properties') IS NOT NULL;
