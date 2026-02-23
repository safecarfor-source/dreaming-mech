#!/bin/bash
# 한국타이어 티스테이션 인천대공원점 업데이트 + 중복 삭제 스크립트
# 사용법: bash scripts/update-mechanic.sh

API_URL="http://13.209.143.155:3001"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="RnaRnsmswjdqltk1@"

echo "=== 1. 어드민 로그인 ==="
LOGIN_RESPONSE=$(curl -s -c cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$API_URL/auth/login")
echo "로그인 응답: $LOGIN_RESPONSE"

echo ""
echo "=== 2. 전체 정비소 목록 조회 ==="
MECHANICS=$(curl -s -b cookies.txt "$API_URL/mechanics")
echo "$MECHANICS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
mechanics = data.get('data', [])
print(f'총 {len(mechanics)}개 정비소:')
print('-' * 60)
for m in mechanics:
    name = m.get('name', '')
    mid = m.get('id', '')
    location = m.get('location', '')
    print(f'  ID: {mid} | {name} | {location}')
print('-' * 60)

# 대상 찾기
keep_id = None
delete_id = None
for m in mechanics:
    name = m.get('name', '')
    if '한국타이어' in name and '인천대공원' in name:
        keep_id = m['id']
        print(f'>>> 유지할 정비소: ID {keep_id} - {name}')
    elif '티스테이션' in name and '인천대공원' in name and '한국타이어' not in name:
        delete_id = m['id']
        print(f'>>> 삭제할 정비소: ID {delete_id} - {name}')

# ID를 파일에 저장
if keep_id:
    with open('/tmp/keep_id.txt', 'w') as f: f.write(str(keep_id))
if delete_id:
    with open('/tmp/delete_id.txt', 'w') as f: f.write(str(delete_id))
"

KEEP_ID=$(cat /tmp/keep_id.txt 2>/dev/null)
DELETE_ID=$(cat /tmp/delete_id.txt 2>/dev/null)

if [ -z "$KEEP_ID" ]; then
  echo "ERROR: '한국타이어 티스테이션 인천대공원점'을 찾을 수 없습니다."
  echo "위 목록에서 ID를 확인하고 수동으로 입력하세요:"
  read -p "유지할 정비소 ID: " KEEP_ID
  read -p "삭제할 정비소 ID: " DELETE_ID
fi

echo ""
echo "=== 3. 중복 정비소 삭제 (ID: $DELETE_ID) ==="
if [ -n "$DELETE_ID" ]; then
  DELETE_RESPONSE=$(curl -s -b cookies.txt -X DELETE "$API_URL/mechanics/$DELETE_ID")
  echo "삭제 응답: $DELETE_RESPONSE"
else
  echo "삭제할 정비소가 없습니다 (이미 삭제됨 또는 미발견)"
fi

echo ""
echo "=== 4. 한국타이어 티스테이션 인천대공원점 업데이트 (ID: $KEEP_ID) ==="
UPDATE_RESPONSE=$(curl -s -b cookies.txt \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{
    "name": "한국타이어 티스테이션 인천대공원점",
    "location": "남동구",
    "phone": "032-464-8333",
    "address": "인천광역시 남동구 수인로 3566, 1~2층",
    "description": "한국타이어앤테크놀로지 공식 프랜차이즈 매장. 25년 이상 운영, 매년 5,000대 이상 정비. EV(전기차) 특화점, 수입차 정비 특화점. 타이어 판매 및 교체, 휠 얼라인먼트, 엔진오일 교환, 브레이크패드 교체, 배터리 교체, 경정비 전반. 픽업 & 딜리버리 서비스, 무상 차량 점검 제공.",
    "mapLat": 37.4284,
    "mapLng": 126.7548,
    "operatingHours": {
      "mon": {"open": "08:30", "close": "18:30"},
      "tue": {"open": "08:30", "close": "18:30"},
      "wed": {"open": "08:30", "close": "18:30"},
      "thu": {"open": "08:30", "close": "18:30"},
      "fri": {"open": "08:30", "close": "18:30"},
      "sat": {"open": "08:30", "close": "17:00"},
      "sun": null
    },
    "specialties": [
      "타이어 교체",
      "휠 얼라인먼트",
      "엔진오일 교환",
      "브레이크패드 교체",
      "배터리 교체",
      "와이퍼 교체",
      "실내필터 교체",
      "경정비"
    ],
    "parkingAvailable": true,
    "paymentMethods": ["현금", "카드", "인천e음"],
    "holidays": {
      "type": "weekly",
      "days": ["sun"],
      "description": "일요일 및 공휴일 휴무"
    }
  }' \
  "$API_URL/mechanics/$KEEP_ID")
echo "업데이트 응답: $UPDATE_RESPONSE"

echo ""
echo "=== 5. 업데이트 확인 ==="
VERIFY=$(curl -s -b cookies.txt "$API_URL/mechanics/$KEEP_ID")
echo "$VERIFY" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'이름: {data.get(\"name\", \"\")}')
print(f'주소: {data.get(\"address\", \"\")}')
print(f'전화: {data.get(\"phone\", \"\")}')
print(f'위치: {data.get(\"location\", \"\")}')
print(f'영업시간: {json.dumps(data.get(\"operatingHours\", {}), ensure_ascii=False)}')
print(f'전문분야: {data.get(\"specialties\", [])}')
print(f'주차: {data.get(\"parkingAvailable\", None)}')
print(f'결제수단: {data.get(\"paymentMethods\", [])}')
"

# 쿠키 파일 정리
rm -f cookies.txt /tmp/keep_id.txt /tmp/delete_id.txt

echo ""
echo "=== 완료! ==="
