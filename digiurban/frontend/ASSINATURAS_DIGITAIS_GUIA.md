# Guia de Assinaturas Digitais - DigiUrban

## 📋 Visão Geral

O sistema de assinaturas digitais do DigiUrban permite que usuários assinem documentos oficiais com certificados digitais, similar ao sistema utilizado no Gov.br, mas totalmente customizado e integrado ao DigiUrban.

## 🎯 Funcionalidades Principais

### 1. **Posicionamento Visual da Assinatura**
- Interface intuitiva para selecionar onde a assinatura será aplicada no documento
- Visualização em tempo real do PDF
- Seleção por arrastar e soltar (drag and drop)
- Suporte a múltiplas páginas
- Controles de zoom e navegação

### 2. **Certificados Digitais**
- Gerenciamento completo de certificados
- Emissão de certificados para cidadãos e servidores
- Validação automática de status (ativo, revogado, expirado)
- Armazenamento seguro de chaves privadas

### 3. **Processo de Assinatura**
- Workflow em 4 etapas:
  1. Definir posição da assinatura no documento
  2. Selecionar certificado digital
  3. Inserir PIN de segurança
  4. Confirmar e assinar

## 🚀 Como Usar

### Para Administradores

#### Acessar Assinaturas Digitais
1. Faça login no painel administrativo
2. No menu lateral, clique em **"Assinaturas Digitais"** (seção Gestão)
3. Você verá 3 abas principais:
   - **Pendentes**: Documentos aguardando sua assinatura
   - **Assinados**: Documentos que você já assinou
   - **Minhas Assinaturas**: Histórico de todas as suas assinaturas

#### Enviar Documento para Assinatura
1. Na página de Assinaturas Digitais, clique em **"Enviar Documento"**
2. Selecione um arquivo PDF ou DOC/DOCX do seu computador
3. O documento será enviado e ficará disponível para assinatura

#### Assinar um Documento

**Passo 1: Definir Posição da Assinatura**
1. Clique em **"Assinar"** no documento desejado
2. O PDF será exibido em uma visualização interativa
3. Use os controles para:
   - Navegar entre páginas (← →)
   - Ajustar zoom (+ -)
4. **Clique e arraste** no documento para desenhar um retângulo onde a assinatura será colocada
5. A área selecionada ficará destacada em azul
6. Clique em **"Continuar"**

**Passo 2: Selecionar Certificado**
1. Escolha o certificado digital que deseja usar
2. Serão exibidos apenas certificados ativos e válidos
3. Clique no certificado desejado
4. Clique em **"Continuar"**

**Passo 3: Inserir PIN**
1. Digite o PIN do seu certificado digital
2. Este é o código de segurança definido quando você recebeu o certificado
3. Leia atentamente o aviso de responsabilidade legal
4. Clique em **"Assinar"**

**Passo 4: Confirmação**
- O sistema processará a assinatura
- Você verá uma confirmação de sucesso
- O documento assinado ficará disponível para download

### Para Cidadãos

O processo é idêntico ao dos administradores, mas acessado através do portal do cidadão:
1. Acesse **Meus Documentos** no menu
2. Clique em **"Assinar Digitalmente"** no documento desejado
3. Siga os mesmos 4 passos descritos acima

## 🔒 Segurança

### Certificados Digitais
- Utilizam criptografia RSA de 2048 bits
- Chaves privadas são armazenadas de forma criptografada
- PIN necessário para cada assinatura
- Validação automática de certificados revogados ou expirados

### Assinaturas
- Cada assinatura é única e verificável
- Timestamp de quando a assinatura foi aplicada
- Impossível falsificar ou alterar após assinatura
- Trilha de auditoria completa

## 📊 Estatísticas e Relatórios

O dashboard de assinaturas mostra:
- Documentos pendentes de assinatura
- Total de documentos assinados
- Suas assinaturas totais
- Documentos disponíveis

## ⚠️ Avisos Importantes

### Tamanho da Área de Assinatura
- A área de assinatura deve ter **no mínimo 50x30 pixels**
- Recomendamos uma área de aproximadamente 200x100 pixels para melhor visualização
- A área pode ser redefinida antes de confirmar

### Responsabilidade Legal
- Ao assinar um documento, você declara ciência do conteúdo
- A assinatura digital tem validade jurídica equivalente à assinatura manuscrita
- Não compartilhe seu PIN com terceiros
- Mantenha seu certificado digital seguro

### Certificados Expirados
- Certificados expirados não podem ser usados para novas assinaturas
- Documentos assinados anteriormente permanecem válidos
- Renove seu certificado antes do vencimento

## 🛠️ Solução de Problemas

### "Chave privada não encontrada"
- Você precisa fazer login com seu certificado digital primeiro
- Vá em **Certificados Digitais** > **Meus Certificados**
- Faça o upload da sua chave privada

### "PIN incorreto"
- Verifique se digitou o PIN corretamente
- O PIN é case-sensitive (diferencia maiúsculas e minúsculas)
- Após 3 tentativas incorretas, aguarde 5 minutos

### "Certificado revogado"
- Este certificado não pode mais ser usado
- Solicite a emissão de um novo certificado
- Entre em contato com o administrador do sistema

### Erro ao carregar PDF
- Verifique se o arquivo é um PDF válido
- Tamanho máximo: 50 MB
- Tente fazer upload novamente

## 📞 Suporte

Para dúvidas ou problemas:
- Entre em contato com o suporte técnico
- Email: suporte@prefeitura.gov.br
- Telefone: (XX) XXXX-XXXX

## 🔄 Atualizações Recentes

### Versão 1.0 (Janeiro 2026)
- ✅ Posicionamento visual de assinatura (similar ao Gov.br)
- ✅ Suporte a múltiplas páginas
- ✅ Controles de zoom e navegação
- ✅ Validação em tempo real
- ✅ Interface intuitiva e responsiva
- ✅ Histórico completo de assinaturas

## 📚 Recursos Técnicos

### Tecnologias Utilizadas
- **PDF.js**: Renderização de documentos PDF
- **React**: Interface de usuário
- **Node-Forge**: Criptografia de certificados
- **Prisma**: Banco de dados e auditoria

### Formatos Suportados
- **Entrada**: PDF, DOC, DOCX
- **Saída**: PDF assinado digitalmente
- **Certificados**: PEM, PKCS#12

---

**Desenvolvido pela Equipe DigiUrban**
*Modernizando a gestão pública com tecnologia*
