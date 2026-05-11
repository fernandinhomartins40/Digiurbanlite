#!/bin/bash
set -e

echo "Starting DigiUrban rebuild on the VPS..."

cd /root/digiurban

echo "Updating code..."
git fetch origin main --prune
git reset --hard origin/main

if [ ! -f "scripts/vps-deploy-lib.sh" ]; then
  echo "ERROR: scripts/vps-deploy-lib.sh not found"
  exit 1
fi

. "scripts/vps-deploy-lib.sh"
ensure_vm_max_map_count 262144

echo "Stopping running containers..."
docker compose -f docker-compose.vps.yml down

echo "Removing old digiurban image..."
docker rmi digiurban-digiurban 2>/dev/null || true

echo "Rebuilding digiurban image..."
docker compose -f docker-compose.vps.yml build digiurban --no-cache

echo "Starting base infrastructure..."
docker compose -f docker-compose.vps.yml up -d \
  postgres \
  redis \
  ultrazend-smtp \
  llamacpp \
  ultrazend-messages \
  digiurban-flow \
  digiurban-ai \
  digiurban-opensearch

wait_for_container_health digiurban-postgres 30 5
wait_for_container_health digiurban-redis 30 5
wait_for_container_health ultrazend-smtp 30 5
wait_for_container_health digiurban-llamacpp 60 10
wait_for_http_ready http://127.0.0.1:8080/health 60 10
wait_for_container_health ultrazend-messages 30 5
wait_for_container_health digiurban-flow 30 5
wait_for_container_health digiurban-ai 30 5
wait_for_container_health digiurban-opensearch 36 10

echo "Starting application services..."
docker compose -f docker-compose.vps.yml up -d digiurban-prices
wait_for_container_health digiurban-prices 36 10

docker compose -f docker-compose.vps.yml up -d digiurban
wait_for_container_health digiurban-vps 36 10

echo "Container status:"
docker compose -f docker-compose.vps.yml ps

echo
echo "Recent digiurban logs:"
docker compose -f docker-compose.vps.yml logs --tail=30 digiurban

echo
echo "Rebuild completed."
