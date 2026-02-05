#!/bin/bash
# 빠른 배포 스크립트 (한 번에 실행)
# 주의: 이 스크립트는 .env.production 파일이 이미 설정되어 있다고 가정합니다.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Dreaming Mech 빠른 배포 마법사               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# 프로젝트 디렉토리
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# 환경 변수 파일 확인
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production 파일이 없습니다!${NC}"
    echo ""
    echo "다음 단계를 따라주세요:"
    echo "1. cp .env.production.example .env.production"
    echo "2. nano .env.production (환경 변수 설정)"
    echo "3. 다시 이 스크립트 실행"
    exit 1
fi

echo -e "${GREEN}📝 배포 설정:${NC}"
echo ""

# 배포 모드 선택
echo "배포 모드를 선택하세요:"
echo "1) Docker PostgreSQL 사용 (간단)"
echo "2) AWS RDS PostgreSQL 사용 (프로덕션 권장)"
read -p "선택 (1 또는 2): " DEPLOY_MODE

if [ "$DEPLOY_MODE" == "2" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo -e "${BLUE}→ RDS 모드 선택됨${NC}"
else
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${BLUE}→ Docker PostgreSQL 모드 선택됨${NC}"
fi

# 도메인 설정
read -p "프론트엔드 도메인 (예: example.com): " FRONTEND_DOMAIN
read -p "백엔드 API 도메인 (예: api.example.com): " BACKEND_DOMAIN

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}배포 요약:${NC}"
echo "  - 프론트엔드: https://$FRONTEND_DOMAIN"
echo "  - 백엔드 API: https://$BACKEND_DOMAIN"
echo "  - Docker Compose 파일: $COMPOSE_FILE"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo ""

read -p "계속하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 1
fi

# Step 1: Docker 빌드 및 실행
echo ""
echo -e "${GREEN}[1/4] 🐳 Docker 컨테이너 빌드 및 시작...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file .env.production down || true
docker-compose -f "$COMPOSE_FILE" --env-file .env.production up -d --build

# Step 2: 헬스 체크 대기
echo ""
echo -e "${GREEN}[2/4] 🏥 컨테이너 헬스 체크 대기...${NC}"
sleep 15
docker-compose ps

# Step 3: Nginx 설정
echo ""
echo -e "${GREEN}[3/4] 🌐 Nginx 설정...${NC}"

# Nginx 설정 파일 복사
sudo cp "$PROJECT_DIR/nginx/dreaming-mech.conf" /etc/nginx/sites-available/dreaming-mech

# 도메인 교체
sudo sed -i "s/yourdomain.com/$FRONTEND_DOMAIN/g" /etc/nginx/sites-available/dreaming-mech
sudo sed -i "s/api.yourdomain.com/$BACKEND_DOMAIN/g" /etc/nginx/sites-available/dreaming-mech

# 심볼릭 링크
sudo ln -sf /etc/nginx/sites-available/dreaming-mech /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Nginx 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx

echo -e "${GREEN}✅ Nginx 설정 완료${NC}"

# Step 4: SSL 인증서 발급 (선택)
echo ""
echo -e "${GREEN}[4/4] 🔒 SSL 인증서 발급${NC}"
read -p "SSL 인증서를 발급하시겠습니까? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "이메일 주소 (만료 알림용): " EMAIL

    echo ""
    echo -e "${YELLOW}SSL 인증서 발급 중... (몇 분 소요될 수 있습니다)${NC}"

    sudo certbot --nginx \
        -d "$FRONTEND_DOMAIN" \
        -d "www.$FRONTEND_DOMAIN" \
        -d "$BACKEND_DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --redirect \
        --non-interactive || {
            echo -e "${YELLOW}⚠️  SSL 인증서 발급에 실패했습니다.${NC}"
            echo "   DNS 설정을 확인하고 나중에 다시 시도하세요:"
            echo "   sudo certbot --nginx -d $FRONTEND_DOMAIN -d www.$FRONTEND_DOMAIN -d $BACKEND_DOMAIN"
        }
else
    echo -e "${YELLOW}⚠️  SSL을 건너뛰었습니다. 나중에 다음 명령어로 설정하세요:${NC}"
    echo "   sudo certbot --nginx -d $FRONTEND_DOMAIN -d www.$FRONTEND_DOMAIN -d $BACKEND_DOMAIN"
fi

# 배포 완료
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 배포가 완료되었습니다! 🎉          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 웹사이트 접속:${NC}"
echo "   - 프론트엔드: https://$FRONTEND_DOMAIN"
echo "   - 백엔드 API: https://$BACKEND_DOMAIN/health"
echo ""
echo -e "${BLUE}📊 상태 확인:${NC}"
echo "   ./scripts/monitor.sh"
echo ""
echo -e "${BLUE}📝 로그 확인:${NC}"
echo "   docker-compose logs -f"
echo ""
echo -e "${BLUE}🔧 유용한 명령어:${NC}"
echo "   - 재시작: docker-compose restart"
echo "   - 중지: docker-compose down"
echo "   - 백업: ./scripts/backup.sh"
echo ""
