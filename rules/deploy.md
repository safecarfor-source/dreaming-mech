# 배포 절차

## 배포 흐름
1. 로컬에서 코드 수정
2. 로컬 서버 실행 → 대장님이 localhost:3000에서 직접 확인
3. 확인 완료 후 git push origin main
4. SSH 서버 접속 → git pull → docker compose build → up -d

## 서버 정보
- EC2: ubuntu@13.209.143.155
- PEM: `/Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem`
- 서버 경로: `/home/ubuntu/dreaming-mech`
- SSH: `ssh -i "/Users/shinjeayoun/Documents/문서/dreaming-mech-key.pem" ubuntu@13.209.143.155`

## 단독 배포 명령어
- frontend만: `docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend --no-deps`
- backend만: `docker compose -f docker-compose.prod.yml build backend && docker compose -f docker-compose.prod.yml up -d backend --no-deps`

## Docker BuildKit 캐시 문제 (2026-03-21 교훈)
배포 후 반영 안 되면 의심 순서:
1. 서버 소스코드 확인 (`grep`으로 서버 파일 직접 확인)
2. Docker 컨테이너 안의 빌드 결과 확인 (`docker exec ... cat`)
3. Nginx 캐시 삭제 (`sudo rm -rf /var/cache/nginx/*`)
4. BuildKit 캐시 삭제 (`docker builder prune -af`)
5. 브라우저 강제 새로고침 (Cmd+Shift+R)

### 프론트엔드 배포 안전 명령어 (정석)
```bash
docker builder prune -af
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend --force-recreate
sudo rm -rf /var/cache/nginx/* && sudo nginx -s reload
```

## 배포 전략
- 묶어서 배포: 비긴급 작업은 여러 개 모아서 빌드 1번 → 배포 1번
- 버그 수정은 즉시 단독 배포
- 배포 후 반드시 직접 접속해서 확인
