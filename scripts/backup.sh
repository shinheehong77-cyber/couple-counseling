#!/bin/bash
set -euo pipefail

# Turso DB 백업 스크립트
# 사용: ./scripts/backup.sh [backup-name]

BACKUP_NAME="${1:-backup-$(date +%Y%m%d-%H%M%S)}"
BACKUP_DIR="./backups"

echo "=== DB 백업: $BACKUP_NAME ==="

mkdir -p "$BACKUP_DIR"

if [ -n "${DATABASE_URL:-}" ] && [[ "$DATABASE_URL" == libsql://* ]]; then
  echo "Turso 프로덕션 DB 백업..."
  turso db shell "${DATABASE_URL}" ".dump" > "$BACKUP_DIR/$BACKUP_NAME.sql" 2>/dev/null || {
    echo "turso CLI 없음. 수동 백업 방법:"
    echo "  turso db shell <db-name> .dump > $BACKUP_DIR/$BACKUP_NAME.sql"
    exit 1
  }
else
  echo "로컬 SQLite DB 백업..."
  cp prisma/dev.db "$BACKUP_DIR/$BACKUP_NAME.db"
fi

echo "✓ 백업 완료: $BACKUP_DIR/$BACKUP_NAME"
