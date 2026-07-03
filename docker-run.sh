#!/usr/bin/env bash
# ============================================================
#  MRGLA — Docker Runner Script
#  Builds and starts the full application stack
#  Usage: bash docker-run.sh [--build] [--reset]
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker/docker-compose.yml"

print_usage() {
  echo "Usage: bash docker-run.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --build       Rebuild images from scratch (no cache)"
  echo "  --reset       Remove all volumes (fresh database)"
  echo "  --help        Show this help"
  echo ""
  echo "Access:"
  echo "  App:    http://localhost:3000"
  echo "  Login:  receptionist@hotel.com / admin123"
}

BUILD=""
RESET=""

for arg in "$@"; do
  case "$arg" in
    --build) BUILD="--build" ;;
    --reset) RESET="true" ;;
    --help)  print_usage; exit 0 ;;
    *)       echo "Unknown option: $arg"; print_usage; exit 1 ;;
  esac
done

if [ "$RESET" = "true" ]; then
  echo "==> Removing all Docker volumes (fresh database)..."
  docker compose -f "$COMPOSE_FILE" down -v
fi

echo "==> Starting MRGLA stack..."
echo "    App:      http://localhost:3000"
echo "    Database: localhost:51214"
echo "    Login:    receptionist@hotel.com / admin123"
echo ""

BUILD_FLAG=""
if [ -n "$BUILD" ]; then
  BUILD_FLAG="--build"
fi

docker compose -f "$COMPOSE_FILE" up -d $BUILD_FLAG

echo ""
echo "==> Waiting for application to be ready..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200\|302"; then
    echo "    App ready after ${i}s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "!! App not reachable after 30s — check 'docker compose logs app'"
    exit 1
  fi
  sleep 2
done

echo ""
echo "========================================"
echo "  MRGLA is running!"
echo "  App:      http://localhost:3000"
echo "  Database: localhost:51214"
echo "  Login:    receptionist@hotel.com"
echo "  Password: admin123"
echo "========================================"
echo ""
echo "Useful commands:"
echo "  docker compose -f ${COMPOSE_FILE} logs -f    # Follow all logs"
echo "  docker compose -f ${COMPOSE_FILE} logs app    # App logs only"
echo "  docker compose -f ${COMPOSE_FILE} down        # Stop everything"
echo "  bash docker-run.sh --reset                    # Reset + restart"
