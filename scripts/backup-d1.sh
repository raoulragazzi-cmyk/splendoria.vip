#!/usr/bin/env bash
set -euo pipefail
umask 077

DB_NAME="${1:-splendoria-db}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$OUT_DIR"

BOOKMARK_FILE="$OUT_DIR/${DB_NAME}-${STAMP}.time-travel.txt"
SQL_FILE="$OUT_DIR/${DB_NAME}-${STAMP}.sql"

echo "Recording D1 Time Travel state for: $DB_NAME"
npx wrangler d1 time-travel info "$DB_NAME" > "$BOOKMARK_FILE"

echo "Exporting remote D1 database to: $SQL_FILE"
npx wrangler d1 export "$DB_NAME" --remote --output="$SQL_FILE"

echo "Backup completed."
echo "Bookmark metadata: $BOOKMARK_FILE"
echo "SQL export:        $SQL_FILE"
echo "Store backup files in an encrypted, access-controlled location; they are intentionally excluded from Git."
