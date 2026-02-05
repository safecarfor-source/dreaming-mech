#!/bin/bash
# 배포 스크립트
# 프로젝트를 빌드하고 Docker Compose로 실행합니다.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo -e "${GREEN}🚀 Dreaming Mech 배포를 시작합니다...${NC}"
echo "프로젝트 디렉토리: $PROJECT_DIR"
echo ""

# 환경 변수 파일 확인
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production 파일이 없습니다!${NC}"
    echo "   .env.production.example을 참고하여 생성하세요."
    exit 1
fi

# Git pull (선택사항 - 주석 제거하여 사용)
# echo -e "${YELLOW}📥 최신 코드를 가져오는 중...${NC}"
# git pull origin main

# 기존 컨테이너 중지 및 제거
echo -e "${YELLOW}🛑 기존 컨테이너를 중지하는 중...${NC}"
docker-compose -f docker-compose.yml down || true

# 오래된 이미지 정리 (선택사항)
echo -e "${YELLOW}🧹 사용하지 않는 Docker 이미지 정리 중...${NC}"
docker image prune -f || true

# Docker 이미지 빌드 및 컨테이너 시작
echo -e "${YELLOW}🏗️  Docker 이미지를 빌드하는 중...${NC}"
docker-compose -f docker-compose.yml --env-file .env.production build --no-cache

echo -e "${YELLOW}🚀 컨테이너를 시작하는 중...${NC}"
docker-compose -f docker-compose.yml --env-file .env.production up -d

# 컨테이너 상태 확인
echo ""
echo -e "${YELLOW}⏳ 컨테이너가 준비될 때까지 대기 중...${NC}"
sleep 10

# 헬스 체크
echo ""
echo -e "${YELLOW}🏥 헬스 체크 중...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose ps | grep -q "healthy\|Up"; then
        echo -e "${GREEN}✅ 컨테이너가 정상적으로 실행 중입니다!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   대기 중... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# 컨테이너 상태 출력
echo ""
echo -e "${GREEN}📊 컨테이너 상태:${NC}"
docker-compose ps

# 로그 확인
echo ""
echo -e "${YELLOW}📝 최근 로그 (Ctrl+C로 종료):${NC}"
echo ""
docker-compose logs --tail=50

echo ""
echo -e "${GREEN}✅ 배포가 완료되었습니다!${NC}"
echo ""
echo "🔍 유용한 명령어:"
echo "   - 로그 확인: docker-compose logs -f"
echo "   - 상태 확인: docker-compose ps"
echo "   - 중지: docker-compose down"
echo "   - 재시작: docker-compose restart"
echo ""
