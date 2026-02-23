#!/bin/bash
# Let's Encrypt SSL 인증서 초기 발급 스크립트
# 사용법: sudo bash scripts/init-letsencrypt.sh yourdomain.com your@email.com
#
# 사전 조건:
# 1. 도메인 DNS가 서버 IP를 가리키고 있어야 함
# 2. Docker + Docker Compose가 설치되어 있어야 함
# 3. nginx/nginx.conf의 HTTP 서버가 동작 중이어야 함

set -e

DOMAIN=${1:?"도메인을 입력해주세요. 사용법: $0 yourdomain.com your@email.com"}
EMAIL=${2:?"이메일을 입력해주세요. 사용법: $0 yourdomain.com your@email.com"}
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== 꿈꾸는정비사 SSL 인증서 발급 ==="
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"
echo ""

# 1. certbot 디렉토리 생성
echo "[1/4] 디렉토리 생성..."
mkdir -p certbot/conf
mkdir -p certbot/www

# 2. nginx가 실행 중인지 확인
echo "[2/4] Nginx 상태 확인..."
if ! docker compose -f $COMPOSE_FILE ps nginx | grep -q "running"; then
  echo "Nginx가 실행되고 있지 않습니다. 먼저 실행해주세요:"
  echo "  docker compose -f $COMPOSE_FILE up -d"
  exit 1
fi

# 3. SSL 인증서 발급
echo "[3/4] SSL 인증서 발급 중..."
docker compose -f $COMPOSE_FILE run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# 4. nginx.conf 업데이트 안내
echo ""
echo "[4/4] 인증서 발급 완료!"
echo ""
echo "=== 다음 단계 ==="
echo "1. nginx/nginx.conf에서 HTTPS 서버 블록의 주석을 해제하세요"
echo "2. 'yourdomain.com'을 '$DOMAIN'으로 변경하세요"
echo "3. HTTP 서버의 'return 301' 줄의 주석을 해제하고, proxy_pass 블록을 주석 처리하세요"
echo "4. Nginx를 재시작하세요:"
echo "   docker compose -f $COMPOSE_FILE restart nginx"
echo ""
echo "=== 완료 ==="
