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

  jwt_secret="$(read_env_value JWT_SECRET "${backup_path}")"
  if [[ -n "${jwt_secret}" && "${jwt_secret}" == *'$('* ]]; then
    jwt_secret=""
  fi

  if [ -z "${jwt_secret}" ]; then
    jwt_secret="$(generate_random_secret "digiurban-production-secret")"
  fi

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

# Database URL (PostgreSQL)
DATABASE_URL=postgresql://digiurban:digiurban2024@postgres:5432/digiurban

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=8h
JWT_CITIZEN_EXPIRES_IN=30d

# CORS
FRONTEND_URL=https://www.digiurban.com.br
CORS_ORIGIN=https://www.digiurban.com.br
ALLOWED_ORIGINS=https://www.digiurban.com.br,http://www.digiurban.com.br,https://digiurban.com.br,http://digiurban.com.br,http://72.60.10.108:3060,http://localhost:3060

# Tenants
DEFAULT_TENANT=demo

# Logs
LOG_LEVEL=info
BUILD_TIMESTAMP=$(date +%s)

# Ollama AI (DigiBot Enhanced)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=digibot-qwen2.5
OLLAMA_TIMEOUT=15000
EOF
}
