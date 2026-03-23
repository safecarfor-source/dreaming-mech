#!/bin/bash
# 로컬(Mac)에서 Docker 이미지 빌드 후 서버로 전송하여 배포
# 사용법:
#   ./scripts/deploy-local-build.sh all       # 전체 배포
#   ./scripts/deploy-local-build.sh frontend  # 프론트엔드만
#   ./scripts/deploy-local-build.sh backend   # 백엔드만

set -e

PEM="/Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem"
SERVER="ubuntu@13.209.143.155"
REMOTE_DIR="/home/ubuntu/dreaming-mech"
PROJECT_ROOT="/Users/shinjeayoun/dreaming-mech"

TARGET=${1:-"all"}

# 색상 출력 헬퍼
info()    { echo "[INFO]  $*"; }
success() { echo "[OK]    $*"; }
error()   { echo "[ERROR] $*" >&2; exit 1; }

# PEM 파일 존재 확인
if [ ! -f "$PEM" ]; then
  error "PEM 파일을 찾을 수 없습니다: $PEM"
fi

# 프로젝트 루트 이동
cd "$PROJECT_ROOT"

# ------------------------------------------------------------------
# Frontend 배포
# ------------------------------------------------------------------
deploy_frontend() {
  info "Frontend 빌드 시작..."
  docker build \
    -f frontend/Dockerfile \
    -t dreaming-mech-frontend:latest \
    --build-arg NEXT_PUBLIC_API_URL=https://dreammechaniclab.com/api \
    --build-arg NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=cnw5tzm2de \
    --build-arg NEXT_PUBLIC_KAKAO_OPENCHAT_URL="${NEXT_PUBLIC_KAKAO_OPENCHAT_URL:-}" \
    ./frontend
  success "Frontend 빌드 완료"

  info "Frontend 이미지 저장 중..."
  docker save dreaming-mech-frontend:latest | gzip > /tmp/frontend-image.tar.gz
  success "이미지 저장 완료 ($(du -sh /tmp/frontend-image.tar.gz | cut -f1))"

  info "Frontend 이미지 서버 전송 중..."
  scp -i "$PEM" /tmp/frontend-image.tar.gz "$SERVER":/tmp/
  success "이미지 전송 완료"

  info "Frontend 배포 중..."
  ssh -i "$PEM" "$SERVER" "
    set -e
    cd $REMOTE_DIR
    docker load < /tmp/frontend-image.tar.gz
    docker compose -f docker-compose.prod.yml up -d frontend --no-deps
    rm -f /tmp/frontend-image.tar.gz
  "
  rm -f /tmp/frontend-image.tar.gz
  success "Frontend 배포 완료"
}

# ------------------------------------------------------------------
# Backend 배포
# ------------------------------------------------------------------
deploy_backend() {
  info "Backend 빌드 시작..."
  docker build \
    -f backend/Dockerfile \
    -t dreaming-mech-backend:latest \
    ./backend
  success "Backend 빌드 완료"

  info "Backend 이미지 저장 중..."
  docker save dreaming-mech-backend:latest | gzip > /tmp/backend-image.tar.gz
  success "이미지 저장 완료 ($(du -sh /tmp/backend-image.tar.gz | cut -f1))"

  info "Backend 이미지 서버 전송 중..."
  scp -i "$PEM" /tmp/backend-image.tar.gz "$SERVER":/tmp/
  success "이미지 전송 완료"

  info "Backend 배포 중..."
  ssh -i "$PEM" "$SERVER" "
    set -e
    cd $REMOTE_DIR
    docker load < /tmp/backend-image.tar.gz
    docker compose -f docker-compose.prod.yml up -d backend --no-deps
    rm -f /tmp/backend-image.tar.gz
  "
  rm -f /tmp/backend-image.tar.gz
  success "Backend 배포 완료"
}

# ------------------------------------------------------------------
# 실행
# ------------------------------------------------------------------
case "$TARGET" in
  frontend)
    deploy_frontend
    ;;
  backend)
    deploy_backend
    ;;
  all)
    deploy_backend
    deploy_frontend
    ;;
  *)
    error "알 수 없는 대상: $TARGET  (사용 가능: frontend | backend | all)"
    ;;
esac

# 최종 컨테이너 상태 확인
echo ""
info "현재 컨테이너 상태:"
ssh -i "$PEM" "$SERVER" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""
success "배포 완료!"
