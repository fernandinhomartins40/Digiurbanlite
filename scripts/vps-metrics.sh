#!/bin/bash
# ============================================================================
# vps-metrics.sh — Observabilidade proporcional (docs/PLANO-OTIMIZACAO-VPS.md, M5)
# ============================================================================
# Coleta consumo dos containers DESTA aplicacao em CSV, para responder:
#   - a aplicacao cresce em memoria sem carga? (vazamento)
#   - qual container consome mais?
#   - os volumes crescem? quanto disco sobra?
#
# POR QUE NAO PROMETHEUS/GRAFANA: numa VPS de 4 vCPU compartilhada por ~30 apps,
# a stack de monitoramento custaria mais RAM que a propria aplicacao. `docker stats`
# le do cgroups — a mesma fonte que o Docker usa para impor os limites — com
# overhead desprezivel.
#
# USO:
#   ./scripts/vps-metrics.sh            # coleta uma amostra
#   ./scripts/vps-metrics.sh --report   # resumo legivel das ultimas amostras
#
# CRON (de hora em hora):
#   0 * * * * /opt/digiurban/scripts/vps-metrics.sh >/dev/null 2>&1
# ============================================================================

set -u

OUT="${METRICS_FILE:-/var/log/digiurban-metrics.csv}"
MAX_LINES="${METRICS_MAX_LINES:-2000}"   # ~83 dias de coleta horaria
CONTAINERS="digiurban-vps ultrazend-messages ultrazend-smtp ultrazend-face digiurban-postgres digiurban-redis"

# Se nao houver permissao no caminho padrao, cai para o diretorio do projeto.
if ! touch "$OUT" 2>/dev/null; then
  OUT="$(cd "$(dirname "$0")/.." && pwd)/digiurban-metrics.csv"
fi

# ---------------------------------------------------------------------------
# Modo relatorio
# ---------------------------------------------------------------------------
if [ "${1:-}" = "--report" ]; then
  if [ ! -f "$OUT" ]; then
    echo "Sem dados ainda: $OUT nao existe."
    echo "Rode sem argumentos para coletar a primeira amostra."
    exit 0
  fi

  echo "=== Arquivo: $OUT ==="
  echo "Amostras: $(( $(wc -l < "$OUT") - 1 ))"
  echo ""
  echo "=== Ultima coleta por container ==="
  printf "%-22s %8s %12s %8s\n" "CONTAINER" "CPU%" "MEM" "MEM%"
  last_ts="$(tail -n 50 "$OUT" | awk -F, 'NR>0{print $1}' | tail -1)"
  awk -F, -v ts="$last_ts" 'NR>1 && $1==ts {printf "%-22s %8s %12s %8s\n", $2, $3, $4, $5}' "$OUT"
  echo ""
  echo "=== Tendencia de memoria (1a x ultima amostra) ==="
  echo "Crescimento continuo SEM carga proporcional = suspeita de vazamento."
  printf "%-22s %14s %14s\n" "CONTAINER" "PRIMEIRA" "ULTIMA"
  for c in $CONTAINERS; do
    first="$(awk -F, -v c="$c" 'NR>1 && $2==c {print $4; exit}' "$OUT")"
    last="$(awk -F, -v c="$c" 'NR>1 && $2==c {v=$4} END{print v}' "$OUT")"
    [ -n "${first:-}" ] && printf "%-22s %14s %14s\n" "$c" "$first" "$last"
  done
  echo ""
  echo "=== Disco e volumes (agora) ==="
  df -h / | awk 'NR==1||NR==2'
  echo ""
  docker system df 2>/dev/null || echo "(docker system df indisponivel)"
  exit 0
fi

# ---------------------------------------------------------------------------
# Coleta
# ---------------------------------------------------------------------------
[ -f "$OUT" ] || echo "timestamp,container,cpu_pct,mem_usage,mem_pct,net_io,block_io" > "$OUT"

TS="$(date -Is)"

# --no-stream: uma amostra e sai (sem isso o comando nunca termina).
# Filtra apenas os containers DESTA aplicacao — numa VPS compartilhada, medir
# containers de outras apps seria ruido (e informacao que nao nos cabe).
docker stats --no-stream \
  --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}}' \
  $CONTAINERS 2>/dev/null \
  | sed 's/ \/ /\//g' \
  | while IFS= read -r line; do
      [ -n "$line" ] && echo "${TS},${line}" >> "$OUT"
    done

# Retencao: mantem o arquivo limitado (o cabecalho sobrevive).
if [ "$(wc -l < "$OUT")" -gt "$MAX_LINES" ]; then
  { head -1 "$OUT"; tail -n $((MAX_LINES - 1)) "$OUT"; } > "${OUT}.tmp" && mv "${OUT}.tmp" "$OUT"
fi

# Alerta barato de disco — o incidente que motivou esta auditoria comecou com
# o disco a 96%.
USED_PCT="$(df --output=pcent / 2>/dev/null | tail -1 | tr -dc '0-9')"
if [ -n "${USED_PCT:-}" ] && [ "$USED_PCT" -ge 85 ]; then
  echo "[$(date -Is)] ALERTA: disco / em ${USED_PCT}% — verifique 'docker system df' e volumes orfaos" >&2
fi
