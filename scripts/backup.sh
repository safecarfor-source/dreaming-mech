#!/bin/bash
# 데이터베이스 백업 스크립트

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}💾 데이터베이스 백업을 시작합니다...${NC}"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# PostgreSQL 백업
echo -e "${YELLOW}📦 PostgreSQL 데이터 덤프 중...${NC}"
docker-compose exec -T postgres pg_dump -U postgres mechanic_db > "$BACKUP_FILE"

# 압축
echo -e "${YELLOW}🗜️  백업 파일 압축 중...${NC}"
gzip "$BACKUP_FILE"

# 백업 파일 크기 확인
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
echo -e "${GREEN}✅ 백업 완료!${NC}"
echo "   파일: $BACKUP_FILE.gz"
echo "   크기: $BACKUP_SIZE"

# 오래된 백업 파일 삭제 (30일 이상)
echo -e "${YELLOW}🧹 오래된 백업 파일 정리 중...${NC}"
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete
echo "   30일 이상 된 백업 파일이 삭제되었습니다."

# 백업 파일 목록
echo ""
echo -e "${GREEN}📋 현재 백업 파일 목록:${NC}"
ls -lh "$BACKUP_DIR"

echo ""
echo -e "${GREEN}✅ 백업 작업이 완료되었습니다!${NC}"
echo ""
echo "💡 복원 방법:"
echo "   gunzip -c $BACKUP_FILE.gz | docker-compose exec -T postgres psql -U postgres mechanic_db"
