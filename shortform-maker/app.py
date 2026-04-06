"""숏폼 메이커 v1.0 — Streamlit 웹 UI"""

import os
import shutil
import tempfile
import zipfile
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv

from modules.knowledge import (
    add_material,
    delete_material,
    delete_rule,
    extract_rules_from_material,
    list_materials,
    load_rules,
)
from pipeline import run_pipeline

load_dotenv()

# 페이지 설정
st.set_page_config(
    page_title="숏폼 메이커 v1.0 | 꿈꾸는정비사",
    page_icon="🎬",
    layout="wide",
)

# 커스텀 스타일
st.markdown("""
<style>
    .stApp { max-width: 1100px; margin: 0 auto; }
    .clip-card {
        background: #1a1a2e;
        border-radius: 14px;
        padding: 20px;
        margin: 12px 0;
        border: 1px solid #333;
    }
    .score-badge {
        display: inline-block;
        background: #E4015C;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 18px;
    }
    .desire-tag {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: bold;
    }
    .desire-fear { background: #FF4444; color: white; }
    .desire-curiosity { background: #7C4DFF; color: white; }
    .desire-desire { background: #00C853; color: white; }
    .rule-card {
        background: #1e1e2e;
        border-left: 4px solid;
        padding: 8px 14px;
        margin: 4px 0;
        border-radius: 0 8px 8px 0;
    }
    .rule-hook { border-color: #FF4444; }
    .rule-cut { border-color: #FF9800; }
    .rule-title { border-color: #7C4DFF; }
    .rule-emotion { border-color: #E91E63; }
    .rule-domain { border-color: #00BCD4; }
</style>
""", unsafe_allow_html=True)

# 헤더
st.title("🎬 숏폼 메이커 v1.0")
st.caption("롱폼 영상 → 숏폼 자동변환 | 소비자 욕구 기반 문구 생성 | 꿈꾸는정비사")

# API 키 확인
openai_key = os.getenv("OPENAI_API_KEY", "")
anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

# 탭 구성
tab1, tab2, tab3 = st.tabs(["🎬 숏폼 변환", "📚 교육자료", "⚙️ 설정"])

# ============================================================
# 탭 1: 숏폼 변환
# ============================================================
with tab1:
    if not anthropic_key:
        st.error("⚠️ ANTHROPIC_API_KEY가 설정되지 않았습니다. `.env` 파일을 확인하세요.")

    st.divider()

    # 영상 입력
    input_method = st.radio(
        "영상 입력 방식",
        ["YouTube 링크", "영상 파일 업로드", "로컬 경로"],
        horizontal=True,
    )

    source = None

    if input_method == "YouTube 링크":
        url = st.text_input("YouTube URL", placeholder="https://www.youtube.com/watch?v=...")
        if url:
            source = url
    elif input_method == "영상 파일 업로드":
        uploaded = st.file_uploader("영상 파일 선택", type=["mp4", "mov", "avi", "mkv"])
        if uploaded:
            tmp_dir = tempfile.mkdtemp(prefix="shortform_")
            tmp_path = os.path.join(tmp_dir, uploaded.name)
            with open(tmp_path, "wb") as f:
                f.write(uploaded.read())
            source = tmp_path
    else:
        local_path = st.text_input("영상 파일 경로", placeholder="/Users/.../video.mp4")
        if local_path and os.path.exists(local_path):
            source = local_path
        elif local_path:
            st.warning("파일을 찾을 수 없습니다.")

    # 자막 입력
    st.divider()
    subtitle_method = st.radio(
        "자막 입력 방식",
        ["자동 생성 (Whisper)", "SRT 파일 업로드", "SRT 텍스트 직접 입력"],
        horizontal=True,
        help="이미 자막 파일이 있으면 Whisper를 건너뛰어 비용을 절약합니다.",
    )

    subtitle_source = None
    subtitle_text = None

    if subtitle_method == "SRT 파일 업로드":
        srt_uploaded = st.file_uploader("SRT/VTT 파일 선택", type=["srt", "vtt"])
        if srt_uploaded:
            tmp_srt = tempfile.mktemp(suffix=".srt", prefix="shortform_")
            with open(tmp_srt, "wb") as f:
                f.write(srt_uploaded.read())
            subtitle_source = tmp_srt
    elif subtitle_method == "SRT 텍스트 직접 입력":
        subtitle_text = st.text_area(
            "SRT 자막 붙여넣기",
            placeholder="1\n00:00:01,000 --> 00:00:05,000\n자막 텍스트...",
            height=200,
        )
        if not subtitle_text or not subtitle_text.strip():
            subtitle_text = None

    if subtitle_method == "자동 생성 (Whisper)" and not openai_key:
        st.warning("⚠️ Whisper 사용을 위해 OPENAI_API_KEY가 필요합니다.")

    # 대본 입력
    with st.expander("📝 대본 입력 (선택사항 — 있으면 더 정확한 분석)"):
        script = st.text_area(
            "대본 텍스트",
            placeholder="영상 대본을 여기에 붙여넣으세요...",
            height=200,
        )
        if not script or not script.strip():
            script = None

    st.divider()

    # 변환 실행
    can_run = source is not None and anthropic_key
    if subtitle_method == "자동 생성 (Whisper)" and not openai_key:
        can_run = False

    if st.button("🚀 숏폼 변환 시작", type="primary", disabled=not can_run, use_container_width=True):
        output_dir = tempfile.mkdtemp(prefix="shortform_output_")
        st.session_state["output_dir"] = output_dir

        progress_bar = st.progress(0)
        status_text = st.empty()

        def on_progress(step, total, message):
            progress_bar.progress(step / total)
            status_text.info(f"**[{step}/{total}]** {message}")

        try:
            results = run_pipeline(
                source=source,
                output_dir=output_dir,
                subtitle_source=subtitle_source,
                subtitle_text=subtitle_text,
                script=script,
                progress_callback=on_progress,
            )
            st.session_state["results"] = results
            progress_bar.progress(1.0)
            status_text.success(f"✅ {len(results)}개 숏폼 클립 생성 완료!")
        except Exception as e:
            status_text.error(f"❌ 오류 발생: {e}")
            st.exception(e)

    # 결과 표시
    if "results" in st.session_state and st.session_state["results"]:
        results = st.session_state["results"]
        output_dir = st.session_state.get("output_dir", "")

        st.divider()
        st.subheader(f"📋 생성된 클립 ({len(results)}개) — Virality Score순")

        for clip in results:
            score = clip.get("virality_score", 0)
            desire = clip.get("primary_desire", "")
            desire_label = {"fear": "공포", "curiosity": "호기심", "desire": "욕구"}.get(desire, desire)
            desire_class = f"desire-{desire}"

            with st.container():
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.markdown(
                        f'<span class="score-badge">★ {score}점</span> '
                        f'<span class="desire-tag {desire_class}">{desire_label}</span>',
                        unsafe_allow_html=True,
                    )
                    st.markdown(f"### {clip['hook_title']}")
                    st.markdown(f"⏱️ `{clip['time_display']}` ({clip['duration']}초)")
                    if clip.get("is_composition"):
                        st.caption("🔗 합성 클립")
                    st.markdown(f"**서브타이틀:** {clip['subtitle']}")
                    st.markdown(f"**선정 이유:** {clip['reason']}")

                    # 점수 상세
                    breakdown = clip.get("score_breakdown", {})
                    if breakdown:
                        cols = st.columns(5)
                        labels = {
                            "hook_power": "훅",
                            "info_value": "정보",
                            "emotion_twist": "감정",
                            "independence": "독립",
                            "consumer_desire": "욕구",
                        }
                        for col, (key, label) in zip(cols, labels.items()):
                            val = breakdown.get(key, 0)
                            col.metric(label, val)

                with col2:
                    clip_path = clip.get("file", "")
                    if clip_path and os.path.exists(clip_path):
                        st.video(clip_path)
                        with open(clip_path, "rb") as f:
                            st.download_button(
                                "⬇️ 다운로드",
                                data=f,
                                file_name=clip["filename"],
                                mime="video/mp4",
                                key=f"dl_{clip['index']}",
                            )
                    elif clip.get("error"):
                        st.error(f"렌더링 실패: {clip['error']}")

            st.divider()

        # 전체 ZIP 다운로드
        if output_dir:
            valid_files = [c for c in results if c.get("file") and os.path.exists(c["file"])]
            if valid_files:
                zip_path = os.path.join(output_dir, "all_clips.zip")
                with zipfile.ZipFile(zip_path, "w") as zf:
                    for clip in valid_files:
                        zf.write(clip["file"], clip["filename"])
                with open(zip_path, "rb") as f:
                    st.download_button(
                        "📦 전체 다운로드 (ZIP)",
                        data=f,
                        file_name="shortform_clips.zip",
                        mime="application/zip",
                        use_container_width=True,
                    )

# ============================================================
# 탭 2: 교육자료
# ============================================================
with tab2:
    st.subheader("📚 교육자료 관리")
    st.caption("교육자료를 투입하면 AI가 숏폼 제작 규칙을 자동 추출합니다. 교육할수록 퀄리티 향상!")

    # 교육자료 투입
    with st.form("add_material_form"):
        mat_title = st.text_input("교육자료 제목", placeholder="좋은 숏폼의 조건")
        mat_category = st.selectbox(
            "카테고리",
            ["general", "hook", "cut", "title", "emotion", "domain"],
            format_func=lambda x: {
                "general": "일반",
                "hook": "훅/도입",
                "cut": "편집/구간",
                "title": "제목/문구",
                "emotion": "감정/반전",
                "domain": "자동차 정비",
            }.get(x, x),
        )
        mat_content = st.text_area(
            "내용 (텍스트 붙여넣기)",
            placeholder="숏폼 관련 교육 내용을 여기에 붙여넣으세요...",
            height=200,
        )
        mat_url = st.text_input("출처 URL (선택)", placeholder="https://...")
        submitted = st.form_submit_button("📥 교육자료 저장 + 규칙 추출", use_container_width=True)

        if submitted and mat_title and mat_content:
            with st.spinner("교육자료 저장 + AI 규칙 추출 중..."):
                try:
                    material = add_material(mat_title, mat_content, mat_category, mat_url)
                    rules = extract_rules_from_material(material["id"])
                    st.success(f"✅ 교육자료 저장 완료! {len(rules)}개 규칙 추출됨")
                    for rule in rules:
                        st.info(f"[{rule['category']}] {rule['rule']}")
                except Exception as e:
                    st.error(f"오류: {e}")

    st.divider()

    # 축적된 규칙 표시
    rules = load_rules()
    st.subheader(f"📏 축적된 규칙 ({len(rules)}개)")

    if not rules:
        st.info("아직 축적된 규칙이 없습니다. 위에서 교육자료를 추가하면 규칙이 자동 생성됩니다.")
    else:
        category_colors = {
            "hook": "🔴", "cut": "🟠", "title": "🟣", "emotion": "💖", "domain": "🔵",
        }
        for i, rule in enumerate(rules):
            cat = rule.get("category", "general")
            emoji = category_colors.get(cat, "⚪")
            col1, col2 = st.columns([10, 1])
            with col1:
                st.markdown(f"{emoji} **[{cat}]** {rule['rule']}")
                if rule.get("source_title"):
                    st.caption(f"출처: {rule['source_title']}")
            with col2:
                if st.button("🗑️", key=f"del_rule_{i}"):
                    delete_rule(i)
                    st.rerun()

    st.divider()

    # 교육자료 목록
    materials = list_materials()
    if materials:
        st.subheader(f"📂 교육자료 목록 ({len(materials)}개)")
        for mat in materials:
            col1, col2 = st.columns([10, 1])
            with col1:
                st.markdown(f"**{mat['title']}** ({mat['category']})")
                st.caption(f"ID: {mat['id']} | {mat['created_at'][:10]}")
            with col2:
                if st.button("🗑️", key=f"del_mat_{mat['id']}"):
                    delete_material(mat["id"])
                    st.rerun()

# ============================================================
# 탭 3: 설정
# ============================================================
with tab3:
    st.subheader("⚙️ 설정")

    # API 키 상태
    st.markdown("### API 키 상태")
    col1, col2 = st.columns(2)
    with col1:
        if anthropic_key:
            st.success(f"✅ Anthropic API 키: ...{anthropic_key[-8:]}")
        else:
            st.error("❌ Anthropic API 키 없음")
    with col2:
        if openai_key:
            st.success(f"✅ OpenAI API 키: ...{openai_key[-8:]}")
        else:
            st.warning("⚠️ OpenAI API 키 없음 (SRT 있으면 불필요)")

    st.divider()
    st.markdown("### 레이아웃")
    st.info("캔버스: 1080 x 1920 | 상단 20% + 중앙 60% + 하단 20%")

    st.divider()
    st.markdown("### 스타일")
    st.color_picker("훅 타이틀 배경색", value="#E4015C", disabled=True)
    st.caption("스타일 커스텀은 `config.py` 또는 `templates/overlay_styles.json`에서 변경")

    st.divider()
    st.markdown("### 시스템 정보")
    import shutil
    ffmpeg_path = shutil.which("ffmpeg")
    ytdlp_path = shutil.which("yt-dlp")
    st.text(f"FFmpeg: {ffmpeg_path or '❌ 없음'}")
    st.text(f"yt-dlp: {ytdlp_path or '❌ 없음'}")
    st.text(f"폰트: {'/System/Library/Fonts/AppleSDGothicNeo.ttc'}")
    font_exists = os.path.exists("/System/Library/Fonts/AppleSDGothicNeo.ttc")
    st.text(f"폰트 존재: {'✅' if font_exists else '❌'}")

# 푸터
st.divider()
st.caption("꿈꾸는정비사 숏폼 메이커 v1.0 | Whisper + Claude + FFmpeg | 소비자 욕구 기반 자동변환")
