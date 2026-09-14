#!/bin/bash

# Helpers compartilhados para deploy na VPS.

ensure_vm_max_map_count() {
  local target="${1:-262144}"
  local current

  current="$(sysctl -n vm.max_map_count 2>/dev/null || echo 0)"
  echo "vm.max_map_count atual: ${current}"

  if [ "${current}" -lt "${target}" ]; then
    echo "Ajustando vm.max_map_count para ${target}..."
    mkdir -p /etc/sysctl.d
    printf 'vm.max_map_count=%s\n' "${target}" > /etc/sysctl.d/99-digiurban-opensearch.conf
    sysctl -w vm.max_map_count="${target}" >/dev/null
  fi

  current="$(sysctl -n vm.max_map_count 2>/dev/null || echo 0)"
  echo "vm.max_map_count efetivo: ${current}"

  if [ "${current}" -lt "${target}" ]; then
    echo "ERRO: vm.max_map_count permaneceu abaixo de ${target}"
    return 1
  fi
}

wait_for_container_health() {
  local container_name="${1:?container_name required}"
  local max_attempts="${2:-30}"
  local sleep_seconds="${3:-5}"
  local attempt=1
  local status

  while [ "${attempt}" -le "${max_attempts}" ]; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_name}" 2>/dev/null || echo missing)"

    case "${status}" in
      healthy|running)
        echo "Container ${container_name} pronto (${status})."
        return 0
        ;;
      starting|created|restarting)
        ;;
      unhealthy|exited|dead|missing)
        echo "Container ${container_name} em estado ${status} (${attempt}/${max_attempts})."
        ;;
      *)
        echo "Container ${container_name} em estado ${status} (${attempt}/${max_attempts})."
        ;;
    esac

    sleep "${sleep_seconds}"
    attempt=$((attempt + 1))
  done

  echo "ERRO: container ${container_name} nao ficou pronto a tempo."
  docker logs --tail=200 "${container_name}" 2>/dev/null || true
  return 1
}

wait_for_http_ready() {
  local url="${1:?url required}"
  local max_attempts="${2:-30}"
  local sleep_seconds="${3:-5}"
  local attempt=1

  while [ "${attempt}" -le "${max_attempts}" ]; do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      echo "Endpoint pronto: ${url}"
      return 0
    fi

    echo "Aguardando endpoint ${url} (${attempt}/${max_attempts})..."
    sleep "${sleep_seconds}"
    attempt=$((attempt + 1))
  done

  echo "ERRO: endpoint nao ficou pronto: ${url}"
  return 1
}

cleanup_legacy_ai_runtimes() {
  echo "Limpando runtimes antigos de IA que nao fazem mais parte do Digiurban..."

  local containers
  containers="$(docker ps -aq \
    --filter "name=^/digiurban-ollama$" \
    --filter "name=^/ollama$" 2>/dev/null || true)"
  if [ -n "${containers}" ]; then
    echo "Removendo containers Ollama antigos..."
    docker rm -f ${containers} 2>/dev/null || true
  fi

  containers="$(docker ps -aq --filter "ancestor=ollama/ollama:latest" 2>/dev/null || true)"
  if [ -n "${containers}" ]; then
    echo "Removendo containers baseados em ollama/ollama..."
    docker rm -f ${containers} 2>/dev/null || true
  fi

  for volume in ollama ollama_data digiurban_ollama digiurban_ollama_data digiurbanlite_ollama digiurbanlite_ollama_data; do
    if docker volume inspect "${volume}" >/dev/null 2>&1; then
      echo "Removendo volume legado ${volume}..."
      docker volume rm "${volume}" >/dev/null 2>&1 || true
    fi
  done

  if docker image inspect ollama/ollama:latest >/dev/null 2>&1; then
    echo "Removendo imagem ollama/ollama:latest..."
    docker image rm -f ollama/ollama:latest >/dev/null 2>&1 || true
  fi

  echo "Limpeza de IA legada concluida."
}

read_env_value() {
  local key="${1:?key required}"
  local env_file="${2:-.env.backup}"

  if [ ! -f "${env_file}" ]; then
    return 0
  fi

  grep -E "^${key}=" "${env_file}" | tail -n 1 | cut -d= -f2-
}

generate_random_secret() {
  local prefix="${1:-secret}"
  printf '%s-%s-%s' "${prefix}" "$(date +%s)" "$(openssl rand -hex 16)"
}

write_vps_env_file() {
  local env_path="${1:-.env}"
  local backup_path="${2:-.env.backup}"
  local jwt_secret
  local flow_service_token
  local messages_service_token
  local ai_service_token

  jwt_secret="$(read_env_value JWT_SECRET "${backup_path}")"
  if [[ -n "${jwt_secret}" && "${jwt_secret}" == *'$('* ]]; then
    jwt_secret=""
  fi

  if [ -z "${jwt_secret}" ]; then
    jwt_secret="$(generate_random_secret "digiurban-production-secret")"
  fi

  flow_service_token="$(read_env_value FLOW_SERVICE_TOKEN "${backup_path}")"
  if [[ -n "${flow_service_token}" && "${flow_service_token}" == *'$('* ]]; then
    flow_service_token=""
  fi
  if [ -z "${flow_service_token}" ]; then
    flow_service_token="$(generate_random_secret "digiurban-flow-service-token")"
  fi

  messages_service_token="$(read_env_value MESSAGES_SERVICE_TOKEN "${backup_path}")"
  if [[ -n "${messages_service_token}" && "${messages_service_token}" == *'$('* ]]; then
    messages_service_token=""
  fi
  if [ -z "${messages_service_token}" ]; then
    messages_service_token="$(generate_random_secret "ultrazend-messages-service-token")"
  fi

  ai_service_token="$(read_env_value AI_SERVICE_TOKEN "${backup_path}")"
  if [[ -n "${ai_service_token}" && "${ai_service_token}" == *'$('* ]]; then
    ai_service_token=""
  fi
  if [ -z "${ai_service_token}" ]; then
    ai_service_token="$(generate_random_secret "digiurban-ai-service-token")"
  fi

  # ── Multi-tenant / RLS (plano 2026-07-13) ─────────────────────────────────
  # Estas variáveis são PRESERVADAS do .env anterior a cada deploy. Sem isto,
  # armar o RLS (DATABASE_URL → role digiurban_app + MIGRATE_DATABASE_URL) ou
  # ligar as flags TENANT_STRICT* seria silenciosamente REVERTIDO no deploy
  # seguinte, porque este arquivo é regenerado do zero.
  local database_url migrate_database_url
  local tenant_require_claim tenant_strict_host tenant_strict
  local tenant_base_domain tenant_default_hosts

  database_url="$(read_env_value DATABASE_URL "${backup_path}")"
  if [ -z "${database_url}" ]; then
    database_url="postgresql://digiurban:digiurban2024@postgres:5432/digiurban"
  fi

  # Credencial ELEVADA usada só pelas migrations (startup.sh/prisma_migrate).
  # Vazia = migrations usam a própria DATABASE_URL (modo pré-RLS).
  migrate_database_url="$(read_env_value MIGRATE_DATABASE_URL "${backup_path}")"

  tenant_require_claim="$(read_env_value TENANT_REQUIRE_TOKEN_CLAIM "${backup_path}")"
  [ -z "${tenant_require_claim}" ] && tenant_require_claim="1"
  tenant_strict_host="$(read_env_value TENANT_STRICT_HOST "${backup_path}")"
  [ -z "${tenant_strict_host}" ] && tenant_strict_host="0"
  tenant_strict="$(read_env_value TENANT_STRICT "${backup_path}")"
  [ -z "${tenant_strict}" ] && tenant_strict="0"
  tenant_base_domain="$(read_env_value TENANT_BASE_DOMAIN "${backup_path}")"
  [ -z "${tenant_base_domain}" ] && tenant_base_domain="digiurban.com.br"
  tenant_default_hosts="$(read_env_value TENANT_DEFAULT_HOSTS "${backup_path}")"
  [ -z "${tenant_default_hosts}" ] && tenant_default_hosts="digiurban.com.br,www.digiurban.com.br,72.60.10.108"

  cat > "${env_path}" <<EOF
# Node.js
NODE_ENV=production

# Backend
PORT=3001
BACKEND_PORT=3001

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# PostgreSQL (valores padrão)
POSTGRES_USER=digiurban
POSTGRES_PASSWORD=digiurban2024
POSTGRES_DB=digiurban

# Database URL (PostgreSQL) — preservada do .env anterior (RLS: digiurban_app)
DATABASE_URL=${database_url}
# Credencial elevada só p/ migrations (vazia = usa DATABASE_URL)
MIGRATE_DATABASE_URL=${migrate_database_url}

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=8h
JWT_CITIZEN_EXPIRES_IN=30d

# Service tokens (internos)
FLOW_SERVICE_TOKEN=${flow_service_token}
MESSAGES_SERVICE_TOKEN=${messages_service_token}
AI_SERVICE_TOKEN=${ai_service_token}

# CORS
FRONTEND_URL=https://www.digiurban.com.br
CORS_ORIGIN=https://www.digiurban.com.br
ALLOWED_ORIGINS=https://www.digiurban.com.br,http://www.digiurban.com.br,https://digiurban.com.br,http://digiurban.com.br,http://72.60.10.108:3060,http://localhost:3060

# Tenants / hardening multi-tenant (plano 2026-07-13; preservados entre deploys)
DEFAULT_TENANT=demo
DEFAULT_TENANT_ID=tenant-default
TENANT_BASE_DOMAIN=${tenant_base_domain}
TENANT_DEFAULT_HOSTS=${tenant_default_hosts}
TENANT_REQUIRE_TOKEN_CLAIM=${tenant_require_claim}
TENANT_STRICT_HOST=${tenant_strict_host}
TENANT_STRICT=${tenant_strict}

# Logs
LOG_LEVEL=info
BUILD_TIMESTAMP=$(date +%s)

# ── IA ────────────────────────────────────────────────────────────────────
# Otimização VPS (docs/PLANO-OTIMIZACAO-VPS.md, C3): este arquivo é REGENERADO DO ZERO
# a cada deploy. Enquanto ele escrevia AI_API_URL / CITIZEN_AI_COMPLETIONS_URL /
# AI_LLAMACPP_* apontando para os containers digiurban-ai e llamacpp (removidos do
# compose em 043e290b), a configuração morta era REINTRODUZIDA em todo deploy — e os
# serviços tentavam falar com hosts inexistentes.
#
# As URLs foram removidas de propósito. Com elas ausentes:
#   - o proxy /api/ai responde 503 imediato em vez de pendurar por 15 s (A2);
#   - o CitizenAiClient do bot degrada limpo para o fluxo determinístico (M4).
# Para ATIVAR a IA externa (API DeepSeek), basta definir AI_API_URL e
# CITIZEN_AI_COMPLETIONS_URL no .env da VPS — nada mais precisa mudar.
#
# AI_SERVICE_TOKEN NÃO é repetido aqui: já é escrito no bloco "Service tokens (internos)"
# acima, porque serve à autenticação interna entre serviços, não apenas à IA.
# DIGIBOT_INACTIVITY_TIMEOUT_MS é do bot (timeout de inatividade), sem relação com IA.
DIGIBOT_INACTIVITY_TIMEOUT_MS=600000
EOF
}
