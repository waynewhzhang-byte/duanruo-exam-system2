#!/usr/bin/env bash
set -euo pipefail

# Defaults match an already-provisioned server (Postgres / MinIO / Node already there).
# Only adds PM2 if missing, then npm ci + prisma + build + pm2 start.
#
# Environment (all optional):
#   SKIP_APT=1          Skip apt-get entirely (default: 1).
#   USE_NVM=0           Use system node/npm on PATH (default: 0).
#   USE_NVM=1           Install/use nvm + NODE_VERSION (default 22.22.2).
#   NODE_VERSION=22.22.2
#   MIGRATION_MODE=deploy|push|skip   (default: deploy; use skip if DB is already migrated)
#   SEED_SUPER_ADMIN=1|0  (default: 1) — run server/scripts/seed-super-admin.ts after migrate
#   SEED_SUPER_ADMIN_USERNAME / _EMAIL / _PASSWORD / _FULL_NAME (optional)
#   APP_NAME_SERVER / APP_NAME_WEB / WEB_PORT / SERVER_PORT

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_APT="${SKIP_APT:-1}"
USE_NVM="${USE_NVM:-0}"
NODE_VERSION="${NODE_VERSION:-22.22.2}"
APP_NAME_SERVER="${APP_NAME_SERVER:-duanruo-server}"
APP_NAME_WEB="${APP_NAME_WEB:-duanruo-web}"
WEB_PORT="${WEB_PORT:-3000}"
SERVER_PORT="${SERVER_PORT:-8081}"
MIGRATION_MODE="${MIGRATION_MODE:-deploy}"
SEED_SUPER_ADMIN="${SEED_SUPER_ADMIN:-1}"
SEED_SUPER_ADMIN_USERNAME="${SEED_SUPER_ADMIN_USERNAME:-admin}"
SEED_SUPER_ADMIN_EMAIL="${SEED_SUPER_ADMIN_EMAIL:-admin@duanruo.com}"
SEED_SUPER_ADMIN_PASSWORD="${SEED_SUPER_ADMIN_PASSWORD:-admin123@Abc}"
SEED_SUPER_ADMIN_FULL_NAME="${SEED_SUPER_ADMIN_FULL_NAME:-System Administrator}"

log() {
  echo "[$(date '+%F %T')] $*"
}

require_file() {
  local file_path="$1"
  if [[ ! -f "${file_path}" ]]; then
    echo "Missing required file: ${file_path}"
    exit 1
  fi
}

apt_install() {
  local pkgs=("$@")
  if [[ "${EUID}" -eq 0 ]]; then
    apt-get update
    apt-get install -y "${pkgs[@]}"
  else
    sudo apt-get update
    sudo apt-get install -y "${pkgs[@]}"
  fi
}

install_apt_dependencies() {
  if [[ "${SKIP_APT}" == "1" ]]; then
    log "SKIP_APT=1: skipping apt (Postgres / MinIO / OS packages are assumed already installed)."
    return 0
  fi
  log "SKIP_APT=0: installing minimal build tooling via apt..."
  apt_install curl ca-certificates git build-essential unzip
}

install_nvm_and_node() {
  if [[ "${USE_NVM}" == "1" ]] && ! command -v curl >/dev/null 2>&1; then
    echo "USE_NVM=1 requires curl. Install curl on the server, or run once with SKIP_APT=0."
    exit 1
  fi

  if [[ "${USE_NVM}" != "1" ]]; then
    if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
      echo "node/npm not found on PATH. Install Node on the server, or run with USE_NVM=1."
      exit 1
    fi
    log "Using system Node: $(command -v node) ($(node -v))"
    log "Using system NPM: $(command -v npm) ($(npm -v))"
    return 0
  fi

  if [[ ! -d "${HOME}/.nvm" ]]; then
    log "Installing nvm (USE_NVM=1)..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi

  # shellcheck disable=SC1090
  source "${HOME}/.nvm/nvm.sh"

  log "Installing Node.js ${NODE_VERSION} via nvm..."
  nvm install "${NODE_VERSION}"
  nvm alias default "${NODE_VERSION}"
  nvm use "${NODE_VERSION}"

  log "Node version: $(node -v)"
  log "NPM version: $(npm -v)"
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    log "PM2 already on PATH: $(command -v pm2) ($(pm2 -v 2>/dev/null || true))"
    return 0
  fi
  log "Installing PM2 globally (only extra runtime we add by default)..."
  npm install -g pm2@latest
}

prepare_env_files() {
  local server_env="${ROOT_DIR}/server/.env"
  local web_env="${ROOT_DIR}/web/.env.production"

  if [[ ! -f "${server_env}" ]]; then
    cp "${ROOT_DIR}/deploy/env/server.env.production.example" "${server_env}"
    log "Created ${server_env} from template. Prefer packing your local server/.env for same DB/MinIO as dev."
  else
    log "Using existing ${server_env} (e.g. copied from your dev machine in the tarball)."
  fi

  if [[ ! -f "${web_env}" ]]; then
    cp "${ROOT_DIR}/deploy/env/web.env.production.example" "${web_env}"
    log "Created ${web_env} from template. You may pack web/.env.production in the archive if needed."
  else
    log "Using existing ${web_env}."
  fi
}

install_project_dependencies() {
  log "Installing server dependencies..."
  cd "${ROOT_DIR}/server"
  npm ci
  npx prisma generate

  log "Installing web dependencies..."
  cd "${ROOT_DIR}/web"
  npm ci
}

run_database_migration() {
  cd "${ROOT_DIR}/server"
  if [[ "${MIGRATION_MODE}" == "skip" ]]; then
    log "MIGRATION_MODE=skip: not running Prisma migrate/db push."
    return 0
  fi

  log "Database migration mode: ${MIGRATION_MODE}"

  if [[ "${MIGRATION_MODE}" == "deploy" ]]; then
    if [[ -d "${ROOT_DIR}/server/prisma/migrations" ]]; then
      npx prisma migrate deploy
    else
      echo "No prisma/migrations directory. Use MIGRATION_MODE=push or MIGRATION_MODE=skip."
      exit 1
    fi
  elif [[ "${MIGRATION_MODE}" == "push" ]]; then
    npx prisma db push
  else
    echo "Invalid MIGRATION_MODE: ${MIGRATION_MODE} (allowed: deploy | push | skip)"
    exit 1
  fi
}

run_seed_super_admin() {
  if [[ "${SEED_SUPER_ADMIN}" != "1" ]]; then
    log "SEED_SUPER_ADMIN=0: skipping super-admin seed."
    return 0
  fi
  if [[ ! -f "${ROOT_DIR}/server/.env" ]]; then
    echo "server/.env is missing. Cannot run DB seed. Add server/.env or run prepare_env_files first."
    exit 1
  fi
  log "Seeding / updating super-admin user (idempotent)..."
  cd "${ROOT_DIR}/server"
  export SEED_SUPER_ADMIN_USERNAME
  export SEED_SUPER_ADMIN_EMAIL
  export SEED_SUPER_ADMIN_PASSWORD
  export SEED_SUPER_ADMIN_FULL_NAME
  npm run seed:super-admin
}

build_projects() {
  log "Building server..."
  cd "${ROOT_DIR}/server"
  npm run build

  log "Building web..."
  cd "${ROOT_DIR}/web"
  npm run build
}

start_with_pm2() {
  cd "${ROOT_DIR}"
  mkdir -p "${ROOT_DIR}/logs"
  export ROOT_DIR APP_NAME_SERVER APP_NAME_WEB WEB_PORT SERVER_PORT

  log "Starting services with PM2..."
  pm2 delete "${APP_NAME_SERVER}" >/dev/null 2>&1 || true
  pm2 delete "${APP_NAME_WEB}" >/dev/null 2>&1 || true
  pm2 start "${ROOT_DIR}/deploy/ecosystem.config.cjs" --env production
  pm2 save
  pm2 startup systemd -u "${USER}" --hp "${HOME}" 2>/dev/null | tail -n 1 | bash || true

  log "PM2 process list:"
  pm2 list
}

show_next_steps() {
  echo
  echo "Deployment completed."
  echo "External access:"
  echo "  Frontend: http://<SERVER_PUBLIC_IP>:${WEB_PORT}"
  echo "  Backend:  http://<SERVER_PUBLIC_IP>:${SERVER_PORT}/api/v1"
  echo
  echo "If your cloud firewall is enabled, open TCP ports ${WEB_PORT} and ${SERVER_PORT}."
}

main() {
  require_file "${ROOT_DIR}/deploy/ecosystem.config.cjs"
  require_file "${ROOT_DIR}/deploy/env/server.env.production.example"
  require_file "${ROOT_DIR}/deploy/env/web.env.production.example"

  install_apt_dependencies
  install_nvm_and_node
  ensure_pm2
  prepare_env_files
  install_project_dependencies
  run_database_migration
  run_seed_super_admin
  build_projects
  start_with_pm2
  show_next_steps
}

main "$@"
