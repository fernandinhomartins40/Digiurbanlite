# Exemplos Práticos de Uso: APIs DigiUrban

## Exemplos com cURL

### 1. Cadastro de Cidadão

```bash
curl -X POST http://localhost:3000/api/auth/citizen/register \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "name": "João da Silva",
    "email": "joao.silva@example.com",
    "phone": "11999999999",
    "password": "SenhaForte@123",
    "address": {
      "cep": "12345-678",
      "logradouro": "Rua das Flores",
      "numero": "123",
      "complemento": "Apto 456",
      "bairro": "Centro",
      "cidade": "Palmital",
      "uf": "SP",
      "pontoReferencia": "Próximo à prefeitura"
    }
  }'

# Resposta esperada (201 Created)
{
  "success": true,
  "message": "Cadastro realizado com sucesso!",
  "data": {
    "citizen": {
      "id": "clyxxxxxxx",
      "cpf": "12345678900",
      "name": "João da Silva",
      "email": "joao.silva@example.com",
      "verificationStatus": "PENDING"
    }
  }
}
```

### 2. Login de Cidadão

```bash
curl -X POST http://localhost:3000/api/auth/citizen/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "login": "joao.silva@example.com",
    "password": "SenhaForte@123"
  }'

# Resposta esperada (200 OK)
{
  "success": true,
  "message": "Login realizado com sucesso",
  "citizen": {
    "id": "clyxxxxxxx",
    "name": "João da Silva",
    "cpf": "12345678900",
    "email": "joao.silva@example.com"
  }
}

# Token armazenado em cookie: digiurban_citizen_token
```

### 3. Obter Dados do Cidadão Logado

```bash
curl -X GET http://localhost:3000/api/auth/citizen/me \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Resposta esperada (200 OK)
{
  "citizen": {
    "id": "clyxxxxxxx",
    "name": "João da Silva",
    "cpf": "12345678900",
    "email": "joao.silva@example.com",
    "phone": "11999999999",
    "verificationStatus": "PENDING",
    "protocolsSimplified": [],
    "familyAsHead": [],
    "notifications": []
  },
  "tenantId": "tenant_id",
  "tenant": {
    "id": "singleton",
    "name": "Prefeitura Municipal de Palmital",
    "nomeMunicipio": "Palmital",
    "ufMunicipio": "SP"
  }
}
```

### 4. Listar Serviços Disponíveis

```bash
# Sem autenticação necessária
curl -X GET "http://localhost:3000/api/services?search=saúde" \
  -H "Content-Type: application/json"

# Resposta esperada (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "service_001",
      "name": "Agendamento de Consulta - Saúde",
      "description": "Agendar consulta médica na unidade básica",
      "serviceType": "COM_DADOS",
      "moduleType": "ATENDIMENTOS_SAUDE",
      "isActive": true,
      "estimatedDays": 7,
      "priority": 1,
      "department": {
        "id": "dept_001",
        "name": "Secretaria de Saúde"
      }
    }
  ]
}
```

### 5. Criar Protocolo (Cidadão)

```bash
# Com upload de arquivo
curl -X POST http://localhost:3000/api/citizen/protocols \
  -b cookies.txt \
  -F "serviceId=service_001" \
  -F "moduleType=ATENDIMENTOS_SAUDE" \
  -F "formData={\"especialidade\":\"Clínica Geral\",\"queixa\":\"Dor de cabeça\"}" \
  -F "documents=@comprovante_endereco.pdf" \
  -F "documents=@identidade.jpg"

# Resposta esperada (201 Created)
{
  "success": true,
  "protocol": {
    "id": "proto_001",
    "number": "2024-00001",
    "title": "Agendamento de Consulta - Saúde",
    "description": "Agendamento de Consulta - Saúde",
    "status": "VINCULADO",
    "priority": 3,
    "citizenId": "clyxxxxxxx",
    "serviceId": "service_001",
    "moduleType": "ATENDIMENTOS_SAUDE",
    "customData": {
      "especialidade": "Clínica Geral",
      "queixa": "Dor de cabeça"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Protocolo 2024-00001 criado e vinculado ao módulo"
}
```

### 6. Listar Protocolos do Cidadão

```bash
curl -X GET "http://localhost:3000/api/citizen/protocols?page=1&limit=10&status=VINCULADO" \
  -b cookies.txt

# Resposta esperada (200 OK)
{
  "protocols": [
    {
      "id": "proto_001",
      "number": "2024-00001",
      "title": "Agendamento de Consulta - Saúde",
      "status": "VINCULADO",
      "priority": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "service": {
        "id": "service_001",
        "name": "Agendamento de Consulta - Saúde",
        "estimatedDays": 7
      },
      "department": {
        "id": "dept_001",
        "name": "Secretaria de Saúde"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 7. Obter Detalhes do Protocolo

```bash
curl -X GET http://localhost:3000/api/citizen/protocols/proto_001 \
  -b cookies.txt

# Resposta esperada (200 OK)
{
  "protocol": {
    "id": "proto_001",
    "number": "2024-00001",
    "title": "Agendamento de Consulta - Saúde",
    "description": "Agendamento de Consulta - Saúde",
    "status": "VINCULADO",
    "priority": 3,
    "customData": {
      "especialidade": "Clínica Geral",
      "queixa": "Dor de cabeça"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "service": {
      "id": "service_001",
      "name": "Agendamento de Consulta - Saúde",
      "description": "Agendar consulta médica",
      "estimatedDays": 7,
      "category": "SAUDE"
    },
    "department": {
      "id": "dept_001",
      "name": "Secretaria de Saúde"
    },
    "citizen": {
      "id": "clyxxxxxxx",
      "name": "João da Silva",
      "cpf": "12345678900"
    }
  },
  "history": [
    {
      "id": "hist_001",
      "action": "Protocolo criado",
      "comment": "Protocolo criado pelo cidadão para o serviço: Agendamento de Consulta - Saúde",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "userId": null
    }
  ]
}
```

### 8. Listar Interações (Mensagens)

```bash
curl -X GET http://localhost:3000/api/citizen/protocols/proto_001/interactions \
  -b cookies.txt

# Resposta esperada (200 OK)
{
  "interactions": [
    {
      "id": "inter_001",
      "protocolId": "proto_001",
      "type": "MESSAGE",
      "authorType": "CITIZEN",
      "authorId": "clyxxxxxxx",
      "authorName": "João da Silva",
      "message": "Protocolo 2024-00001 criado",
      "isInternal": false,
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 9. Adicionar Mensagem ao Protocolo

```bash
curl -X POST http://localhost:3000/api/citizen/protocols/proto_001/interactions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "message": "Qual é o horário da consulta?",
    "type": "MESSAGE"
  }'

# Resposta esperada (201 Created)
{
  "interaction": {
    "id": "inter_002",
    "protocolId": "proto_001",
    "type": "MESSAGE",
    "authorType": "CITIZEN",
    "authorId": "clyxxxxxxx",
    "authorName": "João da Silva",
    "message": "Qual é o horário da consulta?",
    "isInternal": false,
    "isRead": false,
    "createdAt": "2024-01-15T10:45:00.000Z"
  }
}
```

### 10. Cancelar Protocolo

```bash
curl -X POST http://localhost:3000/api/citizen/protocols/proto_001/cancel \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "reason": "Não preciso mais da consulta"
  }'

# Resposta esperada (200 OK)
{
  "success": true,
  "protocol": {
    "id": "proto_001",
    "number": "2024-00001",
    "status": "CANCELADO",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Protocolo cancelado com sucesso"
}
```

### 11. Buscar Cidadão (Admin)

```bash
curl -X GET "http://localhost:3000/api/admin/citizens/search?q=João" \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -H "Authorization: Bearer <admin_token>"

# Resposta esperada (200 OK)
{
  "success": true,
  "data": [
    {
      "id": "clyxxxxxxx",
      "name": "João da Silva",
      "cpf": "12345678900",
      "email": "joao.silva@example.com",
      "phone": "11999999999",
      "verificationStatus": "PENDING",
      "registrationSource": "SELF"
    }
  ]
}
```

### 12. Verificar Cidadão (Admin)

```bash
curl -X PUT http://localhost:3000/api/admin/citizens/clyxxxxxxx/verify \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{
    "notes": "Documentação validada com sucesso"
  }'

# Resposta esperada (200 OK)
{
  "success": true,
  "message": "Cidadão verificado com sucesso",
  "data": {
    "citizen": {
      "id": "clyxxxxxxx",
      "name": "João da Silva",
      "cpf": "12345678900",
      "email": "joao.silva@example.com",
      "verificationStatus": "VERIFIED",
      "verifiedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### 13. Criar Protocolo (Admin)

```bash
curl -X POST http://localhost:3000/api/protocols-simplified \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{
    "serviceId": "service_001",
    "citizenData": {
      "cpf": "98765432100",
      "name": "Maria Silva",
      "email": "maria.silva@example.com",
      "phone": "11988888888"
    },
    "formData": {
      "especialidade": "Pediatria",
      "queixa": "Vacinação infantil"
    },
    "latitude": -25.5095,
    "longitude": -49.3160,
    "address": "Rua das Flores, 456, Palmital - SP"
  }'

# Resposta esperada (201 Created)
{
  "success": true,
  "data": {
    "protocol": {
      "id": "proto_002",
      "number": "2024-00002",
      "title": "Agendamento de Consulta - Saúde",
      "status": "VINCULADO",
      "moduleType": "ATENDIMENTOS_SAUDE"
    },
    "hasModule": true
  },
  "message": "Protocolo 2024-00002 criado e vinculado ao módulo"
}
```

### 14. Atualizar Status de Protocolo (Admin)

```bash
curl -X PATCH http://localhost:3000/api/protocols-simplified/proto_001/status \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{
    "newStatus": "PROGRESSO",
    "comment": "Processando solicitação",
    "metadata": {
      "processedBy": "admin_user",
      "processedAt": "2024-01-15T12:30:00.000Z"
    }
  }'

# Resposta esperada (200 OK)
{
  "success": true,
  "protocol": {
    "id": "proto_001",
    "number": "2024-00001",
    "status": "PROGRESSO",
    "updatedAt": "2024-01-15T12:30:00.000Z"
  },
  "message": "Status atualizado"
}
```

### 15. Atribuir Protocolo a Servidor (Admin)

```bash
curl -X PATCH http://localhost:3000/api/protocols-simplified/proto_001/assign \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{
    "assignedUserId": "user_server_001"
  }'

# Resposta esperada (200 OK)
{
  "success": true,
  "protocol": {
    "id": "proto_001",
    "number": "2024-00001",
    "assignedUserId": "user_server_001",
    "updatedAt": "2024-01-15T13:00:00.000Z"
  }
}
```

### 16. Adicionar Comentário (Admin)

```bash
curl -X POST http://localhost:3000/api/protocols-simplified/proto_001/comments \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{
    "message": "Aguardando documentação complementar",
    "isInternal": false
  }'

# Resposta esperada (201 Created)
{
  "success": true,
  "interaction": {
    "id": "inter_003",
    "protocolId": "proto_001",
    "type": "MESSAGE",
    "authorType": "SERVER",
    "authorName": "Admin User",
    "message": "Aguardando documentação complementar",
    "isInternal": false,
    "createdAt": "2024-01-15T13:15:00.000Z"
  }
}
```

---

## Exemplos com JavaScript/TypeScript

### Cadastro de Cidadão

```typescript
async function registerCitizen() {
  const response = await fetch('http://localhost:3000/api/auth/citizen/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cpf: '12345678900',
      name: 'João da Silva',
      email: 'joao.silva@example.com',
      phone: '11999999999',
      password: 'SenhaForte@123',
      address: {
        cep: '12345-678',
        logradouro: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'Palmital',
        uf: 'SP'
      }
    })
  });

  const data = await response.json();
  console.log('Cidadão registrado:', data.data.citizen);
  return data;
}
```

### Login de Cidadão

```typescript
async function loginCitizen() {
  const response = await fetch('http://localhost:3000/api/auth/citizen/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // Para incluir cookies
    body: JSON.stringify({
      login: 'joao.silva@example.com', // CPF ou Email
      password: 'SenhaForte@123'
    })
  });

  const data = await response.json();
  console.log('Login bem-sucedido:', data.citizen);
  return data;
}
```

### Criar Protocolo com Upload

```typescript
async function createProtocol() {
  const formData = new FormData();
  formData.append('serviceId', 'service_001');
  formData.append('moduleType', 'ATENDIMENTOS_SAUDE');
  formData.append('formData', JSON.stringify({
    especialidade: 'Clínica Geral',
    queixa: 'Dor de cabeça'
  }));

  // Adicionar arquivos
  const fileInput = document.getElementById('documents') as HTMLInputElement;
  if (fileInput.files) {
    Array.from(fileInput.files).forEach(file => {
      formData.append('documents', file);
    });
  }

  const response = await fetch('http://localhost:3000/api/citizen/protocols', {
    method: 'POST',
    credentials: 'include', // Incluir cookie de autenticação
    body: formData
  });

  const data = await response.json();
  console.log('Protocolo criado:', data.protocol);
  return data;
}
```

### Listar Protocolos com Filtros

```typescript
async function listProtocols(status?: string, page = 1) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '10'
  });

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(
    `http://localhost:3000/api/citizen/protocols?${params}`,
    {
      method: 'GET',
      credentials: 'include'
    }
  );

  const data = await response.json();
  console.log('Protocolos:', data.protocols);
  console.log('Total:', data.pagination.total);
  return data;
}
```

### Buscar Cidadão (Admin)

```typescript
async function searchCitizen(query: string, adminToken: string) {
  const response = await fetch(
    `http://localhost:3000/api/admin/citizens/search?q=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    }
  );

  const data = await response.json();
  console.log('Cidadãos encontrados:', data.data);
  return data;
}
```

### Atualizar Status de Protocolo (Admin)

```typescript
async function updateProtocolStatus(
  protocolId: string,
  newStatus: string,
  comment: string,
  adminToken: string
) {
  const response = await fetch(
    `http://localhost:3000/api/protocols-simplified/${protocolId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        newStatus,
        comment
      })
    }
  );

  const data = await response.json();
  console.log('Status atualizado:', data.protocol);
  return data;
}
```

---

## Tratamento de Erros

### Exemplo de Tratamento Completo

```typescript
async function safeApiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });

    // Verificar status HTTP
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 400:
          return {
            success: false,
            error: errorData.error || 'Dados inválidos'
          };
        case 401:
          return {
            success: false,
            error: 'Não autenticado. Faça login novamente.'
          };
        case 403:
          return {
            success: false,
            error: 'Sem permissão para esta ação'
          };
        case 404:
          return {
            success: false,
            error: 'Recurso não encontrado'
          };
        case 409:
          return {
            success: false,
            error: 'Conflito: CPF/Email já existe'
          };
        default:
          return {
            success: false,
            error: `Erro ${response.status}: ${errorData.message}`
          };
      }
    }

    const data = await response.json() as T;
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Erro na requisição:', error);
    return {
      success: false,
      error: 'Erro ao comunicar com o servidor'
    };
  }
}

// Uso
const result = await safeApiCall('/api/citizen/protocols', {
  method: 'GET'
});

if (result.success) {
  console.log('Protocolos:', result.data);
} else {
  console.error('Erro:', result.error);
}
```

