#!/bin/bash
# 데이터베이스 백업 + 검증 + 텔레그램 경고 스크립트
# 수동: ./scripts/backup.sh
# cron: 0 2 * * * cd /home/ubuntu/dreaming-mech && ./scripts/backup.sh --cron >> /home/ubuntu/dreaming-mech/backups/backup.log 2>&1

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$BACKUP_DIR/backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
IS_CRON=false

# .env에서 텔레그램 설정 로드
if [ -f "$PROJECT_DIR/.env" ]; then
  TELEGRAM_BOT_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "$PROJECT_DIR/.env" | cut -d= -f2-)
  TELEGRAM_CHAT_ID=$(grep '^TELEGRAM_CHAT_ID=' "$PROJECT_DIR/.env" | cut -d= -f2-)
fi

[ "$1" = "--cron" ] && IS_CRON=true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  local msg="[$(date '+%a %b %d %H:%M:%S %Z %Y')] $1"
  echo "$msg" >> "$LOG_FILE"
  [ "$IS_CRON" = false ] && echo -e "$2$1${NC}"
}

send_telegram() {
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" -d "text=$1" -d "parse_mode=HTML" > /dev/null 2>&1 || true
  fi
}

mkdir -p "$BACKUP_DIR"
log "백업 시작..." "$GREEN"

# PostgreSQL 백업
docker exec dreaming-mech-postgres pg_dump -U postgres mechanic_db > "$BACKUP_FILE" 2>> "$LOG_FILE"
gzip "$BACKUP_FILE"
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
log "백업 완료: $BACKUP_FILE.gz ($BACKUP_SIZE)" "$GREEN"

# ========================================
# 백업 검증: 핵심 테이블 COUNT 체크
# ========================================
ALERT=false
ALERT_MSG="🚨 <b>[DB 경고] 꿈꾸는정비사</b>%0A%0A"

check_table() {
  local table="$1"
  local count
  count=$(docker exec dreaming-mech-postgres psql -U app_user -d mechanic_db -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' ')
  log "검증: $table = ${count:-ERROR}건" "$YELLOW"
  if [ "$count" = "0" ] || [ -z "$count" ]; then
    ALERT=true
    ALERT_MSG="${ALERT_MSG}❌ $table: ${count:-ERROR}건%0A"
  fi
  echo "$count"
}

MECH=$(check_table "Mechanic")
IU=$(check_table "IncentiveUser")
ID=$(check_table "IncentiveData")

if [ "$ALERT" = true ]; then
  ALERT_MSG="${ALERT_MSG}%0A⏰ $(date '+%Y-%m-%d %H:%M:%S')%0A📁 $BACKUP_FILE.gz%0A%0A즉시 확인 필요!"
  send_telegram "$ALERT_MSG"
  log "⚠️  빈 테이블 감지! 텔레그램 경고 발송" "$RED"
else
  log "✅ 검증 통과: Mechanic=${MECH}, IncentiveUser=${IU}, IncentiveData=${ID}" "$GREEN"
fi

# 30일 초과 백업 삭제
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete
log "오래된 백업 정리 완료" "$GREEN"

if [ "$IS_CRON" = false ]; then
  echo ""
  echo -e "${GREEN}📋 현재 백업 파일:${NC}"
  ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  (없음)"
  echo ""
  echo -e "${GREEN}✅ 백업 완료!${NC}"
fi
