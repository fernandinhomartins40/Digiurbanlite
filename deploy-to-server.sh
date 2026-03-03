#!/bin/bash
set -e

echo "Starting deploy to digiurban.com.br..."

ssh root@digiurban.com.br <<'ENDSSH'
set -e

APP_DIR="/root/digiurban"
cd "$APP_DIR" || exit 1

echo "Updating repository..."
git fetch origin main --prune
git reset --hard origin/main

if [ ! -f "scripts/vps-deploy-lib.sh" ]; then
  echo "ERROR: scripts/vps-deploy-lib.sh not found"
  exit 1
fi

. "scripts/vps-deploy-lib.sh"
ensure_vm_max_map_count 262144

echo "Rebuilding digiurban image..."
docker compose -f docker-compose.vps.yml build digiurban

echo "Starting required services..."
docker compose -f docker-compose.vps.yml up -d \
  postgres \
  redis \
  ultrazend-smtp \
  ollama \
  ultrazend-messages \
  digiurban-flow \
  digiurban-opensearch

wait_for_container_health digiurban-postgres 30 5
wait_for_container_health digiurban-redis 30 5
wait_for_container_health ultrazend-smtp 30 5
wait_for_container_health digiurban-ollama 40 10
wait_for_container_health ultrazend-messages 30 5
wait_for_container_health digiurban-flow 30 5
wait_for_container_health digiurban-opensearch 36 10

docker compose -f docker-compose.vps.yml up -d digiurban-prices
wait_for_container_health digiurban-prices 36 10

docker compose -f docker-compose.vps.yml up -d digiurban
wait_for_container_health digiurban-vps 36 10

echo "Deploy completed."
docker compose -f docker-compose.vps.yml ps
echo
docker logs digiurban-vps --tail 40
ENDSSH

echo
echo "Deploy finished successfully."
