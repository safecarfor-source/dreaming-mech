#!/bin/bash
# 데이터베이스 복원 스크립트

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}💾 데이터베이스 복원${NC}"
echo ""

# 백업 파일 목록 표시
echo -e "${GREEN}사용 가능한 백업 파일:${NC}"
ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null || {
    echo -e "${RED}❌ 백업 파일이 없습니다!${NC}"
    exit 1
}

echo ""
read -p "복원할 백업 파일명을 입력하세요: " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}❌ 파일을 찾을 수 없습니다: $BACKUP_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${RED}⚠️  경고: 현재 데이터베이스의 모든 데이터가 삭제됩니다!${NC}"
read -p "정말 복원하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "취소되었습니다."
    exit 0
fi

# 데이터베이스 재생성
echo -e "${YELLOW}🗑️  기존 데이터베이스 삭제 중...${NC}"
docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS mechanic_db;"
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE mechanic_db;"

# 백업 복원
echo -e "${YELLOW}📥 백업 파일 복원 중...${NC}"
gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | docker-compose exec -T postgres psql -U postgres mechanic_db

echo ""
echo -e "${GREEN}✅ 데이터베이스 복원이 완료되었습니다!${NC}"
echo ""
echo "🔄 애플리케이션을 재시작하세요:"
echo "   docker-compose restart backend"
