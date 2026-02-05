#!/bin/bash
# SSL 인증서 설정 스크립트 (Let's Encrypt)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔒 SSL 인증서 설정을 시작합니다...${NC}"
echo ""

# 도메인 입력 받기
read -p "프론트엔드 도메인을 입력하세요 (예: example.com): " FRONTEND_DOMAIN
read -p "백엔드 API 도메인을 입력하세요 (예: api.example.com): " BACKEND_DOMAIN
read -p "이메일 주소를 입력하세요 (만료 알림용): " EMAIL

echo ""
echo -e "${YELLOW}⚠️  주의사항:${NC}"
echo "   1. 도메인의 A 레코드가 이 서버의 IP를 가리켜야 합니다."
echo "   2. 80번 포트가 열려 있어야 합니다."
echo "   3. Nginx가 실행 중이어야 합니다."
echo ""

read -p "계속하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 1
fi

# Nginx 상태 확인
if ! systemctl is-active --quiet nginx; then
    echo -e "${RED}❌ Nginx가 실행 중이지 않습니다!${NC}"
    echo "   다음 명령어로 Nginx를 시작하세요: sudo systemctl start nginx"
    exit 1
fi

# Certbot 설치 확인
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Certbot 설치 중...${NC}"
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# SSL 인증서 발급
echo -e "${YELLOW}📜 SSL 인증서 발급 중...${NC}"
echo "   이 과정은 몇 분 정도 소요될 수 있습니다."
echo ""

sudo certbot --nginx \
    -d "$FRONTEND_DOMAIN" \
    -d "www.$FRONTEND_DOMAIN" \
    -d "$BACKEND_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --redirect

# 자동 갱신 테스트
echo ""
echo -e "${YELLOW}🔄 자동 갱신 테스트 중...${NC}"
sudo certbot renew --dry-run

# 자동 갱신 타이머 상태 확인
echo ""
echo -e "${YELLOW}⏰ 자동 갱신 타이머 상태:${NC}"
sudo systemctl status certbot.timer --no-pager

echo ""
echo -e "${GREEN}✅ SSL 인증서가 성공적으로 발급되었습니다!${NC}"
echo ""
echo "🔍 인증서 정보:"
echo "   - 발급 기관: Let's Encrypt"
echo "   - 유효 기간: 90일"
echo "   - 자동 갱신: 활성화됨 (매일 2회 확인)"
echo ""
echo "📝 유용한 명령어:"
echo "   - 인증서 상태: sudo certbot certificates"
echo "   - 수동 갱신: sudo certbot renew"
echo "   - 자동 갱신 테스트: sudo certbot renew --dry-run"
echo ""
echo "🌐 웹사이트 접속:"
echo "   - 프론트엔드: https://$FRONTEND_DOMAIN"
echo "   - 백엔드 API: https://$BACKEND_DOMAIN"
echo ""
