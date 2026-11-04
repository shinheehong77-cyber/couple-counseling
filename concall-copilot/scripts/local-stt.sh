#!/usr/bin/env bash
# 로컬 전사 엔진(whisper.cpp) 켜기.
#   처음 한 번: 모델(약 550MB)과 VAD 모델을 내려받는다.
#   이후: 127.0.0.1:8178 에서 whisper-server 를 띄운다. (이 컴퓨터 안에서만 접속 가능)
#
# 환경 변수
#   WHISPER_MODEL   기본 large-v3-turbo-q5_0  (빠름·정확. 더 정확: large-v3-turbo, 더 가벼움: small)
#   MODEL_DIR       기본 ~/.concall-copilot/models
#   STT_PORT        기본 8178
#   WHISPER_SERVER  whisper-server 실행 파일 경로 (못 찾을 때 지정)
set -euo pipefail

MODEL="${WHISPER_MODEL:-large-v3-turbo-q5_0}"
MODEL_DIR="${MODEL_DIR:-$HOME/.concall-copilot/models}"
PORT="${STT_PORT:-8178}"
VAD_MODEL="silero-v5.1.2"

find_server() {
  if [[ -n "${WHISPER_SERVER:-}" && -x "$WHISPER_SERVER" ]]; then echo "$WHISPER_SERVER"; return; fi
  for name in whisper-server whisper-cpp-server; do
    if command -v "$name" >/dev/null 2>&1; then command -v "$name"; return; fi
  done
  for p in "$HOME/whisper.cpp/build/bin/whisper-server" "$HOME/.concall-copilot/whisper.cpp/build/bin/whisper-server"; do
    if [[ -x "$p" ]]; then echo "$p"; return; fi
  done
}

SERVER="$(find_server || true)"
if [[ -z "$SERVER" ]]; then
  echo "whisper-server 를 찾지 못했어요. 아래 중 하나로 설치해 주세요."
  echo
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "  brew install whisper-cpp            # 가장 쉬움 (Apple Silicon GPU 가속 포함)"
    echo
  fi
  echo "  # 또는 소스에서 빌드"
  echo "  git clone --depth 1 https://github.com/ggml-org/whisper.cpp ~/.concall-copilot/whisper.cpp"
  echo "  cmake -S ~/.concall-copilot/whisper.cpp -B ~/.concall-copilot/whisper.cpp/build -DCMAKE_BUILD_TYPE=Release"
  echo "  cmake --build ~/.concall-copilot/whisper.cpp/build -j --config Release --target whisper-server"
  exit 1
fi

mkdir -p "$MODEL_DIR"
download() {
  local url="$1" out="$2"
  if [[ -s "$out" ]]; then return; fi
  echo "내려받는 중: $(basename "$out")"
  curl -L --fail --progress-bar -o "$out.part" "$url"
  mv "$out.part" "$out"
}
download "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${MODEL}.bin" "$MODEL_DIR/ggml-${MODEL}.bin"
download "https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-${VAD_MODEL}.bin" "$MODEL_DIR/ggml-${VAD_MODEL}.bin"

THREADS="$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"
(( THREADS > 8 )) && THREADS=8

echo
echo "로컬 전사 엔진 → http://127.0.0.1:${PORT}  (모델: ${MODEL})"
echo "이 창은 켜둔 채로 다른 터미널에서 'npm start' 하세요. 끄려면 Ctrl+C"
echo
exec "$SERVER" \
  -m "$MODEL_DIR/ggml-${MODEL}.bin" \
  -l auto \
  --host 127.0.0.1 --port "$PORT" \
  -t "$THREADS" \
  -fa -sns \
  --vad -vm "$MODEL_DIR/ggml-${VAD_MODEL}.bin"
