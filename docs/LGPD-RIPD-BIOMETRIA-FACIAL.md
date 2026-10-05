# Relatório de Impacto à Proteção de Dados (RIPD) — Biometria facial

Modelo para o município preencher e assinar. Os trechos entre colchetes são do município. O resto descreve como o DigiUrban trata a biometria desde a revisão de 04/10/2026.

## 1. Identificação

- **Controlador:** [Prefeitura Municipal de ____ — CNPJ ____]
- **Encarregado (DPO):** [nome, e-mail, telefone]
- **Operador:** DigiUrban (plataforma de governo digital), que hospeda e opera o sistema.
- **Data e versão deste relatório:** [__/__/____ — v1]

## 2. Por que a biometria é usada

São duas finalidades, e cada uma tem um consentimento separado:

| Finalidade | O que faz | Quem consente |
|---|---|---|
| Confirmar identidade (`IDENTITY_VERIFICATION`) | Confirma que é o próprio cidadão. É usada no nível Ouro da conta e em atendimentos presenciais. | O próprio cidadão, pelo portal ou no balcão |
| Segurança escolar (`SCHOOL_SECURITY`) | Reconhece o aluno na entrada e na saída da escola e avisa o responsável. | Mãe, pai ou responsável legal (LGPD art. 14) |

Um rosto só entra numa busca se houver consentimento ativo para aquela finalidade.

- A biometria cadastrada para confirmar identidade **não** é usada na portaria da escola sem a autorização escolar.
- A biometria escolar **não** é usada para outros fins.

## 3. Base legal

- **Dado sensível:** LGPD art. 5º, II e art. 11.
- **Base adotada:** consentimento específico e destacado (art. 11, I), registrado com:
  - data;
  - canal;
  - versão do termo;
  - quem consentiu.
- **Crianças e adolescentes** (art. 14): consentimento de um dos pais ou do responsável legal, no melhor interesse do aluno.
- [Se o município usar outra base, como a execução de política pública (art. 11, II, b), descreva aqui e ajuste o termo.]

## 4. Quais dados são tratados

- **Uma foto do rosto no cadastro.**
  - Cifrada no disco (AES-256-GCM) e separada por município.
  - Usada para recalcular a assinatura se o modelo de reconhecimento mudar.
- **Uma assinatura numérica do rosto** (vetor de 512 números).
  - Fica só no servidor de biometria e nunca é enviada às telas.
- **Fotos de passagem na portaria**, com prazo curto (ver item 6).
- **Registro de acesso:** quem consultou, cadastrou, leu, viu foto ou apagou, e quando.
- **Não tratamos:** idade estimada, gênero, raça, emoção ou qualquer outro atributo inferido do rosto.

## 5. Como funciona (resumo técnico)

1. O navegador só **guia** a captura: centraliza o rosto e pede o giro.
2. O **servidor** sorteia um lado (esquerda ou direita) e recebe 3 fotos: de frente, virando para o lado sorteado e de frente de novo.
3. O motor de reconhecimento (biblioteca UniFace, rodando no servidor da plataforma, sem envio a terceiros) mede e confere quatro pontos:
   - **rosto:** se há exatamente um;
   - **pose:** se o giro foi para o lado pedido;
   - **mesma pessoa:** se é a mesma pessoa nas três fotos;
   - **anti-fraude passivo:** se a imagem parece vir de foto ou tela.
4. Só depois disso o cadastro ou a leitura é aceito.
5. A conferência compara rostos **somente dentro do município**.
6. **Leitura de um cidadão:** compara só com o cadastro desse cidadão (1:1).
7. **Busca de um rosto entre todos** (1:N): exige cargo de gerente ou acima, exceto na portaria escolar.
8. **Casos duvidosos** (semelhança intermediária, dois cadastros parecidos, possível foto ou tela na portaria) vão para **revisão humana** (art. 20).

## 6. Por quanto tempo guardamos

Os prazos são configuráveis em Super-admin › Privacidade e a limpeza é automática, todo dia:

| Dado | Prazo padrão |
|---|---|
| Foto de quem a câmera **não** reconheceu | 7 dias (máximo 30) |
| Foto das passagens reconhecidas | 90 dias |
| Registro de entrada e saída (sem foto) | 365 dias |
| Foto de cadastro recusado | 30 dias |
| Registro de acesso | 5 anos (prestação de contas) |
| Biometria do cidadão | Enquanto houver consentimento ativo |

## 7. Direitos do titular (art. 18)

- **Ver:** no portal (Biometria facial), o cidadão vê a situação da biometria e os consentimentos.
- **Apagar e revogar:** o botão "Apagar minha biometria" revoga os consentimentos e apaga:
  - a assinatura;
  - as fotos de cadastro;
  - as fotos de passagem.

  Os registros escolares de entrada e saída ficam, sem foto.
- **Revogar uma finalidade:** quando nenhuma finalidade fica ativa, a biometria é apagada automaticamente.
- **Responsável do aluno:** pede a revogação na escola. O servidor registra e a biometria escolar é apagada.

## 8. Segurança (art. 46)

- **Serviços internos:** o servidor de biometria e o motor não têm porta aberta para a internet; só o backend os alcança.
- **Token entre serviços:** é gerado no painel (Super-admin › Chaves de API › Comunicação interna) e guardado cifrado.
- **Fotos:** só saem pelo backend, para coordenador ou cargo acima, e cada visualização é registrada.
- **Permissões por cargo:**
  - atendente: cadastrar com consentimento, ler e registrar passagem;
  - coordenador: configurar câmeras e ver fotos;
  - gerente: listar biometrias, fazer busca 1:N e ver o registro de acesso.
- **Logs:** os logs de erro não gravam fotos, senhas nem documentos.

## 9. Riscos e medidas

| Risco | Medida |
|---|---|
| Falso reconhecimento (pessoa errada) | Limites de confiança no painel, revisão humana dos casos duvidosos e alerta de duplicidade no cadastro |
| Fraude com foto ou vídeo | Desafio sorteado pelo servidor e anti-fraude passivo. Limite: um vídeo da pessoa virando para os dois lados ainda pode enganar; em caso de suspeita, confirme por documento |
| Viés (tom de pele, idade) | [O município deve avaliar com dados locais antes de uso em larga escala; registre aqui o resultado] |
| Vazamento de banco ou disco | Fotos cifradas, assinatura sem fotos nas telas, separação por município |
| Uso para outra finalidade | Consentimento por finalidade e busca restrita a quem consentiu |

## 10. Licenças dos modelos

Desde 05/10/2026, todo o caminho padrão do motor usa modelos com licença que **permite uso comercial**:

| Etapa | Modelo | Licença |
|---|---|---|
| Achar o rosto | BlazeFace (Google/MediaPipe) | Apache 2.0 |
| Pontos do rosto (alinhamento e giro) | FaceMesh (Google/MediaPipe) | Apache 2.0 |
| Assinatura do rosto | AuraFace v1 (fal.ai), treinado com dados de uso comercial | Apache 2.0 |
| Anti-fraude (foto ou tela) | MiniFASNet (Minivision) | Apache 2.0 |
| Giro do rosto e qualidade da foto | Calculados pela geometria e pela imagem | Sem modelo |
| Biblioteca | UniFace | MIT |

Saíram três modelos treinados em bases de pesquisa:
- o detector RetinaFace (base WIDER FACE);
- o medidor de pose (base 300W-LP);
- a nota de qualidade eDifFIQA (base VGGFace2).

**Opções de teste:** os modelos ArcFace e MobileFace continuam no painel, marcados como "uso NÃO comercial". Só devem ser usados com licença comercial do InsightFace.

**Cuidado:** o autor do AuraFace avisa que o desempenho pode variar conforme a etnia. Avalie com dados locais (item 9).

## 11. Aprovação

[Local, data, assinatura do controlador e do encarregado]
