#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LORA_DIR="${DIGIURBAN_LORA_DIR:-${REPO_ROOT}/ai-training/artifacts/qwen35-2b-lora}"
MERGED_DIR="${DIGIURBAN_MERGED_DIR:-${REPO_ROOT}/ai-training/artifacts/qwen35-2b-merged}"
GGUF_PATH="${DIGIURBAN_GGUF_PATH:-${REPO_ROOT}/ai-training/artifacts/digiurban-fast-q4_k_m.gguf}"
MODEL_NAME="${DIGIURBAN_OLLAMA_MODEL_NAME:-digiurban-fast:latest}"

if [ ! -d "${LORA_DIR}" ]; then
  echo "Diretorio LoRA nao encontrado: ${LORA_DIR}"
  exit 1
fi

cat <<EOF
Fluxo esperado:
1. Mesclar o adapter LoRA no modelo base em ${MERGED_DIR}
2. Converter o modelo mesclado para GGUF em ${GGUF_PATH}
3. Atualizar o Modelfile do Ollama para usar o GGUF

Este script pressupoe que voce possui as ferramentas externas necessarias
(transformers + conversor GGUF, tipicamente llama.cpp) no ambiente de treino.
EOF

MODelfile_PATH="${REPO_ROOT}/ai-training/artifacts/digiurban-fast.gguf.Modelfile"
mkdir -p "$(dirname "${MODelfile_PATH}")"
cat > "${MODelfile_PATH}" <<EOF
FROM ${GGUF_PATH}

PARAMETER temperature 0.15
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER min_p 0.05
PARAMETER repeat_penalty 1.05
EOF

echo "Quando o GGUF estiver pronto, execute:"
echo "  ollama create ${MODEL_NAME} -f ${MODelfile_PATH}"
