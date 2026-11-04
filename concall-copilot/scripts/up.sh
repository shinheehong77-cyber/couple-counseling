#!/usr/bin/env bash
# 한 번에 켜기: 의존성 설치 → (있으면) 로컬 전사 엔진 → 앱 → 브라우저.
# Ctrl+C 로 모두 끈다.
set -uo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-4100}"
STT_PORT="${STT_PORT:-8178}"
URL="http://localhost:${PORT}"
# 앱이 바라볼 전사 엔진 주소 (환경 변수로 직접 지정하지 않았다면 STT_PORT 기준)
export LOCAL_STT_URL="${LOCAL_STT_URL:-http://127.0.0.1:${STT_PORT}}"
mkdir -p data/logs

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 가 필요해요. Mac: brew install node  (또는 https://nodejs.org)"
  exit 1
fi
if [[ ! -d node_modules ]]; then
  echo "처음 실행이라 필요한 패키지를 설치할게요…"
  npm install --no-audit --no-fund || exit 1
fi
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "설정 파일(.env)을 만들었어요. ANTHROPIC_API_KEY 를 넣으면 판단 카드·웹 확인이 켜져요."
fi

pids=()
cleanup() {
  echo
  echo "끄는 중…"
  for p in "${pids[@]}"; do kill "$p" 2>/dev/null; done
  wait 2>/dev/null
  exit 0
}
trap cleanup INT TERM

up() { curl -s -o /dev/null --max-time 1 "$1"; }

# 로컬 전사 엔진
if up "http://127.0.0.1:${STT_PORT}/"; then
  echo "로컬 전사 엔진: 이미 켜져 있어요."
elif command -v whisper-server >/dev/null 2>&1 || [[ -n "${WHISPER_SERVER:-}" ]]; then
  echo "로컬 전사 엔진을 켜는 중… (처음엔 모델 다운로드로 몇 분 걸려요. 기록: data/logs/stt.log)"
  STT_PORT="$STT_PORT" bash scripts/local-stt.sh >data/logs/stt.log 2>&1 &
  pids+=($!)
else
  echo "로컬 전사 엔진이 없어요 → 'brew install whisper-cpp' 후 다시 실행하면 켜져요. (지금은 데모/브라우저 인식으로 동작)"
fi

# 앱 서버
PORT="$PORT" npx tsx server/index.ts 2>&1 | tee data/logs/app.log &
pids+=($!)
for _ in $(seq 1 40); do up "$URL/api/status" && break; sleep 0.5; done

# 전사 엔진이 준비될 때까지 잠시 기다린 뒤 브라우저 열기 (최대 20초, 모델 다운로드 중이면 그냥 연다)
for _ in $(seq 1 40); do up "http://127.0.0.1:${STT_PORT}/" && break; [[ ${#pids[@]} -lt 2 ]] && break; sleep 0.5; done

if [[ "$(uname)" == "Darwin" ]]; then
  open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1
fi
echo
echo "콘콜 코파일럿 → $URL   (끄려면 Ctrl+C)"
wait
