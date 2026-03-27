#!/bin/bash
# ============================================================
#  🚀  SaaSERP Victoria — Deploy Script
#  Servidor: 134.209.214.44 (Ubuntu, .NET 10, Node 20)
#  Uso: ./deploy.sh [--api-only] [--web-only] [--skip-git]
# ============================================================

set -e

# ── Configuración ──────────────────────────────────────────
REPO_DIR="/opt/saas"
API_DIR="$REPO_DIR/SaaSERP.Api"
WEB_DIR="$REPO_DIR/SaaSERP.Web"
RUNTIME_DIR="/opt/saas/runtime"
SERVICE_NAME="saas-api"
# nginx sirve directamente desde /opt/saas/SaaSERP.Web/dist — sin copiar

# ── Colores ────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log()     { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✔ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $1${NC}"; }
error()   { echo -e "${RED}✘ $1${NC}"; exit 1; }

# ── Flags ──────────────────────────────────────────────────
SKIP_GIT=false; API_ONLY=false; WEB_ONLY=false
for arg in "$@"; do
  case $arg in
    --skip-git) SKIP_GIT=true ;;
    --api-only) API_ONLY=true ;;
    --web-only) WEB_ONLY=true ;;
  esac
done

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      SaaSERP Victoria — Deploy           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Git Pull ────────────────────────────────────────────
if [ "$SKIP_GIT" = false ]; then
  log "📥 git pull..."
  cd "$REPO_DIR"
  git pull origin "$(git rev-parse --abbrev-ref HEAD)"
  success "git OK → $(git log -1 --format='%h — %s')"
else
  warn "Saltando git pull (--skip-git)"
fi

# ── 2. API .NET ────────────────────────────────────────────
if [ "$WEB_ONLY" = false ]; then
  log "🔨 dotnet publish → $RUNTIME_DIR"
  cd "$API_DIR"
  # Find the .csproj file explicitly (avoids picking up the .slnx solution which doesn't support --output)
  CSPROJ=$(find . -maxdepth 1 -name "*.csproj" | head -1)
  if [ -z "$CSPROJ" ]; then
    error "No se encontró ningún .csproj en $API_DIR"
  fi
  log "  Proyecto: $CSPROJ"
  # Clean stale cache files that can cause MSB3492 errors
  rm -f obj/Release/net10.0/*.cache 2>/dev/null || true
  dotnet restore "$CSPROJ" --nologo -q
  # Step 1: Build (compila código, genera AssemblyInfo, etc.)
  dotnet build "$CSPROJ" -c Release --nologo -q
  # Step 2: Publish con --no-build para evitar bug de StaticWebAssets en .NET 10
  dotnet publish "$CSPROJ" -c Release -o "$RUNTIME_DIR" --no-build --nologo -q
  success "API compilada"

  log "🔄 Reiniciando $SERVICE_NAME..."
  systemctl stop "$SERVICE_NAME"
  sleep 1
  systemctl start "$SERVICE_NAME"
  sleep 3

  if [ "$(systemctl is-active $SERVICE_NAME)" = "active" ]; then
    success "Servicio $SERVICE_NAME activo ✓"
  else
    systemctl status "$SERVICE_NAME" --no-pager | tail -10
    error "$SERVICE_NAME no inició correctamente"
  fi
fi

# ── 3. Frontend React ──────────────────────────────────────
if [ "$API_ONLY" = false ]; then
  log "📦 npm ci..."
  cd "$WEB_DIR"
  npm ci --prefer-offline --silent

  log "🏗️  npm run build..."
  npm run build

  # nginx ya apunta a /opt/saas/SaaSERP.Web/dist — no hay que copiar nada
  log "🔄 Recargando nginx..."
  nginx -t -q && systemctl reload nginx
  success "Web publicada en $WEB_DIR/dist"
fi

# ── 4. Resumen ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅  DEPLOY EXITOSO               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "  Rama:    $(cd $REPO_DIR && git rev-parse --abbrev-ref HEAD)"
echo "  Commit:  $(cd $REPO_DIR && git log -1 --format='%h — %s')"
echo "  API:     $RUNTIME_DIR"
echo "  Web:     $WEB_DIR/dist"
echo "  Hora:    $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
