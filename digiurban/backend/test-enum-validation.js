const { validateServiceFormData } = require('./dist/lib/json-schema-validator');

// Schema exato do serviço "Alerta de Segurança"
const service = {
  name: "Alerta de Segurança",
  formSchema: {
    type: "object",
    required: [
      "nome", "cpf", "dataNascimento", "email", "telefone",
      "cep", "logradouro", "numero", "bairro", "nomeMae",
      "tipoAlerta", "localAlerta", "descricaoAlerta", "urgencia"
    ],
    properties: {
      nome: { type: "string" },
      cpf: { type: "string" },
      urgencia: {
        type: "string",
        enum: ["Baixa", "Média", "Alta", "Emergencial"]
      },
      tipoAlerta: {
        type: "string",
        enum: ["Suspeito Circulando", "Veículo Suspeito", "Situação de Risco"]
      },
      localAlerta: { type: "string", maxLength: 300 },
      descricaoAlerta: { type: "string", minLength: 20, maxLength: 1000 }
    }
  }
};

console.log('\n🧪 TESTE 1: Dados completos e corretos\n');
const test1 = validateServiceFormData(service, {
  tipoAlerta: "Situação de Risco",
  localAlerta: "Rua ABC",
  descricaoAlerta: "Movimentação suspeita de indivíduos na área comercial",
  urgencia: "Alta"
});
console.log('Resultado:', test1.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
if (!test1.valid) console.log('Erros:', test1.errors);

console.log('\n🧪 TESTE 2: Sem campo urgencia\n');
const test2 = validateServiceFormData(service, {
  tipoAlerta: "Situação de Risco",
  localAlerta: "Rua ABC",
  descricaoAlerta: "Movimentação suspeita de indivíduos na área comercial"
  // ❌ Faltando urgencia
});
console.log('Resultado:', test2.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
if (!test2.valid) console.log('Erros:', test2.errors);

console.log('\n🧪 TESTE 3: Enum com valor errado\n');
const test3 = validateServiceFormData(service, {
  tipoAlerta: "Situação de Risco",
  localAlerta: "Rua ABC",
  descricaoAlerta: "Movimentação suspeita de indivíduos na área comercial",
  urgencia: "Media"  // ❌ Sem acento
});
console.log('Resultado:', test3.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
if (!test3.valid) console.log('Erros:', test3.errors);
