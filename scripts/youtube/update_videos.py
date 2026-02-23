"""
꿈꾸는정비사 YouTube 영상 설명란 + 고정댓글 일괄 수정 스크립트

사용법:
1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
2. client_secret.json 파일을 이 폴더에 저장
3. pip install -r requirements.txt
4. python update_videos.py

첫 실행 시 브라우저가 열리며 Google 로그인 요청 → 허용하면 토큰 저장됨
이후 실행부터는 자동으로 처리됩니다.
"""

import os
import sys
import time
import json
from datetime import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# ============================================================
# 설정
# ============================================================

# YouTube Data API 스코프 (영상 수정 + 댓글 작성)
SCOPES = [
    'https://www.googleapis.com/auth/youtube.force-ssl',
]

# 설명란 앞에 추가할 문구
DESCRIPTION_PREFIX = """🔧 검증된 전국 정비소 찾기 → https://dreammechaniclab.com
📞 정비소 등록/문의 → https://dreammechaniclab.com/inquiry

"""

# 고정댓글 내용
PINNED_COMMENT_TEXT = "📌 영상 속 정비소 & 전국 검증된 정비소 찾기 → dreammechaniclab.com"

# 이미 추가된 영상을 건너뛰기 위한 체크 문구
SKIP_CHECK = "dreammechaniclab.com/inquiry"

# 처리 기록 파일
LOG_FILE = "update_log.json"

# API 요청 간 대기 시간 (초) - 할당량 초과 방지
DELAY_BETWEEN_REQUESTS = 1.5


# ============================================================
# 인증
# ============================================================

def get_authenticated_service():
    """OAuth 2.0 인증 후 YouTube API 서비스 반환"""
    creds = None
    token_file = os.path.join(os.path.dirname(__file__), 'token.json')
    client_secret_file = os.path.join(os.path.dirname(__file__), 'client_secret.json')

    # 기존 토큰 확인
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)

    # 토큰이 없거나 만료된 경우
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 토큰 갱신 중...")
            creds.refresh(Request())
        else:
            if not os.path.exists(client_secret_file):
                print("❌ client_secret.json 파일이 없습니다!")
                print("")
                print("📋 설정 방법:")
                print("1. https://console.cloud.google.com 접속")
                print("2. 프로젝트 생성 (또는 기존 프로젝트 선택)")
                print("3. 'API 및 서비스' > '라이브러리' > 'YouTube Data API v3' 사용 설정")
                print("4. 'API 및 서비스' > 'OAuth 동의 화면' 설정 (외부, 테스트 사용자에 본인 이메일 추가)")
                print("5. 'API 및 서비스' > '사용자 인증 정보' > 'OAuth 2.0 클라이언트 ID 만들기'")
                print("   - 애플리케이션 유형: '데스크톱 앱'")
                print("6. JSON 다운로드 → 이 폴더에 'client_secret.json'으로 저장")
                sys.exit(1)

            print("🔑 브라우저에서 Google 로그인을 진행해주세요...")
            flow = InstalledAppFlow.from_client_secrets_file(client_secret_file, SCOPES)
            creds = flow.run_local_server(port=0)

        # 토큰 저장
        with open(token_file, 'w') as token:
            token.write(creds.to_json())
        print("✅ 인증 완료! 토큰이 저장되었습니다.")

    return build('youtube', 'v3', credentials=creds)


# ============================================================
# 처리 기록
# ============================================================

def load_log():
    """이전 처리 기록 로드"""
    log_path = os.path.join(os.path.dirname(__file__), LOG_FILE)
    if os.path.exists(log_path):
        with open(log_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"updated_descriptions": [], "pinned_comments": [], "errors": []}


def save_log(log):
    """처리 기록 저장"""
    log_path = os.path.join(os.path.dirname(__file__), LOG_FILE)
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


# ============================================================
# 영상 목록 가져오기
# ============================================================

def get_all_videos(youtube):
    """채널의 모든 공개/비공개 영상 목록 가져오기"""
    videos = []
    next_page_token = None

    print("📋 영상 목록을 가져오는 중...")

    while True:
        # 내 채널의 업로드 목록 가져오기
        request = youtube.channels().list(
            part='contentDetails',
            mine=True
        )
        response = request.execute()

        if not response.get('items'):
            print("❌ 채널 정보를 찾을 수 없습니다.")
            return []

        uploads_playlist_id = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        break

    # 업로드 재생목록에서 모든 영상 가져오기
    while True:
        request = youtube.playlistItems().list(
            part='snippet,contentDetails',
            playlistId=uploads_playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        response = request.execute()

        for item in response.get('items', []):
            video_id = item['contentDetails']['videoId']
            title = item['snippet']['title']
            videos.append({
                'id': video_id,
                'title': title,
            })

        next_page_token = response.get('nextPageToken')
        if not next_page_token:
            break

        time.sleep(DELAY_BETWEEN_REQUESTS)

    print(f"📊 총 {len(videos)}개 영상을 찾았습니다.")
    return videos


# ============================================================
# 설명란 수정
# ============================================================

def update_video_description(youtube, video_id, log):
    """영상 설명란 앞에 플랫폼 링크 추가"""

    # 이미 처리된 영상 건너뛰기
    if video_id in log['updated_descriptions']:
        return "skip"

    try:
        # 현재 영상 정보 가져오기
        request = youtube.videos().list(
            part='snippet,status',
            id=video_id
        )
        response = request.execute()

        if not response.get('items'):
            return "not_found"

        video = response['items'][0]
        snippet = video['snippet']
        current_description = snippet.get('description', '')

        # 이미 링크가 포함되어 있는지 확인
        if SKIP_CHECK in current_description:
            log['updated_descriptions'].append(video_id)
            save_log(log)
            return "already_has_link"

        # 새 설명란 = 플랫폼 링크 + 기존 내용
        new_description = DESCRIPTION_PREFIX + current_description

        # 설명란 업데이트
        snippet['description'] = new_description

        update_request = youtube.videos().update(
            part='snippet',
            body={
                'id': video_id,
                'snippet': {
                    'title': snippet['title'],
                    'description': new_description,
                    'tags': snippet.get('tags', []),
                    'categoryId': snippet['categoryId'],
                }
            }
        )
        update_request.execute()

        log['updated_descriptions'].append(video_id)
        save_log(log)
        return "updated"

    except HttpError as e:
        error_msg = f"영상 {video_id}: {str(e)}"
        log['errors'].append(error_msg)
        save_log(log)
        return "error"


# ============================================================
# 고정댓글 작성
# ============================================================

def post_pinned_comment(youtube, video_id, log):
    """영상에 고정댓글 작성"""

    # 이미 처리된 영상 건너뛰기
    if video_id in log['pinned_comments']:
        return "skip"

    try:
        # 기존 댓글 확인 (이미 같은 내용의 고정댓글이 있는지)
        existing_comments = youtube.commentThreads().list(
            part='snippet',
            videoId=video_id,
            maxResults=5,
            order='relevance'
        ).execute()

        for thread in existing_comments.get('items', []):
            comment_text = thread['snippet']['topLevelComment']['snippet']['textOriginal']
            if 'dreammechaniclab.com' in comment_text:
                log['pinned_comments'].append(video_id)
                save_log(log)
                return "already_exists"

        # 새 댓글 작성
        comment_response = youtube.commentThreads().insert(
            part='snippet',
            body={
                'snippet': {
                    'videoId': video_id,
                    'topLevelComment': {
                        'snippet': {
                            'textOriginal': PINNED_COMMENT_TEXT
                        }
                    }
                }
            }
        ).execute()

        comment_id = comment_response['snippet']['topLevelComment']['id']

        # 댓글 고정 (YouTube API로 직접 고정은 불가 - 수동 필요)
        # Note: YouTube Data API v3에서는 댓글 고정을 직접 지원하지 않습니다.
        # 댓글은 작성되지만, 고정은 YouTube Studio에서 수동으로 해야 합니다.
        # 다만 채널 소유자의 댓글은 자동으로 상단에 표시됩니다.

        log['pinned_comments'].append(video_id)
        save_log(log)
        return "posted"

    except HttpError as e:
        if 'commentsDisabled' in str(e):
            log['pinned_comments'].append(video_id)
            save_log(log)
            return "comments_disabled"
        error_msg = f"댓글 {video_id}: {str(e)}"
        log['errors'].append(error_msg)
        save_log(log)
        return "error"


# ============================================================
# 메인 실행
# ============================================================

def main():
    print("=" * 60)
    print("🔧 꿈꾸는정비사 YouTube 영상 일괄 수정 스크립트")
    print("=" * 60)
    print()

    # 인증
    youtube = get_authenticated_service()

    # 기존 로그 로드
    log = load_log()

    # 모든 영상 가져오기
    videos = get_all_videos(youtube)

    if not videos:
        print("❌ 영상을 찾을 수 없습니다.")
        return

    # ---- 1단계: 댓글 먼저 ----
    print()
    print(f"💬 고정댓글 작성 시작 (이미 처리: {len(log['pinned_comments'])}개)")
    print("-" * 60)

    # 고정댓글 작성
    comment_stats = {"posted": 0, "already_exists": 0, "skip": 0, "comments_disabled": 0, "error": 0}

    for i, video in enumerate(videos):
        result = post_pinned_comment(youtube, video['id'], log)
        comment_stats[result] = comment_stats.get(result, 0) + 1

        status_emoji = {
            "posted": "✅", "already_exists": "⏩", "skip": "⏭️",
            "comments_disabled": "🚫", "error": "❌"
        }
        emoji = status_emoji.get(result, "?")
        print(f"  [{i+1}/{len(videos)}] {emoji} {video['title'][:40]}... → {result}")

        if result in ("posted",):
            time.sleep(DELAY_BETWEEN_REQUESTS)

    print()
    print(f"💬 고정댓글 작성 완료!")
    print(f"   ✅ 작성: {comment_stats['posted']}개")
    print(f"   ⏩ 이미 있음: {comment_stats['already_exists']}개")
    print(f"   ⏭️  건너뜀: {comment_stats['skip']}개")
    print(f"   🚫 댓글 비활성: {comment_stats['comments_disabled']}개")
    print(f"   ❌ 에러: {comment_stats['error']}개")

    # ---- 2단계: 설명란 ----
    print()
    print(f"📝 설명란 수정 시작 (이미 처리: {len(log['updated_descriptions'])}개)")
    print("-" * 60)

    # 설명란 수정
    desc_stats = {"updated": 0, "already_has_link": 0, "skip": 0, "error": 0, "not_found": 0}

    for i, video in enumerate(videos):
        result = update_video_description(youtube, video['id'], log)
        desc_stats[result] = desc_stats.get(result, 0) + 1

        status_emoji = {
            "updated": "✅", "already_has_link": "⏩", "skip": "⏭️",
            "error": "❌", "not_found": "❓"
        }
        emoji = status_emoji.get(result, "?")
        print(f"  [{i+1}/{len(videos)}] {emoji} {video['title'][:40]}... → {result}")

        if result in ("updated",):
            time.sleep(DELAY_BETWEEN_REQUESTS)

    print()
    print(f"📝 설명란 수정 완료!")
    print(f"   ✅ 수정: {desc_stats['updated']}개")
    print(f"   ⏩ 이미 있음: {desc_stats['already_has_link']}개")
    print(f"   ⏭️  건너뜀: {desc_stats['skip']}개")
    print(f"   ❌ 에러: {desc_stats['error']}개")

    print()
    print("=" * 60)
    print("🎉 모든 작업 완료!")
    print()
    print("⚠️  참고: YouTube API에서는 댓글 '고정'을 직접 지원하지 않습니다.")
    print("   채널 소유자의 댓글은 자동으로 상단에 표시되지만,")
    print("   공식 고정(핀)은 YouTube Studio에서 수동으로 해야 합니다.")
    print("=" * 60)

    # 에러 리포트
    if log['errors']:
        print()
        print(f"⚠️  에러 목록 ({len(log['errors'])}건):")
        for error in log['errors'][-10:]:  # 최근 10개만 표시
            print(f"   - {error}")


if __name__ == '__main__':
    main()
