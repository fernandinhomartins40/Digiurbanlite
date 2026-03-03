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
