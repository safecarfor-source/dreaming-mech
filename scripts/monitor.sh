#!/bin/bash
# 모니터링 스크립트

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Dreaming Mech 시스템 모니터링            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Docker 컨테이너 상태
echo -e "${GREEN}📦 Docker 컨테이너 상태:${NC}"
docker-compose ps
echo ""

# 2. 리소스 사용량
echo -e "${GREEN}💻 리소스 사용량:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

# 3. 디스크 사용량
echo -e "${GREEN}💾 디스크 사용량:${NC}"
df -h / | tail -1 | awk '{print "사용량: " $3 " / " $2 " (" $5 ")"}'
echo ""

# 4. PostgreSQL 연결 테스트
echo -e "${GREEN}🗄️  PostgreSQL 상태:${NC}"
if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL 연결 성공${NC}"
else
    echo -e "${RED}❌ PostgreSQL 연결 실패${NC}"
fi
echo ""

# 5. Backend Health Check
echo -e "${GREEN}🔧 Backend API Health Check:${NC}"
if curl -s http://localhost:3001/health &> /dev/null; then
    echo -e "${GREEN}✅ Backend API 정상${NC}"
else
    echo -e "${RED}❌ Backend API 응답 없음${NC}"
fi
echo ""

# 6. Frontend Health Check
echo -e "${GREEN}🎨 Frontend Health Check:${NC}"
if curl -s http://localhost:3000 &> /dev/null; then
    echo -e "${GREEN}✅ Frontend 정상${NC}"
else
    echo -e "${RED}❌ Frontend 응답 없음${NC}"
fi
echo ""

# 7. 최근 에러 로그 (있는 경우)
echo -e "${YELLOW}📋 최근 에러 로그:${NC}"
docker-compose logs --tail=10 | grep -i error || echo "에러 로그 없음"
echo ""

# 8. Nginx 상태
echo -e "${GREEN}🌐 Nginx 상태:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx 실행 중${NC}"
    echo "연결 수: $(sudo netstat -an | grep :80 | grep ESTABLISHED | wc -l)"
else
    echo -e "${RED}❌ Nginx 중지됨${NC}"
fi
echo ""

# 9. SSL 인증서 만료일 (있는 경우)
if [ -d "/etc/letsencrypt/live" ]; then
    echo -e "${GREEN}🔒 SSL 인증서 만료일:${NC}"
    sudo certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 || echo "인증서 정보 없음"
    echo ""
fi

# 10. 시스템 업타임
echo -e "${GREEN}⏱️  시스템 업타임:${NC}"
uptime -p
echo ""

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo "마지막 업데이트: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "🔄 실시간 로그 보기: docker-compose logs -f"
echo "📊 상세 통계: docker stats"
