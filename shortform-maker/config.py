"""숏폼 메이커 v2.0 — 설정값"""

import os
from pathlib import Path

# 프로젝트 루트
BASE_DIR = Path(__file__).parent

# ─── 캔버스 설정 ─────────────────────────────────────
CANVAS_WIDTH = 1080
CANVAS_HEIGHT = 1920

# ─── 레이아웃 (블랙바 모드: 원본 16:9 보존) ──────────
# 16:9 소스를 가로 1080에 맞추면 높이 = 1080 / (16/9) = 608px
# 나머지 1920 - 608 = 1312px → 상/하 정보 구역 배분
LETTERBOX_VIDEO_W = 1080
LETTERBOX_VIDEO_H = 608
LETTERBOX_TOP_ZONE = 656    # 상단 훅 구역 (0 ~ 656px)
LETTERBOX_VIDEO_Y = 656     # 영상 시작 Y좌표
LETTERBOX_BOTTOM_ZONE = 656  # 하단 자막 구역 (1264 ~ 1920px)
LETTERBOX_BOTTOM_Y = 1264   # 하단 구역 시작 Y좌표

# 안전 영역: 중앙 75% (좌우 12.5% 마진)
SAFE_AREA_MARGIN = 135  # 좌우 각 135px → 사용 가능 너비 810px
SAFE_AREA_WIDTH = CANVAS_WIDTH - (SAFE_AREA_MARGIN * 2)  # 810px

# 배경색
BG_COLOR = "black"

# ─── 훅 타이틀 스타일 (상단 구역) ─────────────────────
HOOK_TITLE_FONTSIZE = 52
HOOK_TITLE_COLOR = "white"
HOOK_TITLE_BG_COLOR = "#E4015C"  # 꿈꾸는정비사 브랜드 컬러
HOOK_TITLE_BG_OPACITY = 0.85
HOOK_TITLE_MAX_CHARS = 20  # 이 이상이면 2줄로 (블랙바 모드라 공간 넓음)
HOOK_TITLE_Y = 300  # 상단 구역 중앙 근처

# ─── 번인 자막 스타일 (하단 구역 — ASS 자막) ──────────
CAPTION_FONTSIZE = 44
CAPTION_COLOR = "&H00FFFFFF"  # ASS 흰색 (AABBGGRR)
CAPTION_HIGHLIGHT_COLOR = "&H004DE4FF"  # ASS 노란색/오렌지 하이라이트
CAPTION_OUTLINE_COLOR = "&H00000000"  # 검정 외곽선
CAPTION_OUTLINE_WIDTH = 3
CAPTION_SHADOW_DEPTH = 2
CAPTION_MAX_CHARS_PER_LINE = 15  # 한국어 기준 줄당 최대 글자 수
CAPTION_Y_OFFSET = 120  # 하단 구역 시작점에서 아래로 오프셋

# 보조 텍스트 (워터마크)
AUX_TEXT_FONTSIZE = 28
AUX_TEXT_COLOR = "#AAAAAA"
AUX_TEXT_DEFAULT = "꿈꾸는정비사"

# ─── 폰트 (환경별 자동 감지) ─────────────────────────
import platform as _platform
if _platform.system() == "Darwin":
    FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
    FONT_BOLD_INDEX = 8  # Bold weight index
    FONT_NAME = "Apple SD Gothic Neo"
else:
    # Linux/Docker: fonts-nanum 패키지 경로
    FONT_PATH = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
    FONT_BOLD_INDEX = 0
    FONT_NAME = "NanumGothic"

# ─── 숏폼 제한 ───────────────────────────────────────
MIN_CLIP_DURATION = 15  # 초
MAX_CLIP_DURATION = 60  # 초
MAX_CLIPS = 4  # 최대 후보 구간 (2~4개 알짜만)

# ─── 합성 설정 ───────────────────────────────────────
FADE_DURATION = 0.3  # 구간 합성 시 페이드 (초)

# ─── 오디오 ──────────────────────────────────────────
LUFS_TARGET = -14     # YouTube 표준 라우드니스
LUFS_LRA = 11         # Loudness Range
LUFS_TP = -1.5        # True Peak

# ─── 영상 확대 비율 ──────────────────────────────────
VIDEO_SCALE_FACTOR = 1.2  # 120% 확대 후 중앙 크롭

# ─── 다이나믹 홀드 (Ken Burns 줌 효과) ────────────────
DYNAMIC_HOLD_ENABLED = False  # 활성화 시 인코딩 시간 증가
DYNAMIC_HOLD_ZOOM_RATE = 0.0005  # 프레임당 줌 증가량
DYNAMIC_HOLD_MAX_ZOOM = 1.1  # 최대 줌 배율

# Claude 설정
CLAUDE_MODEL = "claude-sonnet-4-6"
CLAUDE_MAX_TOKENS_ANALYSIS = 4000
CLAUDE_MAX_TOKENS_COPY = 3000

# Whisper 설정
WHISPER_MODEL = "whisper-1"
WHISPER_LANGUAGE = "ko"

# Virality Score 가중치
VIRALITY_WEIGHTS = {
    "hook_power": 0.30,
    "info_value": 0.20,
    "emotion_twist": 0.15,
    "independence": 0.15,
    "consumer_desire": 0.20,
}

# 경로
KNOWLEDGE_DIR = BASE_DIR / "knowledge_base"
MATERIALS_DIR = KNOWLEDGE_DIR / "materials"
RULES_FILE = KNOWLEDGE_DIR / "rules.json"
INDEX_FILE = KNOWLEDGE_DIR / "index.json"
PROMPTS_DIR = BASE_DIR / "prompts"
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = BASE_DIR / "output"
