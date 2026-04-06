"""교육자료 시스템 — 저장/검색/규칙 추출/프롬프트 주입"""

import json
import os
import uuid
from datetime import datetime
from pathlib import Path

import anthropic

from config import (
    CLAUDE_MODEL,
    INDEX_FILE,
    KNOWLEDGE_DIR,
    MATERIALS_DIR,
    PROMPTS_DIR,
    RULES_FILE,
)


def _ensure_dirs():
    """필요한 디렉토리/파일 생성"""
    MATERIALS_DIR.mkdir(parents=True, exist_ok=True)
    if not RULES_FILE.exists():
        RULES_FILE.write_text("[]", encoding="utf-8")
    if not INDEX_FILE.exists():
        INDEX_FILE.write_text("[]", encoding="utf-8")


def add_material(title: str, content: str, category: str = "general", source_url: str = "") -> dict:
    """교육자료 추가

    Args:
        title: 자료 제목
        content: 자료 내용 (텍스트)
        category: hook/cut/title/emotion/domain/general
        source_url: 출처 URL (선택)

    Returns:
        저장된 자료 메타데이터
    """
    _ensure_dirs()

    material_id = str(uuid.uuid4())[:8]
    material = {
        "id": material_id,
        "title": title,
        "content": content,
        "category": category,
        "source_url": source_url,
        "created_at": datetime.now().isoformat(),
    }

    # 원본 자료 저장
    material_path = MATERIALS_DIR / f"{material_id}.json"
    material_path.write_text(json.dumps(material, ensure_ascii=False, indent=2), encoding="utf-8")

    # 인덱스 업데이트
    index = _load_index()
    index.append({
        "id": material_id,
        "title": title,
        "category": category,
        "created_at": material["created_at"],
    })
    INDEX_FILE.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")

    return material


def extract_rules_from_material(material_id: str) -> list[dict]:
    """교육자료에서 숏폼 제작 규칙 자동 추출 (Claude API)

    Returns:
        추출된 규칙 리스트
    """
    _ensure_dirs()

    # 교육자료 로드
    material_path = MATERIALS_DIR / f"{material_id}.json"
    if not material_path.exists():
        raise FileNotFoundError(f"교육자료 {material_id}를 찾을 수 없습니다")

    material = json.loads(material_path.read_text(encoding="utf-8"))

    # 규칙 추출 프롬프트 로드
    prompt_path = PROMPTS_DIR / "extract_rules.txt"
    if prompt_path.exists():
        prompt_template = prompt_path.read_text(encoding="utf-8")
    else:
        prompt_template = _default_extract_rules_prompt()

    prompt = prompt_template.replace("{content}", material["content"])
    prompt = prompt.replace("{title}", material["title"])

    # Claude API 호출
    client = anthropic.Anthropic()
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    # JSON 파싱
    text = response.content[0].text
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]

    extracted = json.loads(text.strip())
    rules = extracted.get("rules", [])

    # 출처 정보 추가
    for rule in rules:
        rule["source_id"] = material_id
        rule["source_title"] = material["title"]
        rule["extracted_at"] = datetime.now().isoformat()

    # 기존 규칙에 추가
    existing_rules = load_rules()
    existing_rules.extend(rules)
    RULES_FILE.write_text(
        json.dumps(existing_rules, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return rules


def load_rules() -> list[dict]:
    """축적된 규칙 전체 로드"""
    _ensure_dirs()
    return json.loads(RULES_FILE.read_text(encoding="utf-8"))


def load_rules_for_prompt() -> str:
    """Claude 프롬프트에 주입할 규칙 텍스트 생성"""
    rules = load_rules()
    if not rules:
        return "(아직 축적된 규칙이 없습니다. 교육자료를 추가하면 규칙이 생성됩니다.)"

    lines = []
    for i, rule in enumerate(rules, 1):
        category = rule.get("category", "general")
        text = rule.get("rule", "")
        lines.append(f"{i}. [{category}] {text}")

    return "\n".join(lines)


def delete_rule(index: int) -> bool:
    """규칙 삭제 (0-based index)"""
    rules = load_rules()
    if 0 <= index < len(rules):
        rules.pop(index)
        RULES_FILE.write_text(
            json.dumps(rules, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return True
    return False


def delete_material(material_id: str) -> bool:
    """교육자료 삭제"""
    material_path = MATERIALS_DIR / f"{material_id}.json"
    if material_path.exists():
        material_path.unlink()

        # 인덱스에서 제거
        index = _load_index()
        index = [m for m in index if m["id"] != material_id]
        INDEX_FILE.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")

        # 해당 자료에서 추출된 규칙도 제거
        rules = load_rules()
        rules = [r for r in rules if r.get("source_id") != material_id]
        RULES_FILE.write_text(json.dumps(rules, ensure_ascii=False, indent=2), encoding="utf-8")

        return True
    return False


def list_materials() -> list[dict]:
    """교육자료 목록 조회"""
    _ensure_dirs()
    return _load_index()


def _load_index() -> list[dict]:
    """인덱스 로드"""
    if INDEX_FILE.exists():
        return json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    return []


def _default_extract_rules_prompt() -> str:
    """기본 규칙 추출 프롬프트"""
    return """당신은 숏폼 영상 제작 전문가입니다.

아래 교육자료에서 "숏폼 영상 제작 시 반드시 지켜야 할 규칙"을 추출하세요.

## 교육자료: {title}
{content}

## 규칙 추출 기준
- 카테고리: hook(훅/도입), cut(편집/구간), title(제목/문구), emotion(감정/반전), domain(자동차 정비 지식)
- 각 규칙은 실행 가능한 구체적 지침이어야 합니다
- 추상적인 규칙은 제외 (예: "좋은 영상을 만들자" → X)
- 구체적인 규칙만 (예: "첫 3초에 반드시 질문형 훅을 배치한다" → O)

반드시 아래 JSON 형식으로만 응답하세요:
{
  "rules": [
    {
      "rule": "규칙 내용",
      "category": "hook|cut|title|emotion|domain",
      "confidence": 0.9
    }
  ]
}"""
