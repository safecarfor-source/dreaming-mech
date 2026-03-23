#!/bin/bash
# 데이터베이스 3단계 백업 + 검증 + 텔레그램 경고 스크립트
#
# ============================================================
# CRON 설정 (crontab -e 에 추가):
# Hourly:  0 * * * *  cd /home/ubuntu/dreaming-mech && ./scripts/backup.sh --hourly --cron >> backups/backup.log 2>&1
# Daily:   0 0 * * *  cd /home/ubuntu/dreaming-mech && ./scripts/backup.sh --daily --cron >> backups/backup.log 2>&1
# Monthly: 0 2 * * *  cd /home/ubuntu/dreaming-mech && ./scripts/backup.sh --monthly --cron >> backups/backup.log 2>&1
# ============================================================
#
# 수동 전체 백업: ./scripts/backup.sh
# 단일 티어:     ./scripts/backup.sh --hourly | --daily | --monthly

set -euo pipefail

# ============================================================
# 기본 설정
# ============================================================
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$BACKUP_DIR/backup.log"
DATE_FULL=$(date +%Y%m%d_%H%M)
DATE_DAY=$(date +%Y%m%d)

HOURLY_DIR="$BACKUP_DIR/hourly"
DAILY_DIR="$BACKUP_DIR/daily"
MONTHLY_DIR="$BACKUP_DIR/monthly"

HOURLY_KEEP=24
DAILY_KEEP=7
MONTHLY_KEEP_DAYS=30

DB_CONTAINER="dreaming-mech-postgres"
DB_USER_APP="app_user"
DB_USER_DUMP="postgres"
DB_NAME="mechanic_db"

IS_CRON=false
RUN_HOURLY=false
RUN_DAILY=false
RUN_MONTHLY=false

# ============================================================
# 인수 파싱
# ============================================================
for arg in "$@"; do
  case "$arg" in
    --cron)    IS_CRON=true ;;
    --hourly)  RUN_HOURLY=true ;;
    --daily)   RUN_DAILY=true ;;
    --monthly) RUN_MONTHLY=true ;;
  esac
done

# 인수 없으면 전체 실행
if [ "$RUN_HOURLY" = false ] && [ "$RUN_DAILY" = false ] && [ "$RUN_MONTHLY" = false ]; then
  RUN_HOURLY=true
  RUN_DAILY=true
  RUN_MONTHLY=true
fi

# ============================================================
# .env에서 텔레그램 설정 로드
# ============================================================
if [ -f "$PROJECT_DIR/.env" ]; then
  TELEGRAM_BOT_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "$PROJECT_DIR/.env" | cut -d= -f2- || true)
  TELEGRAM_CHAT_ID=$(grep '^TELEGRAM_CHAT_ID=' "$PROJECT_DIR/.env" | cut -d= -f2- || true)
fi
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# ============================================================
# 색상 출력 (터미널 전용)
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# 유틸리티 함수
# ============================================================
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg" >> "$LOG_FILE"
  if [ "$IS_CRON" = false ]; then
    echo -e "${2:-$NC}$1${NC}"
  fi
}

log_section() {
  log "-------- $1 --------" "$BLUE"
}

send_telegram() {
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=$1" \
      -d "parse_mode=HTML" > /dev/null 2>&1 || true
  fi
}

# pg_dump 실행 후 gzip 저장 (경로를 인수로 받음)
do_pg_dump() {
  local dest_file="$1"
  docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER_DUMP" "$DB_NAME" \
    | gzip > "$dest_file" 2>> "$LOG_FILE"
}

# ============================================================
# 검증: 핵심 테이블 COUNT 체크
# ============================================================
verify_db() {
  local tier="$1"       # 로그/알림 출력용 티어 이름
  local backup_file="$2"
  local alert=false
  local alert_msg="🚨 <b>[DB 경고] 꿈꾸는정비사 (${tier})</b>%0A%0A"

  log_section "DB 검증 (${tier})"

  check_table() {
    local table="$1"
    local count
    count=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER_APP" -d "$DB_NAME" \
      -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tr -d ' \n')
    log "  검증: $table = ${count:-ERROR}건" "$YELLOW"
    if [ -z "$count" ] || [ "$count" = "0" ]; then
      alert=true
      alert_msg="${alert_msg}❌ $table: ${count:-ERROR}건%0A"
    fi
    echo "${count:-0}"
  }

  local mech iu id gd
  mech=$(check_table "Mechanic")
  iu=$(check_table "IncentiveUser")
  id=$(check_table "IncentiveData")
  gd=$(check_table "GdSlotConfig")

  # GdSlotConfig activeSlot 값 검사 (A 또는 B 여야 함)
  local active_slot
  active_slot=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER_APP" -d "$DB_NAME" \
    -t -c "SELECT \"activeSlot\" FROM \"GdSlotConfig\" LIMIT 1;" 2>/dev/null | tr -d ' \n' || true)

  if [ -n "$active_slot" ] && [ "$active_slot" != "A" ] && [ "$active_slot" != "B" ]; then
    alert=true
    alert_msg="${alert_msg}❌ GdSlotConfig.activeSlot 이상값: '${active_slot}' (A 또는 B 여야 함)%0A"
    log "  경고: GdSlotConfig.activeSlot = '${active_slot}' (비정상)" "$RED"
  else
    log "  검증: GdSlotConfig.activeSlot = '${active_slot:-없음}'" "$YELLOW"
  fi

  if [ "$alert" = true ]; then
    alert_msg="${alert_msg}%0A⏰ $(date '+%Y-%m-%d %H:%M:%S')%0A📁 ${backup_file}%0A%0A즉시 확인 필요!"
    send_telegram "$alert_msg"
    log "경고: 빈 테이블 또는 이상값 감지! 텔레그램 경고 발송" "$RED"
  else
    log "검증 통과: Mechanic=${mech}, IncentiveUser=${iu}, IncentiveData=${id}, GdSlotConfig=${gd}, activeSlot=${active_slot}" "$GREEN"
  fi
}

# ============================================================
# FIFO 정리 함수 (파일 수 기반)
# ============================================================
prune_by_count() {
  local dir="$1"
  local pattern="$2"
  local keep="$3"

  local files
  mapfile -t files < <(ls -t "${dir}/${pattern}" 2>/dev/null || true)
  local total="${#files[@]}"

  if [ "$total" -gt "$keep" ]; then
    local delete_count=$(( total - keep ))
    for (( i = 0; i < delete_count; i++ )); do
      local idx=$(( total - 1 - i ))
      rm -f "${files[$idx]}"
      log "  삭제 (초과): ${files[$idx]}" "$YELLOW"
    done
  fi
}

# ============================================================
# Tier 1: 시간별 백업
# ============================================================
run_hourly() {
  log_section "Tier 1: 시간별 백업 시작"
  mkdir -p "$HOURLY_DIR"

  local dest="$HOURLY_DIR/db_hourly_${DATE_FULL}.sql.gz"

  if do_pg_dump "$dest"; then
    local size
    size=$(du -h "$dest" | cut -f1)
    log "시간별 백업 완료: $dest ($size)" "$GREEN"
  else
    log "시간별 백업 실패!" "$RED"
    send_telegram "🚨 <b>[백업 실패] 꿈꾸는정비사 — Tier 1 (시간별)</b>%0A⏰ $(date '+%Y-%m-%d %H:%M:%S')"
    return 1
  fi

  verify_db "hourly" "$dest"

  # 24개 초과분 삭제
  prune_by_count "$HOURLY_DIR" "db_hourly_*.sql.gz" "$HOURLY_KEEP"
  log "시간별 백업 정리 완료 (최대 ${HOURLY_KEEP}개 유지)" "$GREEN"
}

# ============================================================
# Tier 2: 일별 백업 (최신 시간별 복사)
# ============================================================
run_daily() {
  log_section "Tier 2: 일별 백업 시작"
  mkdir -p "$DAILY_DIR"

  # 최신 시간별 백업 파일 탐색
  local latest_hourly
  latest_hourly=$(ls -t "$HOURLY_DIR"/db_hourly_*.sql.gz 2>/dev/null | head -1 || true)

  if [ -z "$latest_hourly" ]; then
    log "일별 백업 실패: 참조할 시간별 백업 파일 없음" "$RED"
    send_telegram "🚨 <b>[백업 실패] 꿈꾸는정비사 — Tier 2 (일별)</b>%0A원인: 시간별 백업 파일 없음%0A⏰ $(date '+%Y-%m-%d %H:%M:%S')"
    return 1
  fi

  local dest="$DAILY_DIR/db_daily_${DATE_DAY}.sql.gz"
  cp "$latest_hourly" "$dest"

  local size
  size=$(du -h "$dest" | cut -f1)
  log "일별 백업 완료: $dest ($size) (원본: $latest_hourly)" "$GREEN"

  verify_db "daily" "$dest"

  # 7개 초과분 삭제
  prune_by_count "$DAILY_DIR" "db_daily_*.sql.gz" "$DAILY_KEEP"
  log "일별 백업 정리 완료 (최대 ${DAILY_KEEP}개 유지)" "$GREEN"
}

# ============================================================
# Tier 3: 월별/장기 백업 (신규 pg_dump + 텔레그램 알림)
# ============================================================
run_monthly() {
  log_section "Tier 3: 월별 백업 시작"
  mkdir -p "$MONTHLY_DIR"

  local dest="$MONTHLY_DIR/db_monthly_${DATE_DAY}.sql.gz"

  if do_pg_dump "$dest"; then
    local size
    size=$(du -h "$dest" | cut -f1)
    log "월별 백업 완료: $dest ($size)" "$GREEN"
  else
    log "월별 백업 실패!" "$RED"
    send_telegram "🚨 <b>[백업 실패] 꿈꾸는정비사 — Tier 3 (월별)</b>%0A⏰ $(date '+%Y-%m-%d %H:%M:%S')"
    return 1
  fi

  verify_db "monthly" "$dest"

  # 30일 초과 파일 삭제
  find "$MONTHLY_DIR" -name "db_monthly_*.sql.gz" -mtime +${MONTHLY_KEEP_DAYS} -delete
  log "월별 백업 정리 완료 (${MONTHLY_KEEP_DAYS}일 초과 삭제)" "$GREEN"

  # 성공 텔레그램 알림
  local size_final
  size_final=$(du -h "$dest" | cut -f1)
  send_telegram "✅ <b>[백업 성공] 꿈꾸는정비사 — Tier 3 (월별)</b>%0A📁 $(basename "$dest") (${size_final})%0A⏰ $(date '+%Y-%m-%d %H:%M:%S')"
}

# ============================================================
# 메인 실행
# ============================================================
mkdir -p "$BACKUP_DIR" "$HOURLY_DIR" "$DAILY_DIR" "$MONTHLY_DIR"

log "========================================" "$BLUE"
log "백업 스크립트 시작 ($(date '+%Y-%m-%d %H:%M:%S'))" "$BLUE"
log "옵션: hourly=${RUN_HOURLY}, daily=${RUN_DAILY}, monthly=${RUN_MONTHLY}, cron=${IS_CRON}" "$BLUE"
log "========================================" "$BLUE"

[ "$RUN_HOURLY" = true ]  && run_hourly
[ "$RUN_DAILY" = true ]   && run_daily
[ "$RUN_MONTHLY" = true ] && run_monthly

log "========================================" "$BLUE"
log "모든 백업 작업 완료" "$GREEN"
log "========================================" "$BLUE"

if [ "$IS_CRON" = false ]; then
  echo ""
  echo -e "${GREEN}현재 백업 파일 목록:${NC}"
  echo -e "${YELLOW}[Hourly - 최근 5개]${NC}"
  ls -lht "$HOURLY_DIR"/db_hourly_*.sql.gz 2>/dev/null | head -5 || echo "  (없음)"
  echo -e "${YELLOW}[Daily]${NC}"
  ls -lht "$DAILY_DIR"/db_daily_*.sql.gz 2>/dev/null || echo "  (없음)"
  echo -e "${YELLOW}[Monthly - 최근 5개]${NC}"
  ls -lht "$MONTHLY_DIR"/db_monthly_*.sql.gz 2>/dev/null | head -5 || echo "  (없음)"
  echo ""
  echo -e "${GREEN}백업 완료!${NC}"
fi
