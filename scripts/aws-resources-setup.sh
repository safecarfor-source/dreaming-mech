#!/bin/bash
# AWS 리소스 자동 생성 스크립트
# 사전 요구사항: AWS CLI 설치 및 aws configure 완료

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      AWS 리소스 자동 생성 스크립트             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI가 설치되어 있지 않습니다!${NC}"
    echo "   설치 방법: https://aws.amazon.com/cli/"
    exit 1
fi

# AWS 계정 확인
echo -e "${YELLOW}🔍 AWS 계정 확인 중...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ AWS CLI가 설정되어 있지 않습니다!${NC}"
    echo "   다음 명령어로 설정하세요: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS 계정: $AWS_ACCOUNT_ID${NC}"
echo ""

# 프로젝트 이름 입력
read -p "프로젝트 이름 (기본값: dreaming-mech): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-dreaming-mech}

# S3 버킷 이름 (고유해야 함)
BUCKET_NAME="${PROJECT_NAME}-images-$(date +%s)"

# 리전 선택
echo ""
echo "AWS 리전을 선택하세요:"
echo "1) ap-northeast-2 (서울) - 권장"
echo "2) ap-northeast-1 (도쿄)"
echo "3) us-east-1 (버지니아)"
read -p "선택 (1-3): " REGION_CHOICE

case $REGION_CHOICE in
    1) REGION="ap-northeast-2" ;;
    2) REGION="ap-northeast-1" ;;
    3) REGION="us-east-1" ;;
    *) REGION="ap-northeast-2" ;;
esac

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}생성할 리소스:${NC}"
echo "  - 프로젝트: $PROJECT_NAME"
echo "  - 리전: $REGION"
echo "  - S3 버킷: $BUCKET_NAME"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo ""

read -p "계속하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 1
fi

# 로그 파일
LOG_FILE="aws-setup-$(date +%Y%m%d_%H%M%S).log"
echo "" > $LOG_FILE

log() {
    echo "$1" | tee -a $LOG_FILE
}

echo ""
log "═══════════════════════════════════════════════"
log "AWS 리소스 생성 시작: $(date)"
log "═══════════════════════════════════════════════"

# 1. 키페어 생성
echo ""
echo -e "${GREEN}[1/8] 🔑 키페어 생성 중...${NC}"
KEY_NAME="${PROJECT_NAME}-key"

if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}⚠️  키페어가 이미 존재합니다: $KEY_NAME${NC}"
    read -p "기존 키페어를 사용하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "다른 프로젝트 이름을 사용하세요."
        exit 1
    fi
else
    aws ec2 create-key-pair \
      --key-name $KEY_NAME \
      --region $REGION \
      --query 'KeyMaterial' \
      --output text > ${KEY_NAME}.pem

    chmod 400 ${KEY_NAME}.pem
    log "✅ 키페어 생성 완료: ${KEY_NAME}.pem"
    echo -e "${GREEN}✅ 키페어 저장됨: $(pwd)/${KEY_NAME}.pem${NC}"
fi

# 2. 보안 그룹 생성
echo ""
echo -e "${GREEN}[2/8] 🔒 EC2 보안 그룹 생성 중...${NC}"
SG_NAME="${PROJECT_NAME}-sg"

SECURITY_GROUP_ID=$(aws ec2 create-security-group \
  --group-name $SG_NAME \
  --description "Security group for $PROJECT_NAME" \
  --region $REGION \
  --query 'GroupId' \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SG_NAME" \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

log "보안 그룹 ID: $SECURITY_GROUP_ID"

# 내 IP 확인
MY_IP=$(curl -s https://checkip.amazonaws.com)
log "내 IP: $MY_IP"

# 보안 그룹 규칙 추가 (중복 방지)
echo "  - SSH 규칙 추가 (내 IP만)..."
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 22 \
  --cidr ${MY_IP}/32 \
  --region $REGION 2>/dev/null || echo "    (이미 존재)"

echo "  - HTTP 규칙 추가..."
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "    (이미 존재)"

echo "  - HTTPS 규칙 추가..."
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $REGION 2>/dev/null || echo "    (이미 존재)"

log "✅ 보안 그룹 설정 완료"

# 3. EC2 인스턴스 생성
echo ""
echo -e "${GREEN}[3/8] 🖥️  EC2 인스턴스 생성 중...${NC}"

# Ubuntu 22.04 AMI 찾기
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --region $REGION \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

log "AMI ID: $AMI_ID"

# 인스턴스 타입 선택
echo "인스턴스 타입을 선택하세요:"
echo "1) t3.micro (1 vCPU, 1GB RAM) - 프리티어, 테스트용"
echo "2) t3.small (2 vCPU, 2GB RAM) - 최소 권장"
echo "3) t3.medium (2 vCPU, 4GB RAM) - 권장"
read -p "선택 (1-3): " INSTANCE_CHOICE

case $INSTANCE_CHOICE in
    1) INSTANCE_TYPE="t3.micro" ;;
    2) INSTANCE_TYPE="t3.small" ;;
    3) INSTANCE_TYPE="t3.medium" ;;
    *) INSTANCE_TYPE="t3.medium" ;;
esac

echo "  인스턴스 타입: $INSTANCE_TYPE"

INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type $INSTANCE_TYPE \
  --key-name $KEY_NAME \
  --security-group-ids $SECURITY_GROUP_ID \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3","Encrypted":true}}]' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-server}]" \
  --region $REGION \
  --query 'Instances[0].InstanceId' \
  --output text)

log "인스턴스 ID: $INSTANCE_ID"
echo "  인스턴스 시작 대기 중... (약 1-2분)"

aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

log "✅ EC2 인스턴스 생성 완료"
log "   Public IP: $PUBLIC_IP"

# 4. Elastic IP 할당
echo ""
echo -e "${GREEN}[4/8] 🌐 Elastic IP 할당 중...${NC}"

read -p "Elastic IP를 할당하시겠습니까? (인스턴스 재시작 시 IP 유지, 권장) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    EIP_ALLOC_ID=$(aws ec2 allocate-address \
      --region $REGION \
      --query 'AllocationId' \
      --output text)

    ELASTIC_IP=$(aws ec2 describe-addresses \
      --allocation-ids $EIP_ALLOC_ID \
      --region $REGION \
      --query 'Addresses[0].PublicIp' \
      --output text)

    aws ec2 associate-address \
      --instance-id $INSTANCE_ID \
      --allocation-id $EIP_ALLOC_ID \
      --region $REGION

    PUBLIC_IP=$ELASTIC_IP
    log "✅ Elastic IP 할당 완료: $ELASTIC_IP"
else
    log "⏭️  Elastic IP 할당 건너뜀"
fi

# 5. S3 버킷 생성
echo ""
echo -e "${GREEN}[5/8] 🪣 S3 버킷 생성 중...${NC}"

if [ "$REGION" == "us-east-1" ]; then
    aws s3api create-bucket \
      --bucket $BUCKET_NAME \
      --region $REGION
else
    aws s3api create-bucket \
      --bucket $BUCKET_NAME \
      --region $REGION \
      --create-bucket-configuration LocationConstraint=$REGION
fi

log "✅ S3 버킷 생성: $BUCKET_NAME"

# 퍼블릭 액세스 차단
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 암호화 활성화
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

log "✅ S3 보안 설정 완료"

# 6. IAM 사용자 및 액세스 키 생성
echo ""
echo -e "${GREEN}[6/8] 👤 IAM 사용자 생성 중...${NC}"

IAM_USER="${PROJECT_NAME}-s3-user"

aws iam create-user --user-name $IAM_USER 2>/dev/null || log "IAM 사용자가 이미 존재합니다"

# 정책 생성
cat > /tmp/s3-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::$BUCKET_NAME/*",
                "arn:aws:s3:::$BUCKET_NAME"
            ]
        }
    ]
}
EOF

POLICY_ARN=$(aws iam create-policy \
  --policy-name ${PROJECT_NAME}S3Policy \
  --policy-document file:///tmp/s3-policy.json \
  --query 'Policy.Arn' \
  --output text 2>/dev/null || \
  aws iam list-policies \
    --scope Local \
    --query "Policies[?PolicyName=='${PROJECT_NAME}S3Policy'].Arn" \
    --output text)

log "정책 ARN: $POLICY_ARN"

# 사용자에 정책 연결
aws iam attach-user-policy \
  --user-name $IAM_USER \
  --policy-arn $POLICY_ARN 2>/dev/null || log "정책이 이미 연결되어 있습니다"

# 액세스 키 생성
ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name $IAM_USER 2>/dev/null || echo "")

if [ -n "$ACCESS_KEY_OUTPUT" ]; then
    AWS_ACCESS_KEY_ID=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.AccessKeyId')
    AWS_SECRET_ACCESS_KEY=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.SecretAccessKey')
    log "✅ IAM 사용자 및 액세스 키 생성 완료"
else
    echo -e "${YELLOW}⚠️  기존 액세스 키가 있습니다. 기존 키를 사용하거나 IAM 콘솔에서 새 키를 생성하세요.${NC}"
    AWS_ACCESS_KEY_ID="기존_키_또는_IAM_콘솔에서_생성"
    AWS_SECRET_ACCESS_KEY="기존_키_또는_IAM_콘솔에서_생성"
fi

rm /tmp/s3-policy.json

# 7. RDS 생성 (선택사항)
echo ""
echo -e "${GREEN}[7/8] 🗄️  RDS PostgreSQL 생성${NC}"
read -p "RDS PostgreSQL을 생성하시겠습니까? (Docker PostgreSQL 대신 사용, 권장) (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  RDS 보안 그룹 생성 중..."

    RDS_SG_ID=$(aws ec2 create-security-group \
      --group-name ${PROJECT_NAME}-rds-sg \
      --description "RDS security group for $PROJECT_NAME" \
      --region $REGION \
      --query 'GroupId' \
      --output text 2>/dev/null || \
      aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${PROJECT_NAME}-rds-sg" \
        --region $REGION \
        --query 'SecurityGroups[0].GroupId' \
        --output text)

    aws ec2 authorize-security-group-ingress \
      --group-id $RDS_SG_ID \
      --protocol tcp \
      --port 5432 \
      --source-group $SECURITY_GROUP_ID \
      --region $REGION 2>/dev/null || echo "    (보안 그룹 규칙이 이미 존재)"

    echo "  RDS 인스턴스 생성 중... (5-10분 소요)"

    read -s -p "  RDS 마스터 비밀번호 입력 (8자 이상): " DB_PASSWORD
    echo ""

    aws rds create-db-instance \
      --db-instance-identifier ${PROJECT_NAME}-db \
      --db-instance-class db.t3.micro \
      --engine postgres \
      --engine-version 15.4 \
      --master-username postgres \
      --master-user-password "$DB_PASSWORD" \
      --allocated-storage 20 \
      --storage-type gp3 \
      --vpc-security-group-ids $RDS_SG_ID \
      --backup-retention-period 7 \
      --storage-encrypted \
      --db-name mechanic_db \
      --no-publicly-accessible \
      --region $REGION 2>/dev/null || echo "RDS 인스턴스가 이미 존재합니다"

    echo "  RDS 생성 완료 대기 중..."
    aws rds wait db-instance-available \
      --db-instance-identifier ${PROJECT_NAME}-db \
      --region $REGION 2>/dev/null || true

    RDS_ENDPOINT=$(aws rds describe-db-instances \
      --db-instance-identifier ${PROJECT_NAME}-db \
      --region $REGION \
      --query 'DBInstances[0].Endpoint.Address' \
      --output text 2>/dev/null || echo "생성 대기 중...")

    log "✅ RDS 생성 완료 (또는 진행 중)"
    log "   RDS Endpoint: $RDS_ENDPOINT"
    log "   DATABASE_URL=postgresql://postgres:$DB_PASSWORD@$RDS_ENDPOINT:5432/mechanic_db"
else
    log "⏭️  RDS 생성 건너뜀 (Docker PostgreSQL 사용)"
    RDS_ENDPOINT="Docker PostgreSQL 사용"
fi

# 8. 요약
echo ""
echo -e "${GREEN}[8/8] 📋 리소스 생성 완료!${NC}"

log ""
log "═══════════════════════════════════════════════"
log "생성된 리소스 요약"
log "═══════════════════════════════════════════════"
log ""
log "🔑 SSH 접속:"
log "   ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
log ""
log "🖥️  EC2 인스턴스:"
log "   인스턴스 ID: $INSTANCE_ID"
log "   Public IP: $PUBLIC_IP"
log "   보안 그룹: $SECURITY_GROUP_ID"
log ""
log "🪣 S3 버킷:"
log "   AWS_S3_BUCKET=$BUCKET_NAME"
log "   AWS_REGION=$REGION"
log ""
log "👤 IAM 사용자:"
log "   AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
log "   AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
log ""

if [ "$RDS_ENDPOINT" != "Docker PostgreSQL 사용" ]; then
    log "🗄️  RDS PostgreSQL:"
    log "   DATABASE_URL=postgresql://postgres:****@$RDS_ENDPOINT:5432/mechanic_db"
    log ""
fi

log "📝 로그 파일: $LOG_FILE"
log ""
log "═══════════════════════════════════════════════"

# .env.production 예시 생성
cat > .env.production.example << EOF
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=강력한비밀번호
POSTGRES_DB=mechanic_db

# 또는 RDS 사용 시
# DATABASE_URL=postgresql://postgres:비밀번호@$RDS_ENDPOINT:5432/mechanic_db

# Backend
JWT_SECRET=$(openssl rand -hex 32)
NAVER_MAP_CLIENT_ID=네이버_클라이언트_ID
NAVER_MAP_CLIENT_SECRET=네이버_클라이언트_시크릿

# AWS S3
AWS_S3_BUCKET=$BUCKET_NAME
AWS_REGION=$REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Admin
ADMIN_PASSWORD=관리자비밀번호
EOF

echo ""
echo -e "${BLUE}다음 단계:${NC}"
echo "1. 도메인 DNS 설정 (A 레코드 → $PUBLIC_IP)"
echo "2. EC2 접속: ssh -i ${KEY_NAME}.pem ubuntu@$PUBLIC_IP"
echo "3. .env.production 파일 생성 (.env.production.example 참고)"
echo "4. 배포 스크립트 실행"
echo ""
echo -e "${GREEN}✅ 모든 리소스 생성이 완료되었습니다!${NC}"
