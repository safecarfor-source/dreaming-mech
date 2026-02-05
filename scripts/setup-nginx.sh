#!/bin/bash
# Nginx 설정 스크립트

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🌐 Nginx 설정을 시작합니다...${NC}"

# 프로젝트 디렉토리
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 도메인 입력 받기
read -p "프론트엔드 도메인을 입력하세요 (예: example.com): " FRONTEND_DOMAIN
read -p "백엔드 API 도메인을 입력하세요 (예: api.example.com): " BACKEND_DOMAIN

echo ""
echo -e "${YELLOW}설정 정보:${NC}"
echo "  프론트엔드: $FRONTEND_DOMAIN, www.$FRONTEND_DOMAIN"
echo "  백엔드: $BACKEND_DOMAIN"
echo ""

read -p "계속하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 1
fi

# Nginx 설정 파일 복사 및 도메인 교체
echo -e "${YELLOW}📝 Nginx 설정 파일 생성 중...${NC}"
sudo cp "$PROJECT_DIR/nginx/dreaming-mech.conf" /etc/nginx/sites-available/dreaming-mech

# 도메인 교체
sudo sed -i "s/yourdomain.com/$FRONTEND_DOMAIN/g" /etc/nginx/sites-available/dreaming-mech
sudo sed -i "s/api.yourdomain.com/$BACKEND_DOMAIN/g" /etc/nginx/sites-available/dreaming-mech

# 심볼릭 링크 생성
echo -e "${YELLOW}🔗 사이트 활성화 중...${NC}"
sudo ln -sf /etc/nginx/sites-available/dreaming-mech /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택사항)
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo -e "${YELLOW}🗑️  기본 사이트 비활성화 중...${NC}"
    sudo rm /etc/nginx/sites-enabled/default
fi

# Nginx 설정 테스트
echo -e "${YELLOW}🧪 Nginx 설정 테스트 중...${NC}"
sudo nginx -t

# Nginx 재시작
echo -e "${YELLOW}🔄 Nginx 재시작 중...${NC}"
sudo systemctl restart nginx

echo ""
echo -e "${GREEN}✅ Nginx 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${YELLOW}📝 다음 단계: SSL 인증서 발급${NC}"
echo "   다음 명령어를 실행하세요:"
echo ""
echo "   sudo certbot --nginx -d $FRONTEND_DOMAIN -d www.$FRONTEND_DOMAIN -d $BACKEND_DOMAIN"
echo ""
echo "   인증서 자동 갱신은 이미 설정되어 있습니다."
echo "   확인: sudo systemctl status certbot.timer"
echo ""
