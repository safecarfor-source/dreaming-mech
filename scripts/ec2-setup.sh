#!/bin/bash
# EC2 인스턴스 초기 설정 스크립트
# Ubuntu 22.04 LTS 기준

set -e

echo "🚀 EC2 인스턴스 초기 설정을 시작합니다..."

# 시스템 업데이트
echo "📦 시스템 패키지 업데이트 중..."
sudo apt update
sudo apt upgrade -y

# Docker 설치
echo "🐳 Docker 설치 중..."
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Docker Compose 설치
echo "🐙 Docker Compose 설치 중..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 현재 사용자를 docker 그룹에 추가
echo "👤 사용자를 docker 그룹에 추가 중..."
sudo usermod -aG docker $USER

# Git 설치
echo "📚 Git 설치 중..."
sudo apt install -y git

# Nginx 설치
echo "🌐 Nginx 설치 중..."
sudo apt install -y nginx

# Certbot (Let's Encrypt) 설치
echo "🔒 Certbot 설치 중..."
sudo apt install -y certbot python3-certbot-nginx

# 방화벽 설정
echo "🔥 UFW 방화벽 설정 중..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Node.js 설치 (관리 도구용 - 선택사항)
echo "📗 Node.js 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 로그 디렉토리 생성
echo "📁 로그 디렉토리 생성 중..."
sudo mkdir -p /var/log/dreaming-mech
sudo chown -R $USER:$USER /var/log/dreaming-mech

# Docker 서비스 시작
echo "🔄 Docker 서비스 시작 중..."
sudo systemctl start docker
sudo systemctl enable docker

# 설치 확인
echo ""
echo "✅ 설치 완료! 버전 확인:"
docker --version
docker-compose --version
nginx -v
certbot --version
git --version
node --version
npm --version

echo ""
echo "⚠️  중요: docker 그룹 적용을 위해 로그아웃 후 다시 로그인하세요."
echo "   또는 다음 명령어를 실행하세요: newgrp docker"
echo ""
echo "📝 다음 단계:"
echo "   1. 프로젝트 클론: git clone https://github.com/your-username/dreaming-mech.git"
echo "   2. 환경 변수 설정: cd dreaming-mech && nano .env.production"
echo "   3. Nginx 설정: sudo cp nginx/dreaming-mech.conf /etc/nginx/sites-available/"
echo "   4. 배포 실행: ./scripts/deploy.sh"
