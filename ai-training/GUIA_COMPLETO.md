# 🤖 Guia Completo: Treinar o DigiBot no Google Colab

## O que você vai precisar
- Conta Google (Gmail) — grátis
- Os arquivos desta pasta
- Paciência de ~30 minutos

---

## PARTE 1 — PREPARAÇÃO (no seu computador)

### Passo 1: Gerar o dataset atualizado
Abra o terminal (PowerShell ou CMD) nesta pasta e rode:
```
python generate_dataset.py
```
Isso vai gerar/atualizar o arquivo `digibot_dataset.jsonl`.

### Passo 2: Verificar os arquivos que você vai usar
Você vai precisar de 2 arquivos:
- `digibot_dataset.jsonl` — os dados de treinamento (89 exemplos completos)
- `DigiBot_Qwen_FineTuning.ipynb` — o notebook do Google Colab

---

## PARTE 2 — ABRINDO O GOOGLE COLAB

### Passo 3: Acessar o Google Colab
1. Abra seu navegador
2. Acesse: https://colab.research.google.com
3. Faça login com sua conta Google

### Passo 4: Fazer upload do notebook
1. Na tela inicial do Colab, clique em **"Fazer upload"**
2. Selecione o arquivo `DigiBot_Qwen_FineTuning.ipynb`
3. O notebook vai abrir automaticamente

### Passo 5: OBRIGATÓRIO — Ativar a GPU
1. No menu superior clique em **"Ambiente de execução"**
2. Clique em **"Alterar o tipo de ambiente de execução"**
3. Em "Acelerador de hardware" selecione **"GPU"**
4. Selecione **"T4"** (disponível gratuitamente)
5. Clique em **"Salvar"**

⚠️ SEM GPU o treinamento vai demorar horas e provavelmente falhar!

---

## PARTE 3 — EXECUTANDO O TREINAMENTO

### Passo 6: Verificar a GPU (Célula 1)
Clique no botão ▶ da primeira célula.
Você deve ver algo como:
```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI ...  Driver Version: ...  CUDA Version: ...                      |
+-----------------------------------------------------------------------------+
```
Se ver "GPU não encontrada", volte ao Passo 5.

### Passo 7: Instalar as dependências (Célula 2)
Clique em ▶ na segunda célula.
Aguarde ~3 minutos. Vai instalar: transformers, peft, trl, bitsandbytes, etc.
Quando terminar aparece: ✅ Dependências instaladas!

### Passo 8: Fazer upload do dataset (Célula 3)
1. Clique em ▶ na terceira célula
2. Vai aparecer um botão **"Escolher arquivos"**
3. Clique no botão e selecione o arquivo `digibot_dataset.jsonl`
4. Aguarde o upload terminar
5. Deve aparecer: ✅ Dataset carregado: 172 exemplos

### Passo 9: Inspecionar o dataset (Célula 4)
Clique em ▶ — apenas confirma que os dados estão corretos.

### Passo 10: Configurações (Célula 5)
Clique em ▶ — mantém as configurações padrão que já estão otimizadas.
Se quiser, você pode alterar:
- `NUM_EPOCHS = 3` → mais épocas = mais treinamento (mas mais lento)
- `BASE_MODEL` → qual modelo base usar

### Passo 11: Carregar o modelo (Célula 6)
Clique em ▶. Vai baixar o modelo Qwen3 1.7B (~3GB).
⏱️ Aguarde 5-10 minutos para o download.
Quando terminar aparece: ✅ Modelo carregado!

### Passo 12: Aplicar LoRA (Célula 7)
Clique em ▶. Rápido, menos de 1 minuto.
Vai mostrar quantos parâmetros serão treinados (normalmente ~2-4%).

### Passo 13: Preparar o dataset (Células 8 e 9)
Clique em ▶ em cada uma. Rápido.

### Passo 14: 🚀 TREINAR! (Célula 10)
Clique em ▶ e aguarde.
⏱️ Tempo estimado: 15-25 minutos na GPU T4.
Você verá o progresso com a perda (loss) diminuindo:
```
{'loss': 2.4, 'epoch': 0.5}
{'loss': 1.8, 'epoch': 1.0}
{'loss': 1.2, 'epoch': 2.0}
{'loss': 0.8, 'epoch': 3.0}
✅ Treinamento concluído!
```
Quanto menor o loss, melhor o treinamento.

### Passo 15: Salvar o modelo (Célula 11)
Clique em ▶. Salva os arquivos do modelo treinado.

---

## PARTE 4 — TESTAR O MODELO

### Passo 16: Testar respostas (Célula 13)
Clique em ▶ e veja o modelo respondendo perguntas sobre o DigiUrban!
Você verá algo como:
```
Pergunta: Como solicito um serviço municipal?
Resposta: Para solicitar um serviço, siga estes passos:
1. Acesse o menu e escolha Solicitar Serviço...
```

---

## PARTE 5 — BAIXAR O MODELO TREINADO

### Passo 17: Fazer o download (Célula 15)
1. Clique em ▶ na célula 15
2. O Colab vai criar um arquivo `digibot-lora-adapters.zip`
3. O download vai iniciar automaticamente no seu navegador
4. Salve o arquivo em um lugar seguro

### O que está dentro do ZIP:
```
digibot-lora-adapters/
├── adapter_config.json      ← configuração do LoRA
├── adapter_model.safetensors ← os pesos treinados (~100MB)
├── tokenizer.json           ← tokenizer do modelo
├── tokenizer_config.json    ← configuração do tokenizer
└── special_tokens_map.json  ← tokens especiais
```

---

## PARTE 6 — SALVAR NO GOOGLE DRIVE (alternativa)

Se o download direto for lento ou você quiser manter o modelo salvo na nuvem:

1. Na Célula 12, **descomente** o código (remova os # no início de cada linha)
2. Execute a célula
3. O Colab vai pedir permissão para acessar seu Google Drive
4. O modelo será salvo em: `Meu Drive/digibot-finetuned/`

---

## PARTE 7 — USAR O MODELO NO SEU SERVIDOR

### Opção A: Usar os adaptadores LoRA diretamente (mais simples)
Os arquivos do ZIP funcionam com qualquer servidor que suporte
Hugging Face transformers + PEFT. São ~100MB.

### Opção B: Merge + converter para GGUF (para usar com seu llama.cpp)
1. Execute a Célula 14 (está comentada — descomente e execute)
2. Isso cria um modelo completo mesclado (~3GB)
3. Depois converta para GGUF para usar com llama.cpp

Para converter para GGUF após baixar o modelo mergeado:
```bash
# Instalar llama.cpp (se não tiver)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make

# Converter para GGUF
python convert.py /caminho/digibot-merged --outfile digibot.gguf

# Quantizar para 4-bit (reduz de ~3GB para ~1GB)
./quantize digibot.gguf digibot-q4.gguf Q4_K_M
```

4. Coloque o `digibot-q4.gguf` no seu container llama.cpp
5. O Messages Server já chama `http://digiurban-llamacpp:8080`

---

## DICAS IMPORTANTES

### Se o Colab desconectar durante o treinamento:
- O Colab gratuito tem limite de ~12h por sessão
- Se desconectar, você precisa reiniciar da célula 6 (o modelo precisa ser recarregado)
- Salve no Google Drive para não perder o progresso

### Se der erro de memória (OOM - Out of Memory):
- Reduza o `BATCH_SIZE = 1` na Célula 5
- Reduza o `MAX_SEQ_LENGTH = 256`
- Reinicie o ambiente e tente novamente

### Como melhorar o modelo:
1. Adicione mais exemplos em `generate_dataset.py`
2. Aumente `NUM_EPOCHS = 5`
3. Retreine com o novo dataset

### Para adicionar novos exemplos de treinamento:
Edite `generate_dataset.py` e adicione no final de qualquer lista PAIRS:
```python
{
    "instruction": "Sua pergunta aqui",
    "output": "A resposta ideal do DigiBot aqui",
},
```

---

## RESUMO RÁPIDO (checklist)

- [ ] Gerar dataset: `python generate_dataset.py`
- [ ] Acessar colab.research.google.com
- [ ] Fazer upload do `.ipynb`
- [ ] Ativar GPU T4 no menu
- [ ] Executar células 1 a 11 em ordem
- [ ] Upload do `digibot_dataset.jsonl` na célula 3
- [ ] Aguardar o treinamento (15-25 min)
- [ ] Testar na célula 13
- [ ] Baixar o ZIP na célula 15
