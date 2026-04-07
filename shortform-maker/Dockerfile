# 숏폼 메이커 v1.0 — Production Docker Image
FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치: FFmpeg + 한국어 폰트 (Nanum)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-nanum \
    fonts-nanum-extra \
    fontconfig \
    && fc-cache -fv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    fastapi \
    uvicorn[standard] \
    python-multipart

# Black Han Sans 폰트 설치 (유튜브 숏폼용 극굵음 고딕)
COPY fonts/BlackHanSans-Regular.ttf /usr/share/fonts/truetype/blackhansans/BlackHanSans-Regular.ttf
RUN fc-cache -fv

# 소스 코드 복사
COPY . .

# 출력 디렉토리 생성
RUN mkdir -p /app/output

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
