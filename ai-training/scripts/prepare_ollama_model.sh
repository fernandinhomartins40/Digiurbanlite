#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODEL_NAME="${DIGIURBAN_OLLAMA_MODEL_NAME:-digiurban-fast:latest}"
BASE_MODEL="${DIGIURBAN_BASE_INFERENCE_MODEL:-qwen3.5:2b}"
MODELFILE_TEMPLATE="${REPO_ROOT}/digiurban-ai/models/ollama/digiurban-fast.Modelfile"
RUNTIME_MODELFILE="${REPO_ROOT}/ai-training/artifacts/digiurban-fast.runtime.Modelfile"

mkdir -p "$(dirname "${RUNTIME_MODELFILE}")"
sed "s/^FROM .*/FROM ${BASE_MODEL}/" "${MODELFILE_TEMPLATE}" > "${RUNTIME_MODELFILE}"

echo "Criando modelo ${MODEL_NAME} no Ollama a partir de ${BASE_MODEL}..."
ollama create "${MODEL_NAME}" -f "${RUNTIME_MODELFILE}"
echo "Modelo ${MODEL_NAME} pronto."
