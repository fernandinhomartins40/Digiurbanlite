/**
 * Script de teste para validar correção do erro "Dados do formulário inválidos"
 */

const { validateServiceFormData } = require('./digiurban/backend/dist/lib/json-schema-validator');

// Simular serviço "Alerta de Segurança" com schema problemático
const service = {
  name: "Alerta de Segurança",
  formSchema: {
    type: "object",
    required: [
      // ❌ ANTES: Estes campos causavam erro (campos citizen legacy)
      "nome", "cpf", "dataNascimento", "email", "telefone",
      "cep", "logradouro", "numero", "bairro", "nomeMae",
      // ✅ Campos do serviço (devem ser validados)
      "tipoAlerta", "localAlerta", "descricaoAlerta", "urgencia"
    ],
    properties: {
      // Campos citizen (NÃO devem ser validados no customFormData)
      nome: { type: "string", title: "Nome Completo" },
      cpf: { type: "string", title: "CPF" },
      dataNascimento: { type: "string", title: "Data de Nascimento" },
      email: { type: "string", title: "E-mail" },
      telefone: { type: "string", title: "Telefone" },
      cep: { type: "string", title: "CEP" },
      logradouro: { type: "string", title: "Logradouro" },
      numero: { type: "string", title: "Número" },
      bairro: { type: "string", title: "Bairro" },
      nomeMae: { type: "string", title: "Nome da Mãe" },

      // Campos do serviço (DEVEM ser validados)
      tipoAlerta: {
        type: "string",
        title: "Tipo de Alerta",
        enum: ["Suspeito Circulando", "Veículo Suspeito", "Situação de Risco"]
      },
      localAlerta: { type: "string", title: "Local do Alerta", maxLength: 300 },
      descricaoAlerta: { type: "string", title: "Descrição", minLength: 20, maxLength: 1000 },
      urgencia: {
        type: "string",
        title: "Urgência",
        enum: ["Baixa", "Média", "Alta", "Emergencial"]
      }
    }
  }
};

// Simular customFormData enviado pelo frontend
// ✅ APÓS CORREÇÃO: Apenas campos do serviço, SEM campos citizen
const customFormData = {
  tipoAlerta: "Situação de Risco",
  localAlerta: "Rua ABC, próximo ao mercado",
  descricaoAlerta: "Observei movimentação suspeita de indivíduos na área",
  urgencia: "Alta"
};

console.log('🧪 TESTE DE VALIDAÇÃO\n');
console.log('📋 Serviço:', service.name);
console.log('📊 Campos no schema:', Object.keys(service.formSchema.properties).length);
console.log('📊 Campos obrigatórios:', service.formSchema.required.length);
console.log('📤 customFormData enviado:', Object.keys(customFormData));
console.log('');

// Executar validação
const result = validateServiceFormData(service, customFormData);

console.log('📊 RESULTADO DA VALIDAÇÃO\n');
console.log('✅ Válido:', result.valid);
console.log('');

if (result.valid) {
  console.log('🎉 SUCESSO! A validação passou corretamente.');
  console.log('   - Campos citizen foram filtrados da validação');
  console.log('   - Apenas campos do serviço foram validados');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ FALHA! A validação falhou com os seguintes erros:');
  result.errors.forEach((error, i) => {
    console.log(`   ${i + 1}. ${error}`);
  });
  console.log('');
  process.exit(1);
}
