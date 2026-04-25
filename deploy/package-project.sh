#!/usr/bin/env bash
set -euo pipefail

# macOS: avoid stuffing xattr blobs into the tarball (reduces LIBARCHIVE.xattr noise on Linux).
export COPYFILE_DISABLE=1

PROJECT_NAME="duanruo-exam-system2"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
# Where the .tar.gz is written (default: dist-deploy at repo root).
# IMPORTANT: never set OUTPUT_DIR=web|server|deploy — tar would exclude that path and the package would be incomplete.
OUTPUT_DIR="${OUTPUT_DIR:-dist-deploy}"
forbad="web server deploy .git"
for d in ${forbad}; do
  if [[ "${OUTPUT_DIR}" == "${d}" ]]; then
    echo "Refusing to use OUTPUT_DIR=${OUTPUT_DIR}: would exclude a source directory from the archive."
    echo "Use the default (dist-deploy) or e.g. OUTPUT_DIR=dist-deploy"
    exit 1
  fi
done
# Must match the directory we exclude from the tar (do not use web/server as OUTPUT_DIR).
EXCLUDE_DIR="${OUTPUT_DIR:-dist-deploy}"
ARCHIVE_NAME="${PROJECT_NAME}-${TIMESTAMP}.tar.gz"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "${ROOT_DIR}/${OUTPUT_DIR}"

ARCHIVE_PATH="${ROOT_DIR}/${OUTPUT_DIR}/${ARCHIVE_NAME}"

echo "[1/2] Packaging project files..."
echo "  (excluding ${EXCLUDE_DIR}/ so the archive is not packed into itself)"
if [[ -f "${ROOT_DIR}/server/.env" ]]; then
  echo "  + will include server/.env (same DATABASE_URL / secrets as your local — keep this archive private)"
else
  echo "  ! server/.env not found — on the server, deploy will create server/.env from a template or you must scp .env"
fi
if [[ -f "${ROOT_DIR}/web/.env.production" ]]; then
  echo "  + will include web/.env.production if present"
fi
if [[ ! -d "${ROOT_DIR}/web" || ! -f "${ROOT_DIR}/web/package.json" ]]; then
  echo "ERROR: web/ (Next.js app) is missing from ${ROOT_DIR}. Clone the full repo before packaging."
  exit 1
fi

# Write to a temp file under /tmp first, then move — avoids any edge case where
# the output path could still be scanned while the tarball is being created.
TMP_ARCHIVE="$(mktemp "/tmp/${ARCHIVE_NAME}.XXXXXX")"
trap 'rm -f "${TMP_ARCHIVE}"' EXIT

tar \
  --exclude=".git" \
  --exclude=".next" \
  --exclude="**/node_modules" \
  --exclude="**/dist" \
  --exclude="coverage" \
  --exclude="test-results" \
  --exclude="playwright-report" \
  --exclude=".DS_Store" \
  --exclude="./${EXCLUDE_DIR}" \
  --exclude="${EXCLUDE_DIR}" \
  -czf "${TMP_ARCHIVE}" \
  -C "${ROOT_DIR}" \
  .

mv "${TMP_ARCHIVE}" "${ARCHIVE_PATH}"
trap - EXIT

echo "[2/2] Package created:"
echo "  ${ARCHIVE_PATH}"
echo
echo "Copy this package to Ubuntu server, then run (paths are relative to extract dir):"
echo "  mkdir -p /opt/${PROJECT_NAME} && tar -xzf ${ARCHIVE_NAME} -C /opt/${PROJECT_NAME}"
echo "  cd /opt/${PROJECT_NAME}"
echo "  SKIP_APT=1 bash deploy/install-and-deploy.sh"
