#!/bin/bash
# 옵시디언 볼트 스냅샷 생성기
# 볼트의 모든 .md 파일을 1개 파일로 합쳐서 Claude가 한 번에 읽을 수 있게 함
# 사용: /전체보고 실행 전에 이 스크립트가 먼저 돌아감

VAULT="/Users/shinjeayoun/Library/Mobile Documents/iCloud~md~obsidian/Documents/시작. 1"
OUTPUT="$VAULT/.vault-snapshot.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# 제외 폴더/파일
EXCLUDE_DIRS="01-Memory|06-Templates|완료"
EXCLUDE_FILES="사용법.md"

echo "---" > "$OUTPUT"
echo "snapshot: $TIMESTAMP" >> "$OUTPUT"
echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"

FILE_COUNT=0

# 함수: 폴더 스캔
scan_folder() {
  local folder="$1"
  local label="$2"
  local files_found=0

  if [ ! -d "$folder" ]; then
    return
  fi

  echo "## $label" >> "$OUTPUT"
  echo "" >> "$OUTPUT"

  find "$folder" -maxdepth 1 -name "*.md" -type f | sort | while read -r file; do
    filename=$(basename "$file" .md)

    # 제외 파일 건너뛰기
    if echo "$filename" | grep -qE "$EXCLUDE_FILES"; then
      continue
    fi

    # 파일 내용 읽기 (최대 500자)
    content=$(head -c 500 "$file" | tr '\n' ' ' | sed 's/---.*---//' | sed 's/^[[:space:]]*//')

    echo "### $filename" >> "$OUTPUT"
    echo "$content" >> "$OUTPUT"
    echo "" >> "$OUTPUT"

    FILE_COUNT=$((FILE_COUNT + 1))
  done

  echo "" >> "$OUTPUT"
}

# 루트 파일 (폴더 아닌 것들)
echo "## 볼트 루트" >> "$OUTPUT"
echo "" >> "$OUTPUT"
find "$VAULT" -maxdepth 1 -name "*.md" -type f | sort | while read -r file; do
  filename=$(basename "$file" .md)
  if [ "$filename" = ".vault-snapshot" ]; then continue; fi
  content=$(head -c 500 "$file" | tr '\n' ' ' | sed 's/---.*---//' | sed 's/^[[:space:]]*//')
  echo "### $filename" >> "$OUTPUT"
  echo "$content" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  FILE_COUNT=$((FILE_COUNT + 1))
done
echo "" >> "$OUTPUT"

# 각 폴더 스캔 (제외 폴더 빼고)
for dir in "$VAULT"/*/; do
  dirname=$(basename "$dir")

  # 제외 폴더 건너뛰기
  if echo "$dirname" | grep -qE "$EXCLUDE_DIRS"; then
    continue
  fi

  # .canvas 등 비-폴더 건너뛰기
  if [ ! -d "$dir" ]; then
    continue
  fi

  scan_folder "$dir" "$dirname"

  # 하위 폴더도 스캔
  for subdir in "$dir"*/; do
    if [ -d "$subdir" ]; then
      subdirname=$(basename "$subdir")
      scan_folder "$subdir" "$dirname/$subdirname"
    fi
  done
done

# 파일 수 카운트 (정확한 수)
TOTAL=$(grep -c "^### " "$OUTPUT")
sed -i '' "s/snapshot: $TIMESTAMP/snapshot: $TIMESTAMP\nfiles: $TOTAL/" "$OUTPUT"

echo "vault-snapshot 생성 완료: $TOTAL개 파일 → $OUTPUT"
