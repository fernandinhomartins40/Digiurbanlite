# DigiUrban Fast Training

Pipeline preparada para especializar o modelo padrao da plataforma:

- base: `Qwen/Qwen3.5-2B-Base`
- ajuste: `LoRA/QLoRA`
- runtime final: `digiurban-fast:latest`

## Objetivo

Deslocar o comportamento do modelo para:

- orientacao sobre a aplicacao DigiUrban
- fluxos por papel
- respostas operacionais sobre protocolos e chamados
- redacao institucional
- recusa de invencao quando faltar contexto

## Estrutura

- `data/seed-examples.json`: sementes curadas por grupo
- `data/digiurban-lora-dataset.jsonl`: dataset gerado
- `scripts/train_qwen2b_lora.py`: treino LoRA com Unsloth
- `scripts/prepare_ollama_model.sh`: cria alias local `digiurban-fast:latest` a partir de `qwen3.5:2b`
- `scripts/export_gguf_and_publish.sh`: prepara publicacao do modelo treinado no Ollama

## Fluxo

1. Gerar dataset:

```bash
node scripts/generate-digiurban-lora-dataset.mjs
```

2. Treinar em ambiente com GPU:

```bash
pip install -r ai-training/requirements.txt
python ai-training/scripts/train_qwen2b_lora.py
```

3. Enquanto o adapter treinado nao existe, criar o alias de runtime:

```bash
bash ai-training/scripts/prepare_ollama_model.sh
```

4. Depois do treino e da exportacao GGUF, publicar o modelo final:

```bash
bash ai-training/scripts/export_gguf_and_publish.sh
```

## Observacao

O treino LoRA nao deve ser executado na VPS CPU-only. O repositorio fica pronto para treino externo e deploy do artefato final.
