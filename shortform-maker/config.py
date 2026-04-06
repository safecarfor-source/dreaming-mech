"""숏폼 메이커 v1.0 — 설정값"""

import os
from pathlib import Path

# 프로젝트 루트
BASE_DIR = Path(__file__).parent

# 캔버스 설정
CANVAS_WIDTH = 1080
CANVAS_HEIGHT = 1920

# 레이아웃 비율 (상단/중앙/하단)
LAYOUT_TOP_RATIO = 0.20  # 384px
LAYOUT_MID_RATIO = 0.60  # 1152px
LAYOUT_BOT_RATIO = 0.20  # 384px

LAYOUT_TOP_PX = int(CANVAS_HEIGHT * LAYOUT_TOP_RATIO)   # 384
LAYOUT_MID_PX = int(CANVAS_HEIGHT * LAYOUT_MID_RATIO)   # 1152
LAYOUT_BOT_PX = int(CANVAS_HEIGHT * LAYOUT_BOT_RATIO)   # 384

# 배경색
BG_COLOR = "black"

# 타이틀 스타일
HOOK_TITLE_FONTSIZE = 56
HOOK_TITLE_COLOR = "white"
HOOK_TITLE_BG_COLOR = "#E4015C"  # 꿈꾸는정비사 브랜드 컬러
HOOK_TITLE_BG_OPACITY = 0.85
HOOK_TITLE_MAX_CHARS = 15  # 이 이상이면 2줄로

SUBTITLE_FONTSIZE = 40
SUBTITLE_COLOR = "white"
SUBTITLE_BG_COLOR = "black"
SUBTITLE_BG_OPACITY = 0.6

AUX_TEXT_FONTSIZE = 28
AUX_TEXT_COLOR = "#AAAAAA"
AUX_TEXT_DEFAULT = "꿈꾸는정비사"

# 폰트 (환경별 자동 감지: Docker=Nanum, Mac=AppleSDGothicNeo)
import platform as _platform
if _platform.system() == "Darwin":
    FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
    FONT_BOLD_INDEX = 8  # Bold weight index
else:
    # Linux/Docker: fonts-nanum 패키지 경로
    FONT_PATH = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
    FONT_BOLD_INDEX = 0

# 숏폼 제한
MIN_CLIP_DURATION = 15  # 초
MAX_CLIP_DURATION = 60  # 초
MAX_CLIPS = 8  # 최대 후보 구간

# 합성 설정
FADE_DURATION = 0.3  # 구간 합성 시 페이드 (초)

# Claude 설정
CLAUDE_MODEL = "claude-sonnet-4-5-20251022"
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
